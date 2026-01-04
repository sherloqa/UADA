# 🗄️ MongoDB Atlas Only Configuration

This project is now configured to use **ONLY MongoDB Atlas** (remote MongoDB) via connection URI from environment variables. No local MongoDB instance is supported or required.

## ✅ What Changed

### Files Updated
1. **src/config/db.ts** - Requires MONGODB_URI environment variable, no localhost fallback
2. **src/seed/seedDatabase.ts** - Requires MONGODB_URI environment variable, no localhost fallback
3. **seed-mongodb.sh** - Script exits if MONGODB_URI is not set
4. **test-integration.sh** - Integration tests require MONGODB_URI environment variable

### Behavior Changes
- ❌ **No longer supported:** Using local MongoDB at `mongodb://localhost:27017`
- ✅ **Required:** MONGODB_URI environment variable must be set
- ✅ **Enforced:** Application will not start if MONGODB_URI is missing
- ✅ **Validated:** Clear error messages guide users to set environment variable

## 🚀 Setup Instructions

### 1. Create .env File
Create `.env` file in the project root with your MongoDB Atlas connection string:

```env
MONGODB_URI=mongodb+srv://dbUser:hackathon123@cluster0.7i92sqy.mongodb.net/unified-defect-analyzer?appName=Cluster0
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

### 2. Obtain MongoDB Atlas URI
If you don't have MongoDB Atlas set up:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create or select your cluster
3. Click "Connect"
4. Choose "Drivers"
5. Copy the connection string
6. Replace `<username>` and `<password>` with your credentials
7. Paste into `.env` as MONGODB_URI

### 3. Verify Environment Variable
Check that MONGODB_URI is properly loaded:

```bash
# View the URI (masked for security)
echo $MONGODB_URI | cut -d'@' -f1 && echo "@[MASKED]"

# Output should show: mongodb+srv://dbUser:[MASKED]@[cluster]...
```

## 🏃 Running Commands

### Start the API Server
```bash
npm run dev
```

**Expected Output:**
```
✓ MongoDB connected successfully to: cluster0.7i92sqy.mongodb.net/unified-defect-analyzer?appName=Cluster0
✓ Server: http://localhost:3000
✓ Health Check: http://localhost:3000/health
✓ API Endpoint: http://localhost:3000/api/logs
```

### Seed the Database
```bash
./seed-mongodb.sh
```

**Expected Output:**
```
════════════════════════════════════════════════════════════
📊 Seeding MongoDB with 100+ Sample Defects & Tests
════════════════════════════════════════════════════════════
Connection: mongodb+srv://...
...
✅ Total Logs: 8
✅ Historic Defects: 105
✅ Test Executions: 105
✅ Total Records: 218
```

### Run Integration Tests
```bash
./test-integration.sh
```

**Expected Output:**
```
==========================================
🧪 Starting Integration Tests
==========================================
```

## ⚠️ Error Handling

### Missing MONGODB_URI
If MONGODB_URI is not set:

```
❌ ERROR: MONGODB_URI environment variable is not set
Please set MONGODB_URI in your .env file
```

**Solution:** Add MONGODB_URI to `.env` file

### Invalid MongoDB URI
If the URI is invalid:

```
ERROR: MongoDB connection failed: MongoAuthenticationError
```

**Solutions:**
- Verify credentials in the URI
- Check IP whitelist in MongoDB Atlas
- Ensure cluster is running
- Verify network connectivity

### Connection Timeout
If connection times out:

```
ERROR: MongoDB connection failed: MongoNetworkTimeoutError
```

**Solutions:**
- Check internet connection
- Verify MongoDB Atlas cluster status
- Check firewall/proxy settings
- Ensure IP is whitelisted in MongoDB Atlas

## 🔐 Security Best Practices

### ✅ Do
- Store credentials in `.env` file (not committed to git)
- Use `.env` in `.gitignore`
- Use IP whitelist in MongoDB Atlas
- Use strong passwords
- Rotate credentials periodically
- Use read-only credentials for non-production environments

### ❌ Don't
- Hardcode credentials in source code
- Commit `.env` to git repository
- Share connection strings in chat/email
- Use same credentials for production
- Commit credentials to version control

## 📋 Environment Variables Reference

```bash
# Required
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/db?appName=value

# Optional
PORT=3000                      # API server port (default: 3000)
NODE_ENV=development          # development|production|staging
LOG_LEVEL=info                # error|warn|info|debug
```

## 🧪 Testing Connection

### Test Connection Without Starting Server
```bash
# Load .env and test with mongosh
export $(cat .env | grep MONGODB_URI)
mongosh "$MONGODB_URI" --eval "console.log('Connected!')"
```

### Test API Connection
```bash
# Start server
npm run dev

# In another terminal
curl http://localhost:3000/health
```

## 📚 Related Documentation

- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Complete testing guide
- [SCALING_SUMMARY.md](./SCALING_SUMMARY.md) - Data seeding information
- [README.md](./README.md) - Project overview

## 🆘 Troubleshooting

### Application Won't Start
```bash
# Check if MONGODB_URI is set
echo $MONGODB_URI

# Should output something like: mongodb+srv://...
# If empty, run: export $(cat .env | grep -v '^#' | xargs)
```

### Scripts Not Executing
```bash
# Make scripts executable
chmod +x seed-mongodb.sh test-integration.sh test-agent.sh

# Run with bash explicitly
bash seed-mongodb.sh
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process (replace PID)
kill -9 <PID>

# Or run on different port
PORT=3001 npm run dev
```

---

**Last Updated:** January 4, 2026  
**Status:** Active - MongoDB Atlas Only  
**Compatibility:** Node.js 16+, MongoDB 7.0+
