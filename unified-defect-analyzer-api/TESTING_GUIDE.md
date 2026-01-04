# 🧪 Unified Defect Analyzer - Complete Testing Guide

This guide covers all aspects of testing the Unified Defect Analyzer API and Phase 2 AI Agent Service.

## Table of Contents

1. [Quick Start Testing](#quick-start-testing)
2. [Seeding Database](#seeding-database)
3. [Running Tests](#running-tests)
4. [Integration Testing](#integration-testing)
5. [Manual Testing](#manual-testing)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start Testing

### Prerequisites

```bash
# Ensure Node.js 16+ and MongoDB are installed
node --version  # Should be v16+
mongod --version

# Start MongoDB (if not running)
# macOS with Homebrew
brew services start mongodb-community

# Or run MongoDB in Docker
docker run -d -p 27017:27017 mongo:7.0
```

### One-Command Test Setup

```bash
# 1. Install dependencies
npm install

# 2. Seed database with sample data
npx ts-node src/seed/seedDatabase.ts

# 3. Run integration tests
npm test

# 4. Run in watch mode for development
npm run dev
```

---

## Seeding Database

### Option 1: TypeScript Script (Recommended)

```bash
npx ts-node src/seed/seedDatabase.ts
```

**What this does:**
- ✅ Connects to MongoDB
- ✅ Clears previous test data
- ✅ Inserts 10 sample logs across 3 teams
- ✅ Generates 384-dimensional embeddings
- ✅ Creates optimized database indexes
- ✅ Displays summary statistics

**Output:**
```
Connected to database: mongodb://localhost:27017/unified-defect-analyzer
Clearing existing logs...
Inserted 10 sample logs
Generated embeddings: 10 logs
Created indexes: 5 indexes
=====================================
📊 Seeding Summary
=====================================
Total logs: 10
Logs by team:
  - qa-team: 6 logs
  - api-team: 3 logs
  - backend-team: 1 log
Logs by status:
  - pending: 8 logs
  - completed: 2 logs
Logs by artifact type:
  - ui_log: 4
  - api_response: 3
  - backend_log: 2
  - screenshot: 1
```

### Option 2: MongoDB Shell (Manual)

```bash
# Open MongoDB shell
mongosh

# Select database
use unified-defect-analyzer

# Insert sample log
db.logs.insertOne({
  teamId: "qa-team",
  level: "error",
  message: "Login button not responding",
  artifactType: "screenshot",
  artifactData: {
    url: "https://example.com/login",
    timestamp: new Date()
  },
  processingStatus: "pending",
  createdAt: new Date()
})

# Create index
db.logs.createIndex({ teamId: 1, createdAt: -1 })
```

### Option 3: Docker Compose

```bash
# Coming soon - full Docker setup with MongoDB
docker-compose up -d
npm run seed
```

---

## Running Tests

### Unit Tests

```bash
# Run all tests once
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test logs.test.ts

# Watch mode
npm test -- --watch
```

### Test Files

- [logs.test.ts](tests/logs/logs.test.ts) - Log creation and retrieval
- [logsService.test.ts](tests/logs/logsService.test.ts) - Service layer logic

---

## Integration Testing

### Automated Integration Tests

```bash
# Run the complete integration test script
./test-integration.sh
```

**What it tests:**
1. ✅ MongoDB connection
2. ✅ Database seeding
3. ✅ API health
4. ✅ Agent startup
5. ✅ Log processing
6. ✅ Query endpoints
7. ✅ Log upload
8. ✅ Agent shutdown

**Expected Output:**
```
✓ MongoDB is running
✓ Database seeded successfully
✓ Found 10 logs in database
✓ API is running
✓ AI agent started
✓ Agent status retrieved
✓ Agent successfully processed 2 logs
✓ Query logs endpoint works
✓ RAG statistics endpoint works
✓ Classification statistics endpoint works
✓ Log upload works
✓ Agent stopped

📊 Test Summary
================
Total logs in database: 10
Logs completed: 2
Logs pending: 8
Logs processing: 0

✓ All integration tests passed!
```

---

## Manual Testing

### Setup Local Server

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start API Server
npm run dev

# Terminal 3: Seed database
npx ts-node src/seed/seedDatabase.ts

# Terminal 3: Run agent
npx ts-node src/seed/seedDatabase.ts  # Already started in Terminal 2
```

### Test Phase 1: Log Management (11 endpoints)

#### 1. Upload Log
```bash
curl -X POST http://localhost:3000/api/logs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "qa-team",
    "level": "error",
    "message": "Login button not responding on mobile",
    "artifactType": "ui_log",
    "artifactData": {
      "url": "https://example.com/login",
      "userAgent": "Mozilla/5.0 (iPhone...)"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Log uploaded successfully",
  "logId": "507f1f77bcf86cd799439011"
}
```

#### 2. Get Log
```bash
curl http://localhost:3000/api/logs/{logId}
```

#### 3. Get Logs by Team
```bash
curl "http://localhost:3000/api/logs?teamId=qa-team&limit=10&offset=0"
```

#### 4. Get Logs by Status
```bash
curl "http://localhost:3000/api/logs?status=pending&teamId=qa-team"
```

#### 5. Get Statistics
```bash
curl "http://localhost:3000/api/logs/stats?teamId=qa-team"
```

#### 6. Update Log Status
```bash
curl -X PUT http://localhost:3000/api/logs/{logId} \
  -H "Content-Type: application/json" \
  -d '{
    "processingStatus": "completed",
    "classification": {
      "defectType": "ui_bug",
      "severity": "high",
      "confidence": 0.95
    }
  }'
```

#### 7. Delete Log
```bash
curl -X DELETE http://localhost:3000/api/logs/{logId}
```

---

### Test Phase 2: AI Agent Service (9 endpoints)

#### 1. Start Agent
```bash
curl -X POST http://localhost:3000/api/agent/start \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "qa-team",
    "processingInterval": 5000
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Agent started successfully",
  "agentId": "agent_507f1f77bcf86cd799439011"
}
```

#### 2. Get Agent Status
```bash
curl http://localhost:3000/api/agent/status
```

**Expected Response:**
```json
{
  "success": true,
  "status": {
    "isRunning": true,
    "agentId": "agent_507f1f77bcf86cd799439011",
    "teamId": "qa-team",
    "logsProcessed": 2,
    "logsRemaining": 8,
    "uptime": 15000
  }
}
```

#### 3. Process Pending Logs
```bash
curl -X POST http://localhost:3000/api/agent/process-pending \
  -H "Content-Type: application/json" \
  -d '{"teamId": "qa-team"}'
```

#### 4. Stop Agent
```bash
curl -X POST http://localhost:3000/api/agent/stop \
  -H "Content-Type: application/json"
```

#### 5. Get RAG Statistics
```bash
curl "http://localhost:3000/api/agent/stats/rag?teamId=qa-team"
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "totalRetrieval": 10,
    "avgSimilarity": 0.78,
    "topMatches": 3,
    "artifactType": {
      "ui_log": 4,
      "api_response": 3,
      "backend_log": 2,
      "screenshot": 1
    }
  }
}
```

#### 6. Get Classification Statistics
```bash
curl "http://localhost:3000/api/agent/stats/classification?teamId=qa-team"
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "totalClassified": 10,
    "byDefectType": {
      "ui_bug": 4,
      "api_error": 3,
      "backend_error": 2,
      "timeout": 1
    },
    "bySeverity": {
      "high": 5,
      "medium": 3,
      "low": 2
    },
    "confidenceMetrics": {
      "avgConfidence": 0.87,
      "minConfidence": 0.72,
      "maxConfidence": 0.98
    }
  }
}
```

#### 7. Configure Agent
```bash
curl -X PUT http://localhost:3000/api/agent/config \
  -H "Content-Type: application/json" \
  -d '{
    "processingInterval": 10000,
    "batchSize": 5,
    "similarityThreshold": 0.7
  }'
