# 🗄️ MongoDB Setup & Data Seeding Guide

## Quick Start (3 Steps)

### Step 1: Start MongoDB

Choose one method:

**Option A: Local MongoDB (if installed)**
```bash
mongod
```

**Option B: Docker**
```bash
docker run -d --name mongo -p 27017:27017 mongo:7.0
```

**Option C: MongoDB Atlas (Cloud)**
- Sign up at https://www.mongodb.com/cloud/atlas
- Create a cluster and get connection string
- Set environment variable:
```bash
export MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/unified-defect-analyzer"
```

### Step 2: Run Seeding Script

```bash
cd unified-defect-analyzer-api
./seed-mongodb.sh
```

### Step 3: Verify Data

```bash
mongosh unified-defect-analyzer
db.logs.countDocuments()              # Should show 8
db.historic_defects.countDocuments()   # Should show 5
db.test_executions.countDocuments()    # Should show 5
```

---

## Installation Methods

### macOS: Homebrew

```bash
# 1. Tap MongoDB repo
brew tap mongodb/brew

# 2. Install
brew install mongodb-community

# 3. Start service
brew services start mongodb-community

# 4. Verify
mongosh --eval "db.adminCommand('ping')"
```

### macOS: Docker

```bash
# 1. Start MongoDB in Docker
docker run -d \
  --name mongo \
  -p 27017:27017 \
  -v mongo_data:/data/db \
  mongo:7.0

# 2. Verify
mongosh --eval "db.adminCommand('ping')"

# 3. Stop (when done)
docker stop mongo
docker rm mongo
```

### Linux: apt

```bash
# 1. Import GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

# 2. Add repository
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/debian $(lsb_release -sc)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# 3. Install
sudo apt-get update
sudo apt-get install -y mongodb-org

# 4. Start service
sudo systemctl start mongod

# 5. Verify
mongosh --eval "db.adminCommand('ping')"
```

### Windows: Chocolatey

```bash
# 1. Install via Chocolatey
choco install mongodb

# 2. Start service
net start MongoDB

# 3. Verify
mongosh --eval "db.adminCommand('ping')"
```

---

## Data Collections

### Collection 1: `logs` (8 entries)

Sample log entries from different teams with various artifact types.

**Structure:**
```javascript
{
  _id: ObjectId,
  teamId: "qa-team" | "api-team" | "backend-team",
  level: "error" | "warn" | "info",
  message: string,
  artifactType: "ui_log" | "api_response" | "backend_log",
  artifactData: {
    // Type-specific data
  },
  processingStatus: "pending" | "processing" | "completed",
  createdAt: Date,
  updatedAt: Date
}
```

**Sample Entries:**
1. Login button not responding (qa-team, ui_log)
2. 500 API error (api-team, api_response)
3. Database connection timeout (backend-team, backend_log)
4. Network timeout on 3G (qa-team, ui_log)
5. Memory leak in WebSocket (api-team, backend_log)
6. Flaky test detection (qa-team, backend_log)
7. API rate limit exceeded (api-team, api_response)
8. Batch job timeout (backend-team, backend_log)

---

### Collection 2: `historic_defects` (5 entries)

Known defect patterns with vector embeddings and historical data.

**Structure:**
```javascript
{
  _id: ObjectId,
  defectId: "DEF-001",
  teamId: "qa-team",
  title: string,
  description: string,
  rootCause: string,
  resolution: string,
  defectType: "ui_bug" | "api_error" | "backend_error" | "network_error",
  severity: "low" | "medium" | "high" | "critical",
  component: string,
  occurrenceCount: number,
  affectedVersions: [string],
  titleEmbedding: number[384],
  descriptionEmbedding: number[384],
  rootCauseEmbedding: number[384],
  environment: "dev" | "staging" | "production",
  status: "active" | "resolved" | "obsolete",
  resolutionDate: Date,
  jiraTicket: string,
  tags: [string],
  createdAt: Date,
  updatedAt: Date
}
```

**Sample Defects:**
| ID | Title | Type | Severity | Count |
|----|-------|------|----------|-------|
| DEF-001 | Login Button Unresponsive | UI Bug | High | 23 |
| DEF-002 | 500 API Error | API Error | Critical | 45 |
| DEF-003 | Database Timeout | Backend | High | 34 |
| DEF-004 | Network Timeout | Network | Medium | 56 |
| DEF-005 | Memory Leak | Backend | Critical | 12 |

---

### Collection 3: `test_executions` (5 entries)

Historical test execution data with flakiness scores.

