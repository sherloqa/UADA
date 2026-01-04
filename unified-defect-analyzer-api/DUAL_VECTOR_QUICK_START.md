# 🚀 Dual Vector Embeddings - Quick Start

## 5-Minute Setup

### 1. Seed Collections (2 minutes)

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Seed both vector collections
npx ts-node src/seed/seedVectorCollections.ts
```

**Expected Output**:
```
Connected to database: mongodb://localhost:27017/unified-defect-analyzer
Cleared historic_defects and test_executions collections
Inserted 5 historic defects
Inserted 5 test executions
Created database indexes
=====================================
📊 Dual Vector Database Seeding Summary
=====================================

Historic Defects:
  - Total: 5
  - qa-team: 2
  - api-team: 2
  - backend-team: 1

Test Executions:
  - Total: 5
  - qa-team: 2
  - api-team: 2
  - backend-team: 1

Vector Collections Ready for RAG Analysis
```

### 2. Start API Server (1 minute)

```bash
# Terminal 3: Build and run
npm run build
npm run dev

# Expect: "Server running on http://localhost:3000"
```

### 3. Test Dual Vector RAG (2 minutes)

```bash
# Terminal 4: Upload a log similar to a known defect
curl -X POST http://localhost:3000/api/logs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "qa-team",
    "level": "error",
    "message": "Login button not responding",
    "artifactType": "ui_log",
    "artifactData": {
      "url": "https://example.com/login",
      "error": "Button click not triggered"
    }
  }'

# Start AI Agent
curl -X POST http://localhost:3000/api/agent/start \
  -H "Content-Type: application/json" \
  -d '{"teamId": "qa-team"}'

# Wait 10 seconds for processing...

# Check classification results
curl "http://localhost:3000/api/logs?teamId=qa-team&limit=1" | jq
```

## What Happens Behind the Scenes

```
1. Log Uploaded
   ↓
2. AI Agent Processes
   ├─ Analyzes artifact type
   ├─ Calls Dual Vector RAG
   │  ├─ Searches current logs
   │  ├─ Searches historic defects  ← NEW
   │  ├─ Searches test executions   ← NEW
   │  └─ Combines results
   ├─ Generates enriched context
   └─ Classifies with context
   ↓
3. Result Contains:
   - Classification
   - Similar past defects
   - Flaky test indicators
   - Proven resolutions
```

## Key Features to Try

### Feature 1: Historic Defect Matching

```bash
# This matches DEF-001: "Login Button Not Responding"
curl -X POST http://localhost:3000/api/logs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "qa-team",
    "message": "Mobile login unresponsive",
    "artifactType": "ui_log"
  }'

# Result includes:
# - Known defect: DEF-001
# - Root cause: Race condition in session management
# - Resolution: Updated event listener binding
# - Occurrences: 23 times in past
```

### Feature 2: Flaky Test Detection

```bash
# This matches flaky test pattern
curl -X POST http://localhost:3000/api/logs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "api-team",
    "message": "test_get_users_with_pagination failed",
    "artifactType": "backend_log"
  }'

# Result includes:
# - Detected flaky test
# - Flakiness score: 22%
# - Pass rate: 98.3%
# - Historical failures: 2 consecutive
```

### Feature 3: API Error Context

```bash
# This matches DEF-002: "500 API error"
curl -X POST http://localhost:3000/api/logs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "api-team",
    "message": "500 error on /api/users endpoint",
    "artifactType": "api_response"
  }'

# Result includes:
# - Known defect: DEF-002
# - Severity: CRITICAL
# - Root cause: Cache miss in validation
# - Occurrences: 45 times
```

## Verify Collections in MongoDB

```bash
# Open MongoDB shell
mongosh

# Select database
use unified-defect-analyzer

# Count records
db.historic_defects.countDocuments()    # Should show 5
db.test_executions.countDocuments()     # Should show 5

# View sample record
db.historic_defects.findOne()
db.test_executions.findOne()

# Check embeddings are generated
db.historic_defects.findOne().titleEmbedding.length  # Should be 384

# View by team
db.historic_defects.find({ teamId: "qa-team" })
db.test_executions.find({ teamId: "qa-team" })
```

## Check Enriched Context in Logs

The AI Agent now logs enriched context:

```bash
# Watch server logs
tail -f logs/app.log | grep "Enriched Context"

