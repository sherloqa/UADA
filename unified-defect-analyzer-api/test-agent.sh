#!/bin/bash

# 🧪 Complete Agent Testing Script
# Tests log upload, agent processing, and log classification

set -e

echo "════════════════════════════════════════════════════════════"
echo "🧪 Agent Processing Test"
echo "════════════════════════════════════════════════════════════"
echo ""

# Step 1: Upload a test log
echo "📝 Step 1: Uploading test log..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:3000/api/logs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "qa-team",
    "level": "error",
    "message": "API endpoint timeout on /api/users",
    "artifactType": "api_log",
    "artifactData": {
      "endpoint": "/api/users",
      "method": "GET",
      "statusCode": 500,
      "responseTime": 30000,
      "error": "Unhandled exception in validation middleware"
    }
  }')

echo "$UPLOAD_RESPONSE" | grep -q "success" && echo "✓ Log uploaded successfully" || echo "✗ Upload failed"

LOG_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "  Log ID: $LOG_ID"
echo ""

# Step 2: Check agent status
echo "📊 Step 2: Checking agent status..."
STATUS=$(curl -s http://localhost:3000/api/agent/status)
IS_RUNNING=$(echo "$STATUS" | grep -o '"isRunning":[^,}]*' | cut -d':' -f2)
echo "  Agent Running: $IS_RUNNING"
echo ""

# Step 3: Start agent if not running
if [ "$IS_RUNNING" = "false" ]; then
  echo "🤖 Step 3: Starting agent..."
  START_RESPONSE=$(curl -s -X POST http://localhost:3000/api/agent/start \
    -H "Content-Type: application/json" \
    -d '{"teamId":"qa-team"}')
  echo "$START_RESPONSE" | grep -q "success" && echo "✓ Agent started" || echo "✗ Failed to start agent"
else
  echo "🤖 Step 3: Agent already running"
fi
echo ""

# Step 4: Wait for processing
echo "⏳ Step 4: Waiting for agent to process logs (15 seconds)..."
for i in {1..3}; do
  sleep 5
  echo "   Waiting... ($((i*5))/15 seconds)"
done
echo "✓ Processing time elapsed"
echo ""

# Step 5: Check log status
echo "📋 Step 5: Checking processed logs..."
LOGS=$(curl -s "http://localhost:3000/api/logs?teamId=qa-team&limit=5")

# Count by status
PENDING=$(echo "$LOGS" | grep -o '"processingStatus":"pending"' | wc -l)
COMPLETED=$(echo "$LOGS" | grep -o '"processingStatus":"completed"' | wc -l)
FAILED=$(echo "$LOGS" | grep -o '"processingStatus":"failed"' | wc -l)

echo "  Pending: $PENDING"
echo "  Completed: $COMPLETED"
echo "  Failed: $FAILED"
echo ""

# Step 6: Get specific log with classification
if [ ! -z "$LOG_ID" ] && [ "$LOG_ID" != "null" ]; then
  echo "🔍 Step 6: Checking specific log classification..."
  SPECIFIC_LOG=$(curl -s "http://localhost:3000/api/logs/$LOG_ID")
  
  STATUS=$(echo "$SPECIFIC_LOG" | grep -o '"processingStatus":"[^"]*' | cut -d'"' -f4)
  CLASSIFICATION=$(echo "$SPECIFIC_LOG" | grep -o '"classification":{[^}]*}' | head -1)
  
  echo "  Processing Status: $STATUS"
  echo "  Classification: $CLASSIFICATION"
else
  echo "⚠️  Could not retrieve log ID"
fi
echo ""

# Step 7: Get statistics
echo "📊 Step 7: Agent Statistics..."
STATS=$(curl -s "http://localhost:3000/api/agent/stats/classification?teamId=qa-team" 2>/dev/null || echo "{}")
echo "  Stats: $(echo "$STATS" | head -c 200)..."
echo ""

echo "════════════════════════════════════════════════════════════"
echo "✅ Test Complete!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Summary:"
echo "  • Log uploaded and stored"
echo "  • Agent processing logs in background"
echo "  • Logs will be classified by AI agent"
echo ""
echo "Next steps:"
echo "  1. Query logs: curl 'http://localhost:3000/api/logs?teamId=qa-team'"
echo "  2. Stop agent: curl -X POST http://localhost:3000/api/agent/stop"
echo "  3. Check status: curl http://localhost:3000/api/agent/status"
echo ""