**Structure:**
```javascript
{
  _id: ObjectId,
  executionId: "TEST-001",
  teamId: "qa-team",
  testName: string,
  testSuite: string,
  testFile: string,
  status: "passed" | "failed" | "skipped" | "flaky",
  duration: number,
  timestamp: Date,
  failureMessage: string,
  failureReason: string,
  environment: string,
  browser: string,
  platform: string,
  consecutiveFailures: number,
  totalExecutions: number,
  passRate: number,
  flakinessScore: number,
  testNameEmbedding: number[384],
  failureMessageEmbedding: number[384],
  defectType: string,
  flakiness: {
    isFlaky: boolean,
    flakySince: Date,
    possibleCauses: [string]
  },
  relatedHistoricDefectIds: [string],
  jiraTicket: string,
  tags: [string],
  createdAt: Date,
  updatedAt: Date
}
```

**Sample Test Executions:**
| ID | Test Name | Status | Flakiness | Pass Rate |
|----|-----------|--------|-----------|-----------|
| TEST-001 | login_with_credentials | Failed | 35% | 94% |
| TEST-002 | get_users_pagination | Failed | 22% | 98.3% |
| TEST-003 | batch_job_completion | Failed | 45% | 96.7% |
| TEST-004 | network_resilience | Flaky | 72% | 87.5% |
| TEST-005 | websocket_long_conn | Failed | 92% | 68% |

---

## Manual Seeding (Without Script)

If the script doesn't work, seed manually:

### 1. Connect to MongoDB

```bash
mongosh unified-defect-analyzer
```

### 2. Insert Sample Logs

```javascript
db.logs.insertMany([
  {
    teamId: "qa-team",
    level: "error",
    message: "Login button not responding",
    artifactType: "ui_log",
    artifactData: { url: "https://example.com/login" },
    processingStatus: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    teamId: "api-team",
    level: "error",
    message: "500 error on /api/users",
    artifactType: "api_response",
    artifactData: { endpoint: "/api/users", statusCode: 500 },
    processingStatus: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  }
  // ... more entries
]);
```

### 3. Insert Historic Defects

```javascript
db.historic_defects.insertMany([
  {
    defectId: "DEF-001",
    teamId: "qa-team",
    title: "Login Button Not Responding",
    description: "Button becomes unresponsive on iOS",
    rootCause: "Race condition in session management",
    resolution: "Updated event listener binding",
    defectType: "ui_bug",
    severity: "high",
    component: "Authentication",
    occurrenceCount: 23,
    titleEmbedding: Array(384).fill(0.5),
    descriptionEmbedding: Array(384).fill(0.5),
    rootCauseEmbedding: Array(384).fill(0.5),
    status: "resolved",
    createdAt: new Date(),
    updatedAt: new Date()
  }
  // ... more entries
]);
```

### 4. Insert Test Executions

```javascript
db.test_executions.insertMany([
  {
    executionId: "TEST-001",
    teamId: "qa-team",
    testName: "test_login_with_credentials",
    testSuite: "Authentication",
    status: "failed",
    duration: 3500,
    failureMessage: "Timeout waiting for button",
    flakinessScore: 35,
    passRate: 94,
    testNameEmbedding: Array(384).fill(0.5),
    failureMessageEmbedding: Array(384).fill(0.5),
    flakiness: {
      isFlaky: true,
      flakySince: new Date(),
      possibleCauses: ["Network latency"]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
  // ... more entries
]);
```

### 5. Create Indexes

```javascript
// Logs
db.logs.createIndex({ teamId: 1, createdAt: -1 });
db.logs.createIndex({ processingStatus: 1 });
db.logs.createIndex({ message: "text" });

// Historic Defects
db.historic_defects.createIndex({ teamId: 1, status: 1 });
db.historic_defects.createIndex({ defectType: 1, severity: 1 });

// Test Executions
db.test_executions.createIndex({ teamId: 1, timestamp: -1 });
db.test_executions.createIndex({ flakinessScore: -1 });
```

---

## Verification

### Check MongoDB Connection

```bash
mongosh --eval "db.adminCommand('ping')"
```

Expected output:
```
{ ok: 1 }
```

### List All Databases

```bash
mongosh --eval "db.adminCommand('listDatabases')"
```

### View Collection Counts

```bash
mongosh unified-defect-analyzer << EOF
print("Logs:", db.logs.countDocuments());
print("Historic Defects:", db.historic_defects.countDocuments());
print("Test Executions:", db.test_executions.countDocuments());
EOF
```

### View Sample Data

```bash
mongosh unified-defect-analyzer

# View a sample log
db.logs.findOne()

# View a historic defect
db.historic_defects.findOne()

# View a test execution
db.test_executions.findOne()

# Count by team
db.logs.find({ teamId: "qa-team" }).count()
```

### Check Indexes

```bash
mongosh unified-defect-analyzer

db.logs.getIndexes()
db.historic_defects.getIndexes()
db.test_executions.getIndexes()
```

---

## Cleanup & Reset

### Delete All Data

```bash
mongosh unified-defect-analyzer

db.logs.deleteMany({});
db.historic_defects.deleteMany({});
db.test_executions.deleteMany({});

print("All collections cleared!");
```

