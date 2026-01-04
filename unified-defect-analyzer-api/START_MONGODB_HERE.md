# 🎯 MongoDB Setup - START HERE

## ✅ Everything is Ready!

You now have a **complete MongoDB setup** with sample data and comprehensive documentation.

---

## 🚀 Quick Start (2 minutes)

### Option A: Full Auto-Setup (Recommended)
```bash
# This will auto-install MongoDB if needed, or use Docker
./setup-mongodb.sh
```

### Option B: Direct Seed (if MongoDB already running)
```bash
./seed-mongodb.sh
```

### Verify Success
```bash
mongosh unified-defect-analyzer
db.logs.countDocuments()              # Should show: 8
db.historic_defects.countDocuments()  # Should show: 5
db.test_executions.countDocuments()   # Should show: 5
```

---

## 📚 Documentation

### 🔥 **START WITH THIS** (5 minutes)
→ [MONGODB_QUICK_REF.md](MONGODB_QUICK_REF.md)
- 2-command quick start
- Common commands
- Quick troubleshooting

### 📖 **Complete Setup Guide** (20 minutes)
→ [MONGODB_SETUP_GUIDE.md](MONGODB_SETUP_GUIDE.md)
- Installation methods for all platforms
- Collection schemas explained
- Manual seeding instructions
- Performance optimization

### ✨ **What You Get** (Executive Summary)
→ [MONGODB_DATA_SETUP_COMPLETE.md](MONGODB_DATA_SETUP_COMPLETE.md)
- What was created
- Data structure overview
- Integration with API

### 🗺️ **All Guides Index**
→ [MONGODB_DOCUMENTATION_INDEX.md](MONGODB_DOCUMENTATION_INDEX.md)
- Complete map of all documentation
- File locations
- Quick links

### 📊 **Visual Overview**
→ [MONGODB_VISUAL_SUMMARY.md](MONGODB_VISUAL_SUMMARY.md)
- Diagrams and flowcharts
- Data structure visualization
- Database architecture

---

## 📦 What Was Created

### Scripts (Executable)
- **setup-mongodb.sh** - Auto-install & seed MongoDB
- **seed-mongodb.sh** - Direct seeding (MongoDB already running)

### Documentation (5 guides)
- MONGODB_QUICK_REF.md (quick start)
- MONGODB_SETUP_GUIDE.md (comprehensive)
- MONGODB_DATA_SETUP_COMPLETE.md (summary)
- MONGODB_DOCUMENTATION_INDEX.md (map)
- MONGODB_VISUAL_SUMMARY.md (diagrams)

### Sample Data (18 records)
- **8 Logs** - Real error messages from 3 teams
- **5 Historic Defects** - Known patterns with embeddings
- **5 Test Executions** - Flaky tests with history

### Database Infrastructure
- **3 Collections** - Organized by purpose
- **13 Indexes** - For fast queries
- **384-dim Embeddings** - For semantic search

---

## 🎯 Next Steps

### Right Now (2 minutes)
1. Read: [MONGODB_QUICK_REF.md](MONGODB_QUICK_REF.md)
2. Run: `./seed-mongodb.sh` or `./setup-mongodb.sh`
3. Verify: `mongosh unified-defect-analyzer && db.logs.countDocuments()`

### Then (5-10 minutes)
4. Start API: `npm run dev`
5. Test: `curl http://localhost:3000/health`
6. Upload log: `curl -X POST http://localhost:3000/api/logs/upload`

### Finally (30 minutes)
7. Run tests: `./test-integration.sh`
8. Monitor AI processing: `curl http://localhost:3000/api/agent/status`
9. Review classifications

---

## 🛠️ Choose Your Setup Method

### For macOS with Homebrew
```bash
brew services start mongodb-community
./seed-mongodb.sh
```

### For Docker
```bash
docker run -d --name mongo -p 27017:27017 mongo:7.0
./seed-mongodb.sh
```

### For MongoDB Atlas (Cloud)
```bash
# 1. Sign up: https://www.mongodb.com/cloud/atlas
# 2. Create cluster and get connection string
# 3. Set environment variable
export MONGODB_URI="mongodb+srv://user:pass@cluster..."
./seed-mongodb.sh
```

