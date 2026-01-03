# Quick Start Guide - Unified Defect Analyzer API

## 🚀 Get Started in 5 Minutes

### Step 1: Install & Setup

```bash
# Navigate to the API directory
cd unified-defect-analyzer-api

# Dependencies are already installed
# Just verify with:
npm install

# Check .env file exists (already configured)
ls .env.example
```

### Step 2: Start MongoDB (if local)

```bash
# Option 1: Local MongoDB
mongod

# Option 2: Use MongoDB Atlas (cloud)
# Update .env with your Atlas connection string
```

### Step 3: Start the API

```bash
# Development mode (with auto-reload)
npm run dev

# You should see:
# ✓ MongoDB connected successfully
# ✓ Server: http://localhost:3000
# ✓ Health Check: http://localhost:3000/health
```

### Step 4: Test the API

```bash
# Test 1: Health check
curl http://localhost:3000/health

# Expected response:
{
  "success": true,
  "message": "Unified Defect Analyzer API is running",
  "timestamp": "2026-01-03T10:30:00.000Z"
}

# Test 2: Upload a simple log
curl -X POST http://localhost:3000/api/logs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "test-team",
    "level": "error",
    "message": "Sample test failure",
    "artifactType": "ui_log",
    "artifactData": {
      "error": "Element not found",
      "selector": "#login-button"
    },
    "context": {
      "testName": "Login Test",
      "browser": "Chrome"
    }
  }'

# Expected response:
{
  "success": true,
  "message": "Log uploaded successfully",
  "data": {
    "logId": "65f1a2b3c4d5e6f7a8b9c0d1",
    "teamId": "test-team",
    "artifactType": "ui_log",
    "processingStatus": "pending",
    "timestamp": "2026-01-03T10:30:00.000Z"
  }
}

# Test 3: Query the log you just created
curl "http://localhost:3000/api/logs?teamId=test-team"
```

## 📊 Common Use Cases

### Use Case 1: Upload Test Failure with Screenshot

```bash
curl -X POST http://localhost:3000/api/logs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "qa-team",
    "testRunId": "run-001",
    "failureId": "fail-001",
    "level": "error",
    "message": "Login button not clickable",
    "artifactType": "screenshot",
    "artifactData": {
      "imageBase64": "iVBORw0KGgoAAAANS...",
      "width": 1920,
      "height": 1080
    },
    "context": {
      "testName": "User Login Flow",
      "testSuite": "Authentication",
      "environment": "staging",
      "browser": "Chrome 120",
      "platform": "Windows 11",
      "buildNumber": "1.2.3"
    }
  }'
```

### Use Case 2: Upload HAR File from API Test

```bash
curl -X POST http://localhost:3000/api/logs/upload \
  -H "Content-Type: application/json" \
  -d @har-example.json
```

**har-example.json**:
```json
{
  "teamId": "api-team",
  "testRunId": "api-run-001",
  "level": "error",
  "message": "Payment API returned 500",
  "artifactType": "har",
  "artifactData": {
    "log": {
      "version": "1.2",
      "entries": [
        {
          "request": {
            "method": "POST",
            "url": "https://api.example.com/payment"
          },
          "response": {
            "status": 500,
            "statusText": "Internal Server Error"
          }
        }
      ]
    }
  },
  "context": {
    "testName": "Payment Processing",
    "environment": "production"
  }
}
```

### Use Case 3: Bulk Upload Multiple Logs

```bash
curl -X POST http://localhost:3000/api/logs/upload/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "logs": [
      {
        "teamId": "qa-team",
        "level": "error",
        "message": "Test 1 failed",
        "artifactType": "ui_log",
        "artifactData": {"error": "Timeout"}
      },
      {
        "teamId": "qa-team",
        "level": "error",
        "message": "Test 2 failed",
        "artifactType": "api_log",
        "artifactData": {"statusCode": 404}
      },
      {
        "teamId": "qa-team",
        "level": "warn",
        "message": "Test 3 slow",
        "artifactType": "test_result",
        "artifactData": {"duration": 10000}
      }
    ]
  }'
```

### Use Case 4: Query Logs for Analysis