### Drop Entire Database

```bash
mongosh

use unified-defect-analyzer
db.dropDatabase()

print("Database dropped!");
```

### Drop Single Collection

```bash
mongosh unified-defect-analyzer

db.logs.drop()
db.historic_defects.drop()
db.test_executions.drop()
```

---

## Troubleshooting

### MongoDB Not Running

```bash
# Check if service is active
brew services list  # macOS
systemctl status mongod  # Linux
Get-Service MongoDB  # Windows

# Start service
brew services start mongodb-community  # macOS
sudo systemctl start mongod  # Linux
net start MongoDB  # Windows
```

### Can't Connect to MongoDB

```bash
# Check if mongosh is installed
which mongosh

# Verify connection string
echo $MONGODB_URI

# Test connection
mongosh "$MONGODB_URI"
```

### Collections Are Empty

```bash
# Re-run seeding script
./seed-mongodb.sh

# Or seed manually
mongosh unified-defect-analyzer < seed-data.js
```

### Permission Denied

```bash
# Make scripts executable
chmod +x seed-mongodb.sh
chmod +x setup-mongodb.sh

# Or run with bash
bash seed-mongodb.sh
bash setup-mongodb.sh
```

### Out of Disk Space

```bash
# Check MongoDB data directory size
du -sh /usr/local/var/mongodb  # macOS

# Clear old logs
rm -rf /usr/local/var/mongodb/mongod.lock

# Restart MongoDB
brew services restart mongodb-community
```

---

## Environment Configuration

### Local Development

```bash
# .env file
MONGODB_URI=mongodb://localhost:27017/unified-defect-analyzer
```

### Docker Development

```bash
# .env file
MONGODB_URI=mongodb://mongo:27017/unified-defect-analyzer
```

### Production (MongoDB Atlas)

```bash
# .env file
MONGODB_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/unified-defect-analyzer?retryWrites=true&w=majority
```

---

## Data Backup & Restore

### Export Collections

```bash
# Export logs
mongoexport \
  --uri "mongodb://localhost:27017/unified-defect-analyzer" \
  --collection logs \
  --out logs_backup.json

# Export historic defects
mongoexport \
  --uri "mongodb://localhost:27017/unified-defect-analyzer" \
  --collection historic_defects \
  --out defects_backup.json

# Export test executions
mongoexport \
  --uri "mongodb://localhost:27017/unified-defect-analyzer" \
  --collection test_executions \
  --out tests_backup.json
```

### Import Collections

```bash
# Import logs
mongoimport \
  --uri "mongodb://localhost:27017/unified-defect-analyzer" \
  --collection logs \
  --file logs_backup.json

# Import historic defects
mongoimport \
  --uri "mongodb://localhost:27017/unified-defect-analyzer" \
  --collection historic_defects \
  --file defects_backup.json

# Import test executions
mongoimport \
  --uri "mongodb://localhost:27017/unified-defect-analyzer" \
  --collection test_executions \
  --file tests_backup.json
```

---

## Performance Tips

### Index Strategy

The seeding script creates optimized indexes for:
- Logs: `teamId + timestamp`, `processingStatus`, full-text on `message`
- Historic Defects: `teamId + status`, `defectType + severity`, `lastOccurred`
- Test Executions: `teamId + timestamp`, `flakinessScore`, `testName + status`

### Query Optimization

```javascript
// Good: Uses index
db.logs.find({ teamId: "qa-team", createdAt: { $gte: new Date("2024-01-01") } })

// Bad: Full collection scan
db.logs.find({ message: { $regex: "error" } })  // Unless text index exists
```

### Batch Insert Performance

```javascript
// Fast: Batch insert
db.logs.insertMany(largeArray, { ordered: false })

// Slow: Individual inserts
largeArray.forEach(doc => db.logs.insertOne(doc))
```

---

## Next Steps

After seeding MongoDB:

1. **Start API Server**
   ```bash
   npm run dev
   ```

2. **Verify API Health**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Test Log Upload**
   ```bash
   curl -X POST http://localhost:3000/api/logs/upload \
     -H "Content-Type: application/json" \
     -d '{"teamId":"qa-team", "message":"Test", ...}'
   ```

4. **Start AI Agent**
   ```bash
   curl -X POST http://localhost:3000/api/agent/start \
     -H "Content-Type: application/json" \
     -d '{"teamId":"qa-team"}'
   ```

5. **Monitor Processing**
   ```bash
   curl http://localhost:3000/api/agent/status
   ```

---

## Support

For MongoDB issues:
- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Community Help](https://community.mongodb.com/)
- [Troubleshooting Guide](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)

---

**Last Updated**: January 2026  
**MongoDB Version**: 7.0+  
**Collections**: 3 (logs, historic_defects, test_executions)  
**Sample Records**: 18 total (8 logs + 5 defects + 5 tests)
