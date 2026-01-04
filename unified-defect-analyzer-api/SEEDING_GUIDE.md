````markdown
# 🌱 MongoDB Database Seeding Guide

## Overview

This guide explains how to populate MongoDB with test data and embeddings for the Unified Defect Analyzer AI Agent Service.

---

## 📦 What Gets Seeded

### 10 Sample Test Logs

The seeding script creates 10 realistic test logs covering:

1. **UI Bug** (Missing Element)
   - Type: ui_log with screenshot
   - Error: "Submit button not visible"
   - Status: pending (for agent analysis)

2. **API Error** (500 Status)
   - Type: har (network capture)
   - Error: Payment API returned 500
   - Status: pending

3. **Backend Error** (Stack Trace)
   - Type: backend_log
   - Error: Database connection timeout
   - Status: pending

4. **UI Error** (Console Errors)
   - Type: ui_log
   - Error: Uncaught TypeError
   - Status: pending

5. **API Error** (404 Status)
   - Type: api_log
   - Error: User endpoint not found
   - Status: pending

6. **Timeout Error**
   - Type: test_result
   - Error: Operation took too long
   - Status: pending

7. **Network Error**
   - Type: har
   - Error: Failed to connect
   - Status: pending

8. **Mobile UI Bug** (Already Processed)
   - Type: screenshot
   - Status: completed
   - Has classification

9. **Flaky Test** (Already Processed)
   - Type: ui_log
   - Status: completed
   - Marked as flaky

10. **Authentication Error**
    - Type: api_log
    - Error: Token expired
    - Status: pending

### 384-Dimensional Embeddings

Each log gets a vector embedding for RAG:
- Generated from log message
- Supports semantic similarity search
- Used for finding similar past issues

### Database Indexes

Automatically created for:
- Fast team queries: `{teamId: 1, timestamp: -1}`
- Test run correlation: `{teamId: 1, testRunId: 1}`
- Artifact type filtering: `{teamId: 1, artifactType: 1}`
- Processing status: `{teamId: 1, processingStatus: 1}`
- Full-text search: `{message: "text"}`

---

## 🚀 Quick Start

### Option 1: Run Seeding Script (Recommended)

```bash
# 1. Make sure MongoDB is running
mongod

# 2. Run the seeding script
npx ts-node src/seed/seedDatabase.ts

# Expected output:
# 🌱 Starting MongoDB Database Seeding
# Connected to MongoDB
# Inserting 10 sample logs...
# Successfully inserted 10 logs
# Generating embeddings for 10 logs...
# Creating database indexes...
# 
# 📊 SEEDING SUMMARY
# Total logs: 10
# By Team:
#   qa-team: 6 logs
#   api-team: 3 logs
#   backend-team: 1 log
# ...
```

### Option 2: Seeding with Docker

```bash
# Build the project
npm run build

# Run with Docker
docker-compose up -d mongodb

# Run seeding in Docker
docker exec unified-api npx ts-node src/seed/seedDatabase.ts
```

### Option 3: Manual Seeding (Advanced)

```bash
# 1. Connect to MongoDB shell
mongo mongodb://localhost:27017/unified-defect-analyzer

# 2. Import the sample logs
db.logs.insertMany([...])

# 3. Create indexes
db.logs.createIndex({ teamId: 1, timestamp: -1 })
db.logs.createIndex({ message: "text" })
```

---

## 📊 Test Data Teams

### qa-team (6 logs)
- Focus: UI/frontend testing
- Logs: ui_log, screenshot, test_result
- Status: Mix of pending and completed

### api-team (3 logs)
- Focus: API testing
- Logs: har, api_log
- Status: Mostly pending

### backend-team (2 logs)
- Focus: Backend/server testing
- Logs: backend_log, api_log
- Status: Pending

---

## 🎯 Using Seeded Data for Testing

### Test the RAG Service

```bash
# Upload a new log similar to existing ones
curl -X POST http://localhost:3000/api/logs/upload \
  -d '{
    "teamId": "qa-team",
    "message": "Login form not responding to clicks",
    "artifactType": "ui_log"
  }'

# Start the agent
curl -X POST http://localhost:3000/api/agent/start

# The RAG service will find similar logs:
# - "Submit button not visible on login page"
# - "Login button not responsive on mobile"
```