```bash
# Get all errors from last 24 hours
curl "http://localhost:3000/api/logs?teamId=qa-team&level=error&startDate=2026-01-02T00:00:00Z"

# Get all logs for a specific test run
curl "http://localhost:3000/api/logs/testrun/run-001?teamId=qa-team"

# Get pending logs for AI processing
curl "http://localhost:3000/api/logs/pending?teamId=qa-team&limit=50"

# Get statistics for dashboard
curl "http://localhost:3000/api/logs/stats?teamId=qa-team&days=7"
```

### Use Case 5: Update Log Status (AI Agent Workflow)

```bash
# Step 1: Get pending logs
LOGS=$(curl "http://localhost:3000/api/logs/pending?teamId=qa-team")

# Step 2: Extract log ID (using jq)
LOG_ID=$(echo $LOGS | jq -r '.data.logs[0]._id')

# Step 3: Mark as processing
curl -X PUT "http://localhost:3000/api/logs/$LOG_ID/status" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "qa-team",
    "status": "processing"
  }'

# Step 4: (AI performs analysis here)

# Step 5: Update classification
curl -X PUT "http://localhost:3000/api/logs/$LOG_ID/classification" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "qa-team",
    "classification": {
      "isDefect": true,
      "defectType": "UI Bug",
      "confidence": "high",
      "severity": "high"
    }
  }'

# Step 6: Mark as completed
curl -X PUT "http://localhost:3000/api/logs/$LOG_ID/status" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "qa-team",
    "status": "completed"
  }'
```

## 🧪 Testing with Postman

1. **Import Collection**:
   - Open Postman
   - Import `postman_collection.json`
   - Set variable `baseUrl = http://localhost:3000`

2. **Run Requests**:
   - Health Check
   - Upload Single Log - UI Log
   - Query Logs - All
   - Get Log by ID

## 🐛 Troubleshooting

### MongoDB Connection Failed

```bash
# Error: MongoDB connection failed
# Solution 1: Check MongoDB is running
mongod

# Solution 2: Check .env file
cat .env
# Make sure MONGODB_URI is correct

# Solution 3: Test connection
mongo
```

### Port Already in Use

```bash
# Error: Port 3000 already in use
# Solution: Change port in .env
PORT=3001

# Or find and kill the process
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill
```

### Validation Errors

```bash
# Error: "teamId is required"
# Solution: Always include teamId in requests

# Correct:
{
  "teamId": "my-team",  # ✓ Required
  "level": "error",     # ✓ Required
  "message": "...",     # ✓ Required
  "artifactType": "ui_log",  # ✓ Required
  "artifactData": {}    # ✓ Required
}
```

## 📚 Next Steps

1. ✅ API is running and tested
2. ➡️ Review [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for all endpoints
3. ➡️ Check [README_NEW.md](./README_NEW.md) for architecture details
4. ➡️ Start building your AI agent integration
5. ➡️ Refer to Technical Architecture for Phase 2 requirements

## 🎯 Common Commands

```bash
# Development
npm run dev           # Start with auto-reload

# Production
npm run build        # Compile TypeScript
npm start            # Run compiled code

# Testing
npm test             # Run all tests
npm run test:watch   # Watch mode

# Utilities
npm run lint         # Check code style
```

## 🔑 Key Concepts

### Artifact Types
- `ui_log` - Frontend logs and errors
- `screenshot` - UI screenshots
- `har` - HTTP Archive (network captures)
- `backend_log` - Server logs
- `api_log` - API test logs
- `test_result` - Test execution results
- `video` - Screen recordings
- `network_trace` - Network traces

### Processing Status
- `pending` - Uploaded, awaiting AI processing
- `processing` - Currently being analyzed by AI
- `completed` - Analysis complete
- `failed` - Processing error

### Log Levels
- `info` - Informational
- `warn` - Warning
- `error` - Error
- `debug` - Debug
- `critical` - Critical failure

## 💡 Tips

1. **Always include `teamId`** - Required for multi-tenant isolation
2. **Use `testRunId`** - Links related logs together
3. **Add rich context** - Helps AI agents with analysis
4. **Check processing status** - Monitor AI agent progress
5. **Use bulk upload** - More efficient for multiple logs

---

✅ **You're ready to use the API!**

For detailed documentation, see:
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- [README_NEW.md](./README_NEW.md)
