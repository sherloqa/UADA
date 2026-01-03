# Unified AI Defect Analyzer - API

> **Phase 1: Log Upload & Storage API**

A comprehensive REST API for uploading, storing, and querying test execution logs and artifacts for the Unified AI Defect Analyzer system.

## 🎯 Overview

This API implements **Phase 1** of the Unified AI Defect Analyzer, providing the foundational data layer for a multi-agent AI system that analyzes test failures and classifies defects using RAG (Retrieval-Augmented Generation).

### Key Capabilities

- ✅ **Multi-artifact support**: HAR files, screenshots, backend logs, test results, UI logs, API logs, videos, network traces
- ✅ **Multi-tenant isolation**: Secure team-based data segregation
- ✅ **Flexible querying**: Rich filtering, pagination, and search capabilities
- ✅ **AI-ready**: Processing pipeline support for future AI agent integration
- ✅ **Evidence correlation**: Link related artifacts for comprehensive analysis

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI

# Run in development
npm run dev

# Server runs on http://localhost:3000
```

### First API Call

```bash
# Health check
curl http://localhost:3000/health

# Upload a log
curl -X POST http://localhost:3000/api/logs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "my-team",
    "level": "error",
    "message": "Test failed",
    "artifactType": "ui_log",
    "artifactData": {"error": "Element not found"}
  }'
```

## 📚 Documentation

- **[API Documentation](./API_DOCUMENTATION.md)** - Complete endpoint reference with examples
- **[Postman Collection](./postman_collection.json)** - Import for instant testing
- **[Technical Architecture](../Technical%20Markup%20diagram.ini)** - System design

## 🏗️ Project Structure

```
unified-defect-analyzer-api/
├── src/
│   ├── models/          # MongoDB schemas (Log model with 8 artifact types)
│   ├── services/        # Business logic (CRUD operations, queries)
│   ├── controllers/     # Request handlers (11 endpoints)
│   ├── routes/          # API routes
│   ├── validators/      # express-validator schemas
│   ├── middleware/      # Error handling, validation
│   ├── config/          # Database connection
│   ├── types/           # TypeScript types
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── tests/               # Jest test suites
├── API_DOCUMENTATION.md # Full API reference
├── postman_collection.json
└── package.json
```

## 📊 Key Features

### Artifact Types Supported

| Type | Description |
|------|-------------|
| `har` | HTTP Archive files from network captures |
| `screenshot` | UI screenshots from failed tests |
| `backend_log` | Server/backend application logs |
| `test_result` | Test execution results and metadata |
| `ui_log` | Frontend console logs and errors |
| `api_log` | API test logs and responses |
| `video` | Screen recordings of test runs |
| `network_trace` | Detailed network traces |

### API Endpoints (11 Total)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/logs/upload` | POST | Upload single log |
| `/api/logs/upload/bulk` | POST | Upload multiple logs (max 100) |
| `/api/logs` | GET | Query logs with filters |
| `/api/logs/:id` | GET | Get specific log |
| `/api/logs/testrun/:id` | GET | Get all logs for test run |
| `/api/logs/pending` | GET | Get logs awaiting AI processing |
| `/api/logs/stats` | GET | Get analytics/statistics |
| `/api/logs/:id/status` | PUT | Update processing status |
| `/api/logs/:id/classification` | PUT | Update AI classification |
| `/api/logs/:id` | DELETE | Delete log |

## 🔍 Example Usage

### Upload Different Artifact Types

```javascript
// UI Log with screenshot
POST /api/logs/upload
{
  "teamId": "qa-team",
  "testRunId": "run-123",
  "level": "error",
  "message": "Login button not clickable",
  "artifactType": "ui_log",
  "artifactData": {
    "screenshot": "base64_data...",
    "domSnapshot": "<html>...</html>",
    "consoleErrors": ["TypeError: Cannot read property..."]
  },
  "context": {
    "testName": "Login Flow",
    "browser": "Chrome 120",
    "environment": "staging"
  }
}

// HAR File from API test
{
  "teamId": "api-team",
  "artifactType": "har",
  "level": "error",
  "message": "Payment API failed",
  "artifactData": {
    "log": {
      "entries": [/* HAR entries */]
    }
  }
}

// Backend Log
{
  "teamId": "backend-team",
  "artifactType": "backend_log",
  "level": "critical",
  "message": "Database connection failed",
  "artifactData": {
    "stackTrace": "Error at...",
    "timestamp": "2026-01-03T10:30:00Z"
  }
}
```