### Test Classification Service

```bash
# Query logs with existing classifications
curl "http://localhost:3000/api/logs?teamId=qa-team&processingStatus=completed"

# Returns logs with:
# {
#   "classification": {
#     "defectType": "ui_bug",
#     "severity": "high",
#     "confidence": "high",
#     "rootCauseAnalysis": "...",
#     "recommendations": [...]
#   }
# }
```

### Test Agent Processing

```bash
# Start agent
curl -X POST http://localhost:3000/api/agent/start

# Agent will process pending logs (8 of them)
# After 5-10 seconds, query results:
curl "http://localhost:3000/api/logs?teamId=qa-team&processingStatus=completed"

# All logs should now have classifications
```

---

## 📈 Sample Data Statistics

| Metric | Count |
|--------|-------|
| Total Logs | 10 |
| Pending | 8 |
| Completed | 2 |
| Teams | 3 |
| Artifact Types | 6 |
| Defect Types | 9 |

### Artifact Type Distribution

```
ui_log       → 3 (30%)
har          → 2 (20%)
screenshot   → 1 (10%)
backend_log  → 1 (10%)
api_log      → 2 (20%)
test_result  → 1 (10%)
```

### Team Distribution

```
qa-team:      6 logs (60%)
api-team:     3 logs (30%)
backend-team: 1 log  (10%)
```

---

## 🔧 Customizing Seeded Data

### Add More Test Logs

Edit `src/seed/seedDatabase.ts`:

```typescript
const sampleLogs = [
  // Existing logs...
  
  // Add your own
  {
    teamId: 'my-team',
    level: 'error',
    message: 'Custom error message',
    artifactType: 'ui_log',
    artifactData: { /* your data */ },
    // ... more fields
  }
];
```

### Change Seeding Behavior

```typescript
// Clear database before seeding (destructive!)
// Uncomment this line in the seed() function:
await clearDatabase();

// This is useful for:
// - Testing data cleanup
// - Starting fresh
// - Removing old test data
```

### Generate Custom Embeddings

```typescript
import { embeddingsDataset } from './src/seed/embeddingsDataset';

// Search similar embeddings
const similar = embeddingsDataset.searchSimilarEmbeddings(
  myEmbedding,
  0.75 // threshold
);

// Get by defect type
const uiBugs = embeddingsDataset.getEmbeddingsByDefectType('ui_bug');

// Get statistics
const stats = embeddingsDataset.getEmbeddingsStatistics();
```

---

## 🧪 Testing Scenarios

### Scenario 1: RAG Similarity Search

**Setup**: Seeded data already in MongoDB

**Test**:
```bash
# 1. Query similar logs using RAG
curl "http://localhost:3000/api/agent/stats/rag?teamId=qa-team"

# 2. Upload similar log
curl -X POST http://localhost:3000/api/logs/upload \
  -d '{
    "teamId": "qa-team",
    "message": "Button not clickable after form submission",
    "artifactType": "ui_log"
  }'

# 3. Verify RAG finds similar existing logs
# Expected: similarity score > 0.7
```

### Scenario 2: Classification with Context

**Setup**: Seeded logs with classifications

**Test**:
```bash
# 1. Start agent
curl -X POST http://localhost:3000/api/agent/start

# 2. Upload log similar to classified ones
curl -X POST http://localhost:3000/api/logs/upload \
  -d '{
    "teamId": "qa-team",
    "message": "Submit button missing on checkout",
    "artifactType": "ui_log"
  }'

# 3. Agent should quickly classify based on RAG context
```

### Scenario 3: Flaky Test Detection

**Setup**: Seeded flaky test log

**Test**:
```bash
# 1. Query flaky test log
curl "http://localhost:3000/api/logs/log-009?teamId=qa-team"

# 2. Verify isFlaky = true
# 3. Upload similar log
curl -X POST http://localhost:3000/api/logs/upload \
  -d '{
    "teamId": "qa-team",
    "message": "Test times out waiting for element",
    "artifactType": "ui_log",
    "metadata": { "retryCount": 4 }
  }'

# 4. Agent should detect as flaky based on pattern
```

