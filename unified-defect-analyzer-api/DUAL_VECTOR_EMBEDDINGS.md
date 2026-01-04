# 🔍 Dual Vector Embeddings System - Complete Guide

## Overview

The Unified Defect Analyzer now features a **Dual Vector Embeddings System** that combines three sources of information to provide intelligent defect analysis:

1. **Current Logs** - Recent log entries with immediate context
2. **Historic Defects** - Known defect patterns from past issues
3. **Test Execution History** - Historical test runs revealing flakiness and patterns

## Architecture

### Three Vector Collections

```
MongoDB
├── logs (Current logs)
│   ├── message (full-text indexed)
│   ├── artifactData
│   └── classification results
│
├── historic_defects (Known defects)
│   ├── title (vector embedding)
│   ├── description (vector embedding)
│   ├── rootCause (vector embedding)
│   ├── resolution
│   └── occurrenceCount
│
└── test_executions (Test history)
    ├── testName (vector embedding)
    ├── failureMessage (vector embedding)
    ├── flakinessScore (0-100)
    └── passRate
```

### Vector Embedding Dimensions

All embeddings use **384-dimensional vectors** for:
- Semantic similarity matching
- Pattern recognition
- Cross-source analysis

### RAG Processing Pipeline

```
User Log Input
    ↓
    ├─→ [RAG Service] ←─┐
    │                    │
    ├─→ Search Current Logs
    │   (Full-text + Semantic)
    │
    ├─→ Search Historic Defects
    │   (Title + Description + Root Cause embeddings)
    │
    ├─→ Search Test Executions
    │   (Test Name + Failure Message embeddings)
    │
    └─→ Rank & Filter
        (Cosine Similarity Threshold: 0.7)
        
    ↓
Generate Enriched Context
(Combine insights from all 3 sources)
    
    ↓
Classification Service
(Use enriched context for smarter classification)
    
    ↓
Update Log with Classification + Context
```

## Database Collections

### 1. Historic Defects Collection

**Purpose**: Store known defect patterns with resolutions

**Schema**:
```typescript
{
  defectId: string;              // Unique identifier
  title: string;                 // Defect title (embedded)
  description: string;           // Full description (embedded)
  rootCause: string;            // Root cause analysis (embedded)
  resolution: string;           // Solution/fix applied
  defectType: string;           // ui_bug, api_error, etc.
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;            // Affected component
  occurrenceCount: number;      // How many times it occurred
  affectedVersions: string[];   // Software versions
  titleEmbedding: number[];     // 384-dimensional vector
  descriptionEmbedding: number[]; // 384-dimensional vector
  rootCauseEmbedding: number[]; // 384-dimensional vector
  status: 'active' | 'resolved' | 'obsolete';
  resolutionDate?: Date;
  tags: string[];
}
```

**Use Cases**:
- Find similar past defects
- Extract proven resolutions
- Understand defect severity patterns
- Track defect recurrence

### 2. Test Execution Collection

**Purpose**: Track historical test runs for flakiness detection

**Schema**:
```typescript
{
  executionId: string;          // Unique test run ID
  testName: string;             // Test name (embedded)
  testSuite: string;            // Test suite name
  status: 'passed' | 'failed' | 'skipped' | 'flaky';
  duration: number;             // Test duration in ms
  timestamp: Date;              // When test ran
  failureMessage?: string;      // Failure message (embedded)
  failureReason?: string;       // Root cause of failure
  stackTrace?: string;          // Stack trace if available
  environment: string;          // dev, staging, production
  browser?: string;             // Browser used
  platform?: string;            // Platform (macOS, Windows, Linux)
  consecutiveFailures: number;  // Consecutive failure count
  totalExecutions: number;      // Total runs of this test
  passRate: number;             // Pass percentage (0-100)
  flakinessScore: number;       // Flakiness (0-100)
  testNameEmbedding: number[]; // 384-dimensional vector
  failureMessageEmbedding?: number[]; // 384-dimensional vector
  defectType?: string;          // Related defect type
  flakiness?: {                 // Flakiness details
    isFlaky: boolean;
    flakySince: Date;
    possibleCauses: string[];
  };
}
```

**Use Cases**:
- Detect flaky tests
- Correlate test failures with defects
- Track test reliability
- Find test patterns

## RAG Service: Dual Vector Methods

### Method: `retrieveDualVectorContext()`

Retrieves context from all three sources in a single call.

**Signature**:
```typescript
async retrieveDualVectorContext(
  query: string,
  artifactType: string,
  teamId: string,
  defectType?: string
): Promise<DualVectorRAGContext>
```