### Query Examples

```bash
# Get all errors for a team
GET /api/logs?teamId=my-team&level=error

# Get logs for specific test run
GET /api/logs?teamId=my-team&testRunId=run-456

# Get UI logs from last 7 days
GET /api/logs?teamId=my-team&artifactType=ui_log&startDate=2026-01-01

# Pagination
GET /api/logs?teamId=my-team&limit=50&skip=100
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage

# Use Postman collection
# Import postman_collection.json into Postman
```

## 🔐 Multi-Tenant Security

All endpoints enforce team isolation:

```typescript
// Every request requires teamId
GET /api/logs?teamId=team-abc  // Only sees team-abc data
POST /api/logs/upload { "teamId": "team-abc", ... }

// Cross-team access prevented at database level
```

## 📈 Performance

### Optimized Indexes

```typescript
// Fast queries on common patterns
{ teamId: 1, timestamp: -1 }        // Recent logs by team
{ teamId: 1, testRunId: 1 }         // Test run correlation
{ teamId: 1, artifactType: 1 }      // Filter by type
{ teamId: 1, processingStatus: 1 }  // Pending logs for AI
```

### Pagination Support

```bash
# Handle large datasets efficiently
GET /api/logs?teamId=team&limit=100&skip=0

Response:
{
  "data": {
    "logs": [...],
    "pagination": {
      "total": 1247,
      "limit": 100,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

## 🤖 AI Agent Integration (Future)

The API is designed for AI agent orchestration:

```typescript
// 1. Agent polls for pending logs
GET /api/logs/pending?teamId=team

// 2. Agent marks as processing
PUT /api/logs/123/status
{ "status": "processing" }

// 3. Agent performs RAG analysis
// (Vision models, embeddings, etc.)

// 4. Agent updates classification
PUT /api/logs/123/classification
{
  "classification": {
    "isDefect": true,
    "defectType": "UI Bug",
    "confidence": "high",
    "severity": "critical"
  }
}

// 5. Mark as completed
PUT /api/logs/123/status
{ "status": "completed" }
```

## 🌐 Environment Variables

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/unified-defect-analyzer
LOG_LEVEL=debug
```

## 🔄 Development

```bash
# Development with auto-reload
npm run dev

# Build TypeScript
npm run build

# Production
npm start

# Linting
npm run lint
```

## 📦 Dependencies

### Core
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `express-validator` - Request validation
- `dotenv` - Environment configuration

### Development
- `typescript` - Type safety
- `ts-node-dev` - Development server
- `jest` - Testing framework

## 🚢 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use MongoDB Atlas or cluster
- [ ] Configure proper CORS
- [ ] Set up monitoring
- [ ] Enable logging aggregation
- [ ] Configure backup strategy

## 🗺️ Roadmap

### ✅ Phase 1 (Current) - COMPLETE
- ✅ Log upload & storage API
- ✅ Multi-artifact support
- ✅ Multi-tenant isolation
- ✅ Query & filtering
- ✅ Processing status tracking

### 🔄 Phase 2 (Next)
- 🔲 AI agent integration
- 🔲 Vector embeddings (RAG)
- 🔲 Vision analysis for screenshots
- 🔲 Automated classification

### 📅 Phase 3
- 🔲 Jira integration
- 🔲 Real-time processing
- 🔲 Dashboard & analytics
- 🔲 Flaky test detection

## 🤝 Contributing

1. Follow Technical Architecture guidelines
2. Add tests for new features
3. Update API documentation
4. Maintain TypeScript types

## 📄 License

MIT

## 🆘 Support

- API Docs: `API_DOCUMENTATION.md`
- Architecture: `../Technical Markup diagram.ini`
- Issues: Create a GitHub issue

---

**Status**: ✅ Phase 1 Complete - Ready for AI Agent Integration  
**Next**: Vector embeddings and RAG analysis