---

## 📚 Embeddings Reference

### How Embeddings Work

1. **Generate**: Convert log message to 384-dimensional vector
2. **Store**: Keep in MongoDB for similarity search
3. **Search**: Find similar logs using cosine similarity
4. **Rank**: Sort by similarity score

### Example Embedding Search

```typescript
import { searchSimilarEmbeddings } from './src/seed/embeddingsDataset';

const queryEmbedding = ragService.getEmbedding('Login button not working');
const similar = searchSimilarEmbeddings(queryEmbedding, 0.7);

console.log(similar);
// [
//   {
//     logId: 'log-001',
//     message: 'Submit button not visible on login page',
//     similarity: 0.85,
//     metadata: { defectType: 'ui_bug', ... }
//   },
//   {
//     logId: 'log-008',
//     message: 'Login button not responsive on mobile',
//     similarity: 0.78,
//     metadata: { defectType: 'ui_bug', ... }
//   }
// ]
```

---

## 🐛 Troubleshooting

### MongoDB Connection Failed

```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB
mongod

# Or use MongoDB Atlas
# Update .env:
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
```

### Seeding Script Fails

```bash
# Check dependencies
npm install

# Build TypeScript
npm run build

# Try again
npx ts-node src/seed/seedDatabase.ts
```

### Data Not Showing Up

```bash
# Verify insert
mongo mongodb://localhost:27017/unified-defect-analyzer
> db.logs.count()
# Should show 10 or more

# Check by team
> db.logs.countDocuments({ teamId: 'qa-team' })
# Should show 6
```

### Indexes Not Working

```bash
# Rebuild indexes
mongo mongodb://localhost:27017/unified-defect-analyzer
> db.logs.reIndex()

# Check indexes
> db.logs.getIndexes()
```

---

## 🚀 Next Steps

1. **Run Seeding**: Execute the seeding script
2. **Start Agent**: Begin AI agent processing
3. **Monitor Results**: Watch logs get classified
4. **Test Endpoints**: Call API endpoints
5. **Verify Data**: Check MongoDB directly

```bash
# Complete workflow
npx ts-node src/seed/seedDatabase.ts  # Seed
npm run dev                             # Start server
curl -X POST http://localhost:3000/api/agent/start  # Start agent
sleep 10                                # Wait for processing
curl "http://localhost:3000/api/logs?teamId=qa-team"  # Check results
```

---

## 📊 Database Verification

### Check Seeded Data

```bash
# Connect to MongoDB
mongo mongodb://localhost:27017/unified-defect-analyzer

# Count total logs
> db.logs.count()
10

# Find by team
> db.logs.findOne({ teamId: 'qa-team' })

# Find completed
> db.logs.find({ processingStatus: 'completed' }).count()
2

# Find with classification
> db.logs.find({ 'classification.defectType': { $exists: true } }).count()
2

# Check indexes
> db.logs.getIndexes()
```

---

## 💾 Backup & Recovery

### Export Seeded Data

```bash
# Export to JSON file
mongoexport \
  --uri mongodb://localhost:27017/unified-defect-analyzer \
  --collection logs \
  --out logs_backup.json
```

### Restore Data

```bash
# Import from JSON file
mongoimport \
  --uri mongodb://localhost:27017/unified-defect-analyzer \
  --collection logs \
  --file logs_backup.json
```

---

## ✅ Verification Checklist

- [ ] MongoDB running
- [ ] npm dependencies installed
- [ ] Seeding script executed
- [ ] 10 logs inserted
- [ ] Indexes created
- [ ] Embeddings generated
- [ ] Agent can process logs
- [ ] Classification works
- [ ] RAG retrieves similar logs

---

## 🎯 Summary

The seeding script provides:
- ✅ 10 realistic test logs
- ✅ 3 teams with varied data
- ✅ All artifact types covered
- ✅ Vector embeddings
- ✅ Database indexes
- ✅ Mix of pending/completed logs
- ✅ Real defect examples

Ready to test Phase 2 AI Agent Service!

````
