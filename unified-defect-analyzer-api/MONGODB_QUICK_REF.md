# MongoDB Setup - Quick Reference Card

## 🚀 Fastest Path (2 commands)

```bash
# 1. Start MongoDB (choose one method below)
# Local:   mongod
# Docker:  docker run -d --name mongo -p 27017:27017 mongo:7.0
# Cloud:   https://www.mongodb.com/cloud/atlas

# 2. Seed data
./seed-mongodb.sh
```

## ✅ Verify Success

```bash
mongosh unified-defect-analyzer

# Should show:
# Logs: 8
# Historic Defects: 5
# Test Executions: 5

db.logs.countDocuments()
db.historic_defects.countDocuments()
db.test_executions.countDocuments()
```

---

## 📦 What Gets Created

| Collection | Records | Purpose |
|------------|---------|---------|
| `logs` | 8 | Sample log entries (errors, warnings) |
| `historic_defects` | 5 | Known defects with embeddings |
| `test_executions` | 5 | Test history with flakiness data |
| **Total** | **18** | Complete test dataset |

---

## 🛠️ Installation Methods (Choose One)

### macOS - Homebrew
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### macOS/Linux - Docker
```bash
docker run -d \
  --name mongo \
  -p 27017:27017 \
  mongo:7.0
```

### MongoDB Atlas (Cloud)
1. Sign up: https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Set: `export MONGODB_URI="mongodb+srv://..."`

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Permission denied" | `chmod +x seed-mongodb.sh` |
| "Port 27017 in use" | Change port: `docker run -p 27018:27017` |
| "Cannot connect" | Check MongoDB running: `mongosh --eval "db.adminCommand('ping')"` |
| "Empty collections" | Re-run: `./seed-mongodb.sh` |

---

## 📊 Sample Data Overview

### 🪵 Logs (8 entries)
- 3 teams: qa-team, api-team, backend-team
- Various artifact types: ui_log, api_response, backend_log
- Status: pending (ready for AI processing)

### 🎯 Historic Defects (5 entries)
- DEF-001: Login Button (23 occurrences)
- DEF-002: 500 Error (45 occurrences)
- DEF-003: DB Timeout (34 occurrences)
- DEF-004: Network Error (56 occurrences)
- DEF-005: Memory Leak (12 occurrences)

### 🧪 Test Executions (5 entries)
- TEST-001: login_credentials (35% flaky)
- TEST-002: get_users (22% flaky)
- TEST-003: batch_job (45% flaky)
- TEST-004: network_test (72% flaky)
- TEST-005: websocket (92% flaky)

---

## 🎮 Common Commands

```bash
# Connect to MongoDB
mongosh unified-defect-analyzer

# Count records
db.logs.countDocuments()
db.historic_defects.countDocuments()
db.test_executions.countDocuments()

# View sample
db.logs.findOne()
db.historic_defects.findOne()
db.test_executions.findOne()

# Clear data
db.logs.deleteMany({})
db.historic_defects.deleteMany({})
db.test_executions.deleteMany({})

# List indexes
db.logs.getIndexes()
db.historic_defects.getIndexes()
db.test_executions.getIndexes()
```

---

## 🔄 Next Steps

1. ✅ Start MongoDB
2. ✅ Run `./seed-mongodb.sh`
3. ✅ Verify with mongosh
4. 👉 Start API: `npm run dev`
5. 👉 Run tests: `./test-integration.sh`

---

**For detailed guide**: See `MONGODB_SETUP_GUIDE.md`
