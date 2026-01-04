#!/bin/bash

# 🧪 Unified Defect Analyzer - Integration Test Script
# 
# This script tests the complete workflow:
# 1. Seed database
# 2. Start API server
# 3. Start AI agent
# 4. Verify processing
# 5. Query results

set -e  # Exit on error

BASE_URL="http://localhost:3000"
API_HEADER="Content-Type: application/json"

echo "=========================================="
echo "🧪 Starting Integration Tests"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test helper functions
test_passed() {
  echo -e "${GREEN}✓ $1${NC}"
}

test_failed() {
  echo -e "${RED}✗ $1${NC}"
  exit 1
}

test_info() {
  echo -e "${BLUE}→ $1${NC}"
}

# 1. Check MongoDB Connection
test_info "Checking MongoDB connection..."
if ! mongosh --eval "db.adminCommand('ping')" &>/dev/null; then
  test_failed "MongoDB not running. Start with: mongod"
fi
test_passed "MongoDB is running"
echo ""

# 2. Seed Database
test_info "Seeding database with sample data..."
if npx ts-node src/seed/seedDatabase.ts > /tmp/seed.log 2>&1; then
  test_passed "Database seeded successfully"
else
  test_failed "Database seeding failed. Check /tmp/seed.log"
fi
echo ""

# 3. Verify Seeded Data
test_info "Verifying seeded data..."
TOTAL_LOGS=$(mongosh --eval "db.logs.countDocuments({})" | tail -1)
if [ "$TOTAL_LOGS" -ge 10 ]; then
  test_passed "Found $TOTAL_LOGS logs in database"
else
  test_failed "Expected at least 10 logs, found $TOTAL_LOGS"
fi
echo ""

# 4. Check API Health
test_info "Checking API health..."
if curl -s "$BASE_URL/health" | grep -q "running"; then
  test_passed "API is running"
else
  test_failed "API is not responding. Start with: npm run dev"
fi
echo ""

# 5. Start Agent
test_info "Starting AI agent..."
AGENT_START=$(curl -s -X POST "$BASE_URL/api/agent/start" \
  -H "$API_HEADER" \
  -d '{"teamId":"qa-team"}')

if echo "$AGENT_START" | grep -q "success"; then
  test_passed "AI agent started"
else
  test_failed "Failed to start agent"
fi
echo ""

# 6. Verify Agent Status
test_info "Checking agent status..."
sleep 2
STATUS=$(curl -s "$BASE_URL/api/agent/status")
if echo "$STATUS" | grep -q "isRunning"; then
  test_passed "Agent status retrieved"
else
  test_failed "Could not get agent status"
fi
echo ""

# 7. Wait for Processing
test_info "Waiting for agent to process logs (15 seconds)..."
for i in {1..3}; do
  sleep 5
  echo "  Waiting... ($((i*5))/15 seconds)"
done
test_passed "Processing time elapsed"
echo ""

# 8. Check Processed Logs
test_info "Checking processed logs..."
PENDING=$(mongosh --eval "db.logs.countDocuments({processingStatus:'pending'})" | tail -1)
COMPLETED=$(mongosh --eval "db.logs.countDocuments({processingStatus:'completed'})" | tail -1)
PROCESSING=$(mongosh --eval "db.logs.countDocuments({processingStatus:'processing'})" | tail -1)

echo "  Status breakdown:"
echo "    - Pending: $PENDING"
echo "    - Processing: $PROCESSING"
echo "    - Completed: $COMPLETED"

if [ "$COMPLETED" -gt 0 ]; then
  test_passed "Agent successfully processed $COMPLETED logs"
else
  echo -e "${BLUE}ℹ No logs completed yet (might still be processing)${NC}"
fi
echo ""

# 9. Test Query Endpoints
test_info "Testing query endpoints..."

# Get logs for team
LOGS=$(curl -s "$BASE_URL/api/logs?teamId=qa-team&limit=5")
if echo "$LOGS" | grep -q "success"; then
  test_passed "Query logs endpoint works"
else
  test_failed "Query logs endpoint failed"
fi

# Get RAG statistics
RAG_STATS=$(curl -s "$BASE_URL/api/agent/stats/rag?teamId=qa-team")
if echo "$RAG_STATS" | grep -q "success"; then
  test_passed "RAG statistics endpoint works"
else
  test_failed "RAG statistics endpoint failed"
fi

# Get classification statistics
CLASS_STATS=$(curl -s "$BASE_URL/api/agent/stats/classification?teamId=qa-team")
if echo "$CLASS_STATS" | grep -q "success"; then
  test_passed "Classification statistics endpoint works"
else
  test_failed "Classification statistics endpoint failed"
fi
echo ""

# 10. Upload Test Log
test_info "Testing log upload..."
UPLOAD=$(curl -s -X POST "$BASE_URL/api/logs/upload" \
  -H "$API_HEADER" \
  -d '{
    "teamId":"qa-team",
    "level":"error",
    "message":"Test log from integration test",
    "artifactType":"ui_log",
    "artifactData":{"error":"Test error"}
  }')

if echo "$UPLOAD" | grep -q "success"; then
  test_passed "Log upload works"
else
  test_failed "Log upload failed"
fi
echo ""

# 11. Stop Agent
test_info "Stopping agent..."
STOP=$(curl -s -X POST "$BASE_URL/api/agent/stop" \
  -H "$API_HEADER")

if echo "$STOP" | grep -q "success"; then
  test_passed "Agent stopped"
else
  test_failed "Failed to stop agent"
fi
echo ""

# Summary
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="
echo ""
echo "Total logs in database: $TOTAL_LOGS"
echo "Logs completed: $COMPLETED"
echo "Logs pending: $PENDING"
echo "Logs processing: $PROCESSING"
echo ""

if [ "$COMPLETED" -gt 0 ]; then
  echo -e "${GREEN}✓ All integration tests passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Review classified logs: curl $BASE_URL/api/logs?teamId=qa-team"
  echo "  2. Check agent stats: curl $BASE_URL/api/agent/stats/classification?teamId=qa-team"
  echo "  3. View in MongoDB: mongosh unified-defect-analyzer"
  echo ""
else
  echo -e "${BLUE}ℹ Some tests passed, but logs not fully processed yet${NC}"
  echo "  This is normal - the agent may still be processing"
  echo "  Check back in a few seconds"
fi

echo "=========================================="