**Returns**:
```typescript
{
  query: string;                    // Original query
  similarLogs: SimilarIssue[];      // From current logs
  historicMatches: HistoricDefectMatch[];  // From historic defects
  testMatches: TestExecutionMatch[];       // From test executions
  documentCount: number;             // Total matches
  totalMatches: number;              // Total candidates
  enrichedContext: string;           // Generated context description
}
```

**Example**:
```typescript
const context = await ragService.retrieveDualVectorContext(
  'Login button not responding',
  'ui_log',
  'qa-team',
  'ui_bug'
);

// Returns:
// {
//   similarLogs: [
//     { message: 'Login timeout', similarity: 0.92, ... }
//   ],
//   historicMatches: [
//     { 
//       title: 'Login Button Not Responding on Mobile',
//       rootCause: 'Race condition in session management',
//       resolution: 'Updated event listener binding',
//       occurrenceCount: 23
//     }
//   ],
//   testMatches: [
//     {
//       testName: 'test_login_with_valid_credentials',
//       flakinessScore: 35,
//       passRate: 94
//     }
//   ],
//   enrichedContext: 'KNOWN DEFECT HISTORY: "Login Button..." ...'
// }
```

## Seeding Collections

### Step 1: Seed Historic Defects and Test Executions

```bash
npx ts-node src/seed/seedVectorCollections.ts
```

**What it does**:
- ✅ Connects to MongoDB
- ✅ Clears existing collections
- ✅ Inserts 5 sample historic defects
- ✅ Inserts 5 sample test executions
- ✅ Generates 384-dimensional embeddings for each
- ✅ Creates optimized database indexes
- ✅ Displays summary statistics

**Sample Data Included**:
- **Historic Defects**:
  1. Login Button Not Responding (UI, High)
  2. 500 Error on /api/users (API, Critical)
  3. Database Connection Timeout (Backend, High)
  4. Timeout Error During Heavy Load (Network, Medium)
  5. Memory Leak in WebSocket Handler (Backend, Critical)

- **Test Executions**:
  1. test_login_with_valid_credentials (Flaky)
  2. test_get_users_with_pagination (Flaky)
  3. test_batch_job_completion (Flaky)
  4. test_network_resilience (Very Flaky)
  5. test_websocket_long_connection (Critical)

### Step 2: Verify Collections

```bash
# Open MongoDB shell
mongosh
use unified-defect-analyzer

# Check historic defects
db.historic_defects.find().pretty()
db.historic_defects.countDocuments()

# Check test executions
db.test_executions.find().pretty()
db.test_executions.countDocuments()
```

## AI Agent Integration

### How the AI Agent Uses Dual Vectors

1. **Log Processing**:
   ```typescript
   async processLog(log) {
     // Extract artifact type and analyze
     const analysis = await analyzeArtifact(log);
     
     // Retrieve from ALL THREE sources
     const ragContext = await ragService.retrieveDualVectorContext(
       log.message,
       log.artifactType,
       log.teamId
     );
     
     // Use enriched context for classification
     const classification = await classificationService.classifyDefect(
       log,
       analysis,
       ragContext  // ← Now includes historic + test data!
     );
     
     // Update with enhanced classification
     return await updateLog(classification);
   }
   ```

2. **Enhanced Classification**:
   The classifier now receives:
   - Current log details
   - Similar recent logs
   - **Known defect patterns** (historic)
   - **Flaky test indicators** (execution history)

3. **Enriched Context Generation**:
   ```
   KNOWN DEFECT HISTORY: "Login Button Not Responding..." 
   (Severity: high, Occurrences: 23)
   Root Cause: Race condition in session management
   Resolution: Updated event listener binding order
   
   FLAKY TEST DETECTED: "test_login_with_valid_credentials"
   (Flakiness Score: 35%, Pass Rate: 94%)
   
   SIMILAR RECENT ISSUES: 3 related logs found
   ```

## Vector Search Capability

### Search Historic Defects

```typescript
// Find similar defects
const matches = await ragService.searchHistoricDefects(
  'qa-team',
  'login button not working',
  'ui_bug'
);

// Returns defects ranked by semantic similarity
```

### Search Test Executions

```typescript
// Find similar test failures
const matches = await ragService.searchTestExecutions(
  'qa-team',
  'timeout error'
);

// Returns flaky tests ranked by relevance
```

## Ranking & Weighting

### Similarity Thresholds

```typescript
// Default threshold: 0.7 (cosine similarity)
// Matches with similarity < 0.7 are filtered out
// Prevents weak matches from polluting context

// Tuning:
ragService.setSimilarityThreshold(0.65);  // More lenient
ragService.setSimilarityThreshold(0.85);  // Stricter
```

### Source Weights

When ranking results:
- Historic Defects: 1.5x weight (proven patterns)
- Test Executions: 1.2x weight (behavioral patterns)
- Current Logs: 1.0x weight (immediate context)

## Testing Scenarios