# You'll see output like:
# Enriched Context:
# KNOWN DEFECT HISTORY: "Login Button Not Responding..." 
# (Severity: high, Occurrences: 23)
# Root Cause: Race condition in session management
# Resolution: Updated event listener binding order
#
# FLAKY TEST DETECTED: "test_login_with_valid_credentials"
# (Flakiness Score: 35%, Pass Rate: 94%)
#
# SIMILAR RECENT ISSUES: 3 related logs found
```

## Collection Statistics

### Historic Defects Included

| ID | Title | Type | Severity | Count |
|----|-------|------|----------|-------|
| DEF-001 | Login Button Unresponsive Mobile | UI | High | 23 |
| DEF-002 | 500 Error on /api/users | API | Critical | 45 |
| DEF-003 | DB Connection Timeout | Backend | High | 34 |
| DEF-004 | Timeout Heavy Network Load | Network | Medium | 56 |
| DEF-005 | Memory Leak WebSocket | Backend | Critical | 12 |

### Test Executions Included

| ID | Test Name | Status | Flakiness | Pass Rate |
|----|-----------|--------|-----------|-----------|
| TEST-001 | login_with_valid_credentials | Failed | 35% | 94% |
| TEST-002 | get_users_with_pagination | Failed | 22% | 98.3% |
| TEST-003 | batch_job_completion | Failed | 45% | 96.7% |
| TEST-004 | network_resilience | Flaky | 72% | 87.5% |
| TEST-005 | websocket_long_connection | Failed | 92% | 68% |

## Common Tasks

### Clear All Data and Reseed

```bash
# Clear collections
mongosh
use unified-defect-analyzer
db.historic_defects.deleteMany({})
db.test_executions.deleteMany({})

# Re-seed
exit
npx ts-node src/seed/seedVectorCollections.ts
```

### Adjust Similarity Threshold

```typescript
// In src/services/ragService.ts
ragService.setSimilarityThreshold(0.65);  // More matches
ragService.setSimilarityThreshold(0.85);  // Fewer, higher quality
```

### Add Custom Historic Defect

```bash
mongosh
use unified-defect-analyzer

db.historic_defects.insertOne({
  teamId: "your-team",
  defectId: "DEF-006",
  title: "Your Custom Defect",
  description: "Description",
  rootCause: "Root cause",
  resolution: "How it was fixed",
  defectType: "ui_bug",
  severity: "high",
  component: "Your Component",
  occurrenceCount: 10,
  titleEmbedding: Array(384).fill(0.5),  // Placeholder
  descriptionEmbedding: Array(384).fill(0.5),
  rootCauseEmbedding: Array(384).fill(0.5),
  status: "active"
})
```

## Troubleshooting

### Collections Empty?

```bash
# Check if seeding ran
mongosh
db.historic_defects.countDocuments()

# If 0, run seeding again
npx ts-node src/seed/seedVectorCollections.ts
```

### Logs Not Being Classified?

```bash
# Check agent is running
curl http://localhost:3000/api/agent/status

# Start agent if needed
curl -X POST http://localhost:3000/api/agent/start \
  -H "Content-Type: application/json" \
  -d '{"teamId": "qa-team"}'

# Check logs
tail -f logs/app.log
```

### Embeddings Not Generated?

```bash
# Verify embedding dimensions
mongosh
db.historic_defects.findOne().titleEmbedding.length

# Should output: 384

# If not, reseed:
npx ts-node src/seed/seedVectorCollections.ts
```

## Integration Testing

Run the complete integration test:

```bash
./test-integration.sh
```

The script now includes:
- ✅ Seeding dual vector collections
- ✅ Verifying both historic_defects and test_executions
- ✅ Testing RAG retrieval
- ✅ Validating enriched context generation
- ✅ Confirming classification accuracy

## Next: Production Deployment

1. **Import Real Data**:
   ```typescript
   // Export from your existing systems
   // Import into historic_defects and test_executions
   ```

2. **Configure OpenAI** (optional):
   ```typescript
   // For better embeddings
   const apiKey = process.env.OPENAI_API_KEY;
   ```

3. **Scale MongoDB**:
   ```
   // Use MongoDB Atlas Vector Search for production
   // Automatically creates vector indexes
   ```

4. **Monitor Performance**:
   ```bash
   # Track vector search latency
   curl http://localhost:3000/api/agent/stats/dual-vector
   ```

---

**Status**: ✅ Dual Vector System Ready  
**Collections Seeded**: ✅ Historic Defects + Test Executions  
**AI Agent Integration**: ✅ Using enriched context  
**Production Ready**: 🚀 Ready to scale