### For Linux
```bash
# See MONGODB_SETUP_GUIDE.md for apt instructions
# Then run:
./seed-mongodb.sh
```

### For Windows
```bash
# See MONGODB_SETUP_GUIDE.md for Chocolatey instructions
# Then run:
./seed-mongodb.sh
```

---

## ❓ Common Questions

### Q: Do I need MongoDB installed?
**A:** No! Run `./setup-mongodb.sh` and it will auto-install if needed.

### Q: How long does setup take?
**A:** < 5 minutes total (most scripts run in seconds)

### Q: What's the sample data?
**A:** 18 realistic records across 3 collections ready for AI processing

### Q: Can I run tests without MongoDB?
**A:** No, tests need real data in MongoDB. Run seeding first.

### Q: Where do I find the data?
**A:** In MongoDB `unified-defect-analyzer` database:
- `logs` collection (8 records)
- `historic_defects` collection (5 records)
- `test_executions` collection (5 records)

### Q: What if something breaks?
**A:** See [MONGODB_SETUP_GUIDE.md](MONGODB_SETUP_GUIDE.md) troubleshooting section

---

## 📊 Quick Stats

| Item | Count |
|------|-------|
| Scripts | 2 |
| Documentation Files | 5 |
| Sample Records | 18 |
| Collections | 3 |
| Database Indexes | 13 |
| Setup Time | < 5 min |

---

## ✅ Verification

After running `./seed-mongodb.sh`, you should see:

```
✅ Collections cleared
✅ Sample logs created (8 records)
✅ Historic defects created (5 records)
✅ Test executions created (5 records)
✅ Indexes created (13 total)
✅ Summary displayed
```

Then verify with:
```bash
mongosh unified-defect-analyzer
show collections  # Should show: logs, historic_defects, test_executions
db.logs.countDocuments()
```

---

## 🎯 Integration with API

After MongoDB is set up:

```bash
# 1. Start API
npm run dev

# 2. Check health
curl http://localhost:3000/health

# 3. Upload log
curl -X POST http://localhost:3000/api/logs/upload \
  -H "Content-Type: application/json" \
  -d '{"teamId":"qa-team","message":"test error"}'

# 4. Start AI agent
curl -X POST http://localhost:3000/api/agent/start

# 5. Check status
curl http://localhost:3000/api/agent/status

# 6. Run full test
./test-integration.sh
```

---

## 🆘 Quick Help

| Problem | Solution |
|---------|----------|
| "Permission denied" | `chmod +x *.sh` |
| "MongoDB not found" | Run `./setup-mongodb.sh` |
| "Port in use" | Stop existing: `brew services stop mongodb-community` |
| "Empty collections" | Re-run: `./seed-mongodb.sh` |
| "Can't connect" | Check: `mongosh --eval "db.adminCommand('ping')"` |

---

## 📞 Need More Help?

- **Quick Reference**: [MONGODB_QUICK_REF.md](MONGODB_QUICK_REF.md) (5 min read)
- **Complete Guide**: [MONGODB_SETUP_GUIDE.md](MONGODB_SETUP_GUIDE.md) (20 min read)
- **Troubleshooting**: See MONGODB_SETUP_GUIDE.md section "Troubleshooting"
- **Data Details**: [MONGODB_DATA_SETUP_COMPLETE.md](MONGODB_DATA_SETUP_COMPLETE.md)

---

## 🎉 You're All Set!

Everything is configured and ready to run. **Start with:**

```bash
# Option 1: Full auto-setup
./setup-mongodb.sh

# Option 2: Quick seed (if MongoDB running)
./seed-mongodb.sh

# Verify
mongosh unified-defect-analyzer && db.logs.countDocuments()

# Start API
npm run dev
```

**Then check the [MONGODB_QUICK_REF.md](MONGODB_QUICK_REF.md) for next steps!**

---

**Status**: ✅ READY  
**Setup Time**: < 5 minutes  
**Documentation**: Comprehensive  
**Sample Data**: 18 records  

🚀 **Let's get started!**
