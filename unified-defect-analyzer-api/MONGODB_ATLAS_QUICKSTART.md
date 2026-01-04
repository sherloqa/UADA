# 🚀 MongoDB Atlas Only - Quick Start

## TL;DR

The project now **REQUIRES** MongoDB Atlas. No local MongoDB support.

### Setup in 3 Steps

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env with your MongoDB Atlas URI
# MONGODB_URI=mongodb+srv://dbUser:password@cluster.mongodb.net/db

# 3. Start
npm install
npm run build
npm run dev
```

### Verify Configuration

```bash
./verify-mongodb-config.sh
```

## Common Tasks

### Run API Server
```bash
npm run dev
# → http://localhost:3000
```

### Seed Database
```bash
./seed-mongodb.sh
# → Seeds 218 records (8 logs + 105 defects + 105 tests)
```

### Run Tests
```bash
./test-agent.sh
```

### Integration Tests
```bash
./test-integration.sh
```

## Troubleshooting

### "MONGODB_URI environment variable is not set"
```bash
# Check if .env exists
ls -la .env

# Check if MONGODB_URI is set
echo $MONGODB_URI

# If empty, edit .env and add your MongoDB Atlas URI
```

### "Cannot connect to MongoDB"
- Verify credentials in MONGODB_URI
- Check IP is whitelisted in MongoDB Atlas
- Verify cluster is running
- Check network connectivity

### "Port 3000 already in use"
```bash
PORT=3001 npm run dev
```

## Documentation

- 📖 [MONGODB_ATLAS_ONLY.md](./MONGODB_ATLAS_ONLY.md) - Full setup guide
- 📖 [MONGODB_ATLAS_MIGRATION.md](./MONGODB_ATLAS_MIGRATION.md) - What changed
- 📖 [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing documentation
- 📖 [README.md](./README.md) - Project overview

## Files Changed

```
✅ src/config/db.ts - Requires MONGODB_URI
✅ src/seed/seedDatabase.ts - Requires MONGODB_URI  
✅ src/seed/seedVectorCollections.ts - Requires MONGODB_URI
✅ seed-mongodb.sh - Requires MONGODB_URI
✅ test-integration.sh - Requires MONGODB_URI
✅ .env.example - Template file (NEW)
```

## Tools Added

```
✅ verify-mongodb-config.sh - Configuration checker
✅ MONGODB_ATLAS_ONLY.md - Setup guide
✅ MONGODB_ATLAS_MIGRATION.md - Change documentation
```

## Status

✅ All localhost fallbacks removed  
✅ Environment variable validation added  
✅ TypeScript compiles cleanly  
✅ Ready for deployment  

**Last Updated:** January 4, 2026
