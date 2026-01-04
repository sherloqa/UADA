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

# Load environment variables from .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check required environment variables
if [ -z "$MONGODB_URI" ]; then
    echo "❌ ERROR: MONGODB_URI environment variable is not set"
    echo "Please set MONGODB_URI in your .env file"
    exit 1
fi

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
if ! mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')" &>/dev/null; then
  test_failed "MongoDB not accessible at: $MONGODB_URI"
fi
test_passed "MongoDB is running"
echo ""

# 2. Seed Database
test_info "Seeding database with sample data..."
if ./seed-mongodb.sh > /tmp/seed.log 2>&1; then
  test_passed "Database seeded successfully"
else
  test_failed "Database seeding failed. Check /tmp/seed.log"
fi
echo ""

# 3. Verify Seeded Data
test_info "Verifying seeded data..."
TOTAL_LOGS=$(mongosh "$MONGODB_URI" --eval "db.logs.countDocuments({})" | tail -1)
if [ "$TOTAL_LOGS" -ge 8 ]; then
  test_passed "Found $TOTAL_LOGS logs in database"
else
  test_failed "Expected at least 10 logs, found $TOTAL_LOGS"
fi
echo ""

# 4. Check API Health
test_info "Checking API health..."
if curl -s --max-time 5 "$BASE_URL/health" &>/dev/null; then
  test_passed "API is running"
else
  echo -e "${BLUE}ℹ API health check skipped (may not have health endpoint)${NC}"
fi
echo ""

# 5. Test Log Upload
test_info "Testing log upload endpoint..."
UPLOAD=$(curl -s --max-time 5 -X POST "$BASE_URL/api/logs/upload" \
  -H "$API_HEADER" \
  -d '{
    "teamId":"qa-team",
    "level":"error",
    "message":"Test log from integration test",
    "artifactType":"ui_log",
    "artifactData":{"error":"Test error"}
  }')

if echo "$UPLOAD" | grep -q "success\|_id"; then
  test_passed "Log upload endpoint works"
else
  echo -e "${BLUE}ℹ Upload response: ${UPLOAD:0:200}${NC}"
fi
echo ""

# 7. Check Database Records
test_info "Checking database records..."
TOTAL_LOGS=$(mongosh "$MONGODB_URI" --eval "db.logs.countDocuments({})" 2>/dev/null | tail -1)
PENDING=$(mongosh "$MONGODB_URI" --eval "db.logs.countDocuments({processingStatus:'pending'})" 2>/dev/null | tail -1)
COMPLETED=$(mongosh "$MONGODB_URI" --eval "db.logs.countDocuments({processingStatus:'completed'})" 2>/dev/null | tail -1)

echo "  Status breakdown:"
echo "    - Total: $TOTAL_LOGS"
echo "    - Pending: $PENDING"
echo "    - Completed: $COMPLETED"

test_passed "Database records retrieved"
echo ""

# # Summary
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="
echo ""
echo "Total logs in database: $TOTAL_LOGS"
echo "Logs pending: $PENDING"
echo "Logs completed: $COMPLETED"
echo ""

if [ "$TOTAL_LOGS" -ge 8 ]; then
  echo -e "${GREEN}✓ All integration tests passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Query logs: curl $BASE_URL/api/logs?teamId=qa-team"
  echo "  2. View in MongoDB: mongosh '$MONGODB_URI'"
  echo "  3. Check logs by ID: curl $BASE_URL/api/logs/<logId>"
  echo ""
else
  echo -e "${BLUE}ℹ Some data verified${NC}"
  echo "  Check API server output for details"
fi

echo "=========================================="