### Scenario 1: Historic Defect Match

```bash
# A new log arrives that matches a known defect
curl -X POST http://localhost:3000/api/logs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "qa-team",
    "level": "error",
    "message": "Login button unresponsive on mobile",
    "artifactType": "ui_log"
  }'

# AI Agent retrieves:
# - Historic defect: "Login Button Not Responding on Mobile"
# - Root cause: Race condition in session management
# - Resolution: Updated event listener binding
# → Classification enriched with known solution!
```

### Scenario 2: Flaky Test Detection

```bash
# Test failure that matches a known flaky test
curl -X POST http://localhost:3000/api/logs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "qa-team",
    "level": "error",
    "message": "test_network_resilience timeout",
    "artifactType": "backend_log"
  }'

# AI Agent retrieves:
# - Test execution: Flakiness score 72%
# - Possible causes: Fixed timeout value, network variance
# → Classified as flaky with historical context!
```

### Scenario 3: Cross-Source Correlation

```bash
# Backend error that correlates with:
# - Known memory leak defect
# - WebSocket test failures
# - Multiple environment reports

# AI Agent combines all sources to identify:
# - Root cause: Memory leak in WebSocket handler
# - Affected: Production + staging
# - Solution: Event listener cleanup + monitoring
```

## Performance Tuning

### Vector Search Optimization

```typescript
// Index configuration for fast searches
db.historic_defects.createIndex({ teamId: 1, status: 1 })
db.historic_defects.createIndex({ defectType: 1, severity: 1 })
db.test_executions.createIndex({ teamId: 1, flakinessScore: -1 })

// For production: Use MongoDB Atlas Vector Search
// Atlas automatically creates vector indexes
```

### Query Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Retrieve from 1 collection | 10-50ms | Single source |
| Retrieve from 3 collections | 30-100ms | Parallel queries |
| Rank & filter results | 20-50ms | Cosine similarity |
| Generate enriched context | 5-10ms | String generation |
| **Total dual vector RAG** | **50-150ms** | End-to-end |

## Advanced Features

### Custom Embeddings

For production, connect to OpenAI or similar:

```typescript
// In ragService.ts
async getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}
```

### Filtering by Severity

```typescript
// Find only high/critical historic defects
const severeMatches = await HistoricDefect.find({
  teamId,
  severity: { $in: ['high', 'critical'] }
});
```

### Time-Based Filtering

```typescript
// Find only recent test executions
const recentTests = await TestExecution.find({
  teamId,
  timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }  // Last 7 days
});
```

## API Endpoints with Dual Vectors

### Get Enhanced Statistics

```bash
# Get insights from all three sources
curl "http://localhost:3000/api/agent/stats/dual-vector?teamId=qa-team"

# Returns:
# {
#   historicDefectsSummary: { total: 5, active: 3, resolved: 2 },
#   testExecutionsSummary: { total: 100, flaky: 12, passRate: 95 },
#   vectorSearchMetrics: {
#     avgSimilarity: 0.78,
#     indexSize: 384,
#     searchTime: 87
#   }
# }
```

## Troubleshooting

### No Historic Matches Found

```bash
# Check if collections are populated
mongosh
db.historic_defects.find({ teamId: "qa-team" })

# If empty, run seeding:
npx ts-node src/seed/seedVectorCollections.ts
```

### Flaky Test Not Detected

```bash
# Verify flakiness score is above threshold
db.test_executions.find({ flakinessScore: { $gte: 50 } })

# Adjust detection threshold in RAG service:
ragService.setSimilarityThreshold(0.60)
```

### Embeddings Not Generated

```bash
# Check embedding dimensions
db.historic_defects.findOne({})
# titleEmbedding should have 384 elements

# Regenerate if needed:
npx ts-node src/seed/seedVectorCollections.ts
```

## Next Steps

1. **Seed the vectors**: Run `npx ts-node src/seed/seedVectorCollections.ts`
2. **Start the API**: Run `npm run dev`
3. **Monitor RAG output**: Check logs for enriched context
4. **Tune thresholds**: Adjust similarity scores for your needs
5. **Integrate production data**: Import real historic defects and tests
6. **Monitor performance**: Track vector search latency

## Architecture Benefits

✅ **Context-Aware**: Defects analyzed with historical knowledge  
✅ **Pattern Recognition**: Identifies recurring issues  
✅ **Flakiness Detection**: Correlates test failures  
✅ **Cross-Source Analysis**: Combines multiple data streams  
✅ **Semantic Understanding**: Vector embeddings capture meaning  
✅ **Scalable**: Efficient MongoDB indexing  
✅ **Explainable**: Enriched context shows reasoning  

---

**Last Updated**: January 2026  
**Version**: 2.1 (Dual Vector RAG)