```

#### 8. Get Configuration
```bash
curl http://localhost:3000/api/agent/config
```

#### 9. Reset Agent
```bash
curl -X POST http://localhost:3000/api/agent/reset \
  -H "Content-Type: application/json"
```

---

### Test Scenarios

#### Scenario 1: RAG Similarity Search
```bash
# 1. Seed database with logs about UI bugs
npx ts-node src/seed/seedDatabase.ts

# 2. Upload similar log
curl -X POST http://localhost:3000/api/logs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "qa-team",
    "level": "error",
    "message": "Login form not responding",
    "artifactType": "ui_log",
    "artifactData": {"error": "DOM element unresponsive"}
  }'

# 3. Start agent and watch RAG find similar issues
curl -X POST http://localhost:3000/api/agent/start \
  -H "Content-Type: application/json" \
  -d '{"teamId": "qa-team"}'

# 4. Check RAG stats after processing
curl "http://localhost:3000/api/agent/stats/rag?teamId=qa-team"
```

#### Scenario 2: Classification With Context
```bash
# 1. Upload API error log
curl -X POST http://localhost:3000/api/logs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "api-team",
    "level": "error",
    "message": "500 Internal Server Error on /api/users",
    "artifactType": "api_response",
    "artifactData": {
      "statusCode": 500,
      "endpoint": "/api/users",
      "method": "GET"
    }
  }'

# 2. Agent retrieves similar issues via RAG
# 3. Uses those as context for classification
# 4. Check classification results
curl "http://localhost:3000/api/agent/stats/classification?teamId=api-team"
```

#### Scenario 3: Flaky Test Detection
```bash
# 1. Upload flaky test logs (multiple similar failures)
curl -X POST http://localhost:3000/api/logs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "qa-team",
    "level": "error",
    "message": "Test timeout on slow network (flaky)",
    "artifactType": "backend_log",
    "artifactData": {
      "testName": "test_payment_processing",
      "failureCount": 5,
      "totalRuns": 10
    }
  }'

# 2. Agent identifies pattern
# 3. Marks as "flaky_test" in classification
```

---

## MongoDB Verification

### Check Database State

```bash
# Open MongoDB shell
mongosh

# Select database
use unified-defect-analyzer

# Count total logs
db.logs.countDocuments({})

# Count by status
db.logs.countDocuments({processingStatus: "pending"})
db.logs.countDocuments({processingStatus: "completed"})

# Count by team
db.logs.countDocuments({teamId: "qa-team"})

# View sample log
db.logs.findOne()

# View indexes
db.logs.getIndexes()

# Get statistics
db.logs.aggregate([
  {
    $group: {
      _id: "$processingStatus",
      count: {$sum: 1}
    }
  }
])
```

### Clear Test Data

```bash
# Delete all logs
mongosh
use unified-defect-analyzer
db.logs.deleteMany({})

# Drop indexes
db.logs.dropIndexes()

# Verify clean state
db.logs.countDocuments({})  # Should return 0
```

---

## Troubleshooting

### MongoDB Connection Failed

```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB
# macOS
brew services start mongodb-community

# Docker
docker run -d -p 27017:27017 mongo:7.0

# Verify connection
mongosh --eval "db.adminCommand('ping')"
```

### API Server Not Starting

```bash
# Check port 3000 is available
lsof -i :3000

# Kill process using port 3000
kill -9 <PID>

# Try with different port
PORT=3001 npm run dev
```

### Tests Failing

```bash
# 1. Clear test data
npx ts-node src/seed/seedDatabase.ts

# 2. Check logs
tail -f logs/app.log

# 3. Run with verbose output
npm test -- --verbose

# 4. Check TypeScript compilation
npm run build
```

### Agent Not Processing Logs

```bash
# 1. Verify logs exist in database
mongosh
use unified-defect-analyzer
db.logs.find({processingStatus: "pending"}).count()

# 2. Check agent status
curl http://localhost:3000/api/agent/status

# 3. Restart agent
curl -X POST http://localhost:3000/api/agent/stop
curl -X POST http://localhost:3000/api/agent/start

# 4. Check server logs
tail -f logs/app.log
```

### Embedding Generation Failed

```bash
# 1. Verify ragService is working
# Check src/services/ragService.ts

# 2. Test embedding generation directly
npx ts-node -e "
import ragService from './src/services/ragService';
const emb = ragService.getEmbedding('test');
console.log(emb.length);  // Should be 384
"

# 3. Check API dependencies
npm list axios
npm list openai
```

---

## Performance Benchmarks

### Expected Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Database Seed | 2-3s | 10 logs + embeddings |
| Log Upload | 100-200ms | Single log insertion |
| RAG Similarity Search | 50-100ms | Against 10 logs |
| Classification | 100-300ms | Depends on complexity |
| Batch Processing | 2-5s | 8-10 logs with RAG |

### Resource Requirements

- **CPU**: 1+ cores
- **RAM**: 500MB+ (MongoDB + Node.js)
- **Disk**: 100MB+ (MongoDB data)
- **Network**: For OpenAI/Claude vision API calls

---

## Next Steps

After successful testing:

1. ✅ Deploy to staging environment
2. ✅ Integrate with real Jira instance
3. ✅ Connect OpenAI/Claude for vision analysis
4. ✅ Set up production MongoDB
5. ✅ Configure alerting for defect detection
6. ✅ Build analytics dashboard

---

## Support

For issues or questions:

1. Check [TROUBLESHOOTING](#troubleshooting) section
2. Review logs in `logs/app.log`
3. Check MongoDB state with `mongosh`
4. Review [PHASE2_IMPLEMENTATION.md](PHASE2_IMPLEMENTATION.md) for API details
5. Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for endpoint specs

---

Last Updated: 2024
Version: 2.0 (Phase 2 Complete)
