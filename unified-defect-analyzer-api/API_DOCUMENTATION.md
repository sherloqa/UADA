# Unified AI Defect Analyzer - API Documentation

## Phase 1: Log Upload & Storage API

This API provides endpoints for uploading, storing, and querying test execution logs and artifacts for the Unified AI Defect Analyzer system.

## Table of Contents
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Examples](#examples)

## Getting Started

### Prerequisites
- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your MongoDB connection string
# MONGODB_URI=mongodb://localhost:27017/unified-defect-analyzer

# Run in development mode
npm run dev

# Build for production
npm run build
npm start
```

### Environment Variables

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/unified-defect-analyzer
LOG_LEVEL=debug
```

## API Endpoints

### Health Check
```
GET /health
```
Returns API health status.

### Upload Single Log
```
POST /api/logs/upload
```

**Request Body:**
```json
{
  "teamId": "team-123",
  "testRunId": "run-456",
  "failureId": "fail-789",
  "level": "error",
  "message": "Test failed: Login button not clickable",
  "artifactType": "ui_log",
  "artifactData": {
    "screenshot": "base64_data_here",
    "domSnapshot": "<html>...</html>",
    "consoleErrors": ["Error: Element not found"]
  },
  "context": {
    "testName": "Login Test",
    "testSuite": "Authentication Suite",
    "environment": "staging",
    "browser": "Chrome 120",
    "platform": "Windows 11",
    "buildNumber": "1.2.3",
    "commitHash": "abc123def456"
  },
  "metadata": {
    "duration": 5000,
    "retryCount": 2
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Log uploaded successfully",
  "data": {
    "logId": "65f1a2b3c4d5e6f7a8b9c0d1",
    "teamId": "team-123",
    "artifactType": "ui_log",
    "processingStatus": "pending",
    "timestamp": "2026-01-03T10:30:00.000Z"
  }
}
```

### Upload Bulk Logs
```
POST /api/logs/upload/bulk
```

**Request Body:**
```json
{
  "logs": [
    {
      "teamId": "team-123",
      "level": "error",
      "message": "API test failed",
      "artifactType": "har",
      "artifactData": { "entries": [...] }
    },
    {
      "teamId": "team-123",
      "level": "error",
      "message": "Backend error",
      "artifactType": "backend_log",
      "artifactData": { "stackTrace": "..." }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "2 logs uploaded successfully",
  "data": {
    "count": 2,
    "logIds": ["65f1a2b3...", "65f1a2b4..."]
  }
}
```

### Query Logs
```
GET /api/logs?teamId=team-123&artifactType=ui_log&limit=10
```

**Query Parameters:**
- `teamId` (required): Team identifier
- `testRunId` (optional): Filter by test run
- `failureId` (optional): Filter by failure ID
- `artifactType` (optional): Filter by artifact type (har, screenshot, backend_log, etc.)
- `level` (optional): Filter by log level (info, warn, error, debug, critical)
- `processingStatus` (optional): Filter by status (pending, processing, completed, failed)
- `testName` (optional): Filter by test name
- `testSuite` (optional): Filter by test suite
- `startDate` (optional): Start date (ISO 8601)
- `endDate` (optional): End date (ISO 8601)
- `limit` (optional): Max results (default: 100, max: 1000)
- `skip` (optional): Skip results for pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "pagination": {
      "total": 245,
      "limit": 10,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

### Get Log by ID
```
GET /api/logs/:logId?teamId=team-123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "teamId": "team-123",
    "testRunId": "run-456",
    "level": "error",
    "message": "Test failed",
    "artifactType": "ui_log",
    "artifactData": {...},
    "context": {...},
    "processingStatus": "pending",
    "timestamp": "2026-01-03T10:30:00.000Z",
    "createdAt": "2026-01-03T10:30:00.000Z",
    "updatedAt": "2026-01-03T10:30:00.000Z"
  }
}
```

### Get Logs by Test Run
```
GET /api/logs/testrun/:testRunId?teamId=team-123
```

### Get Pending Logs
```
GET /api/logs/pending?teamId=team-123&limit=50
```

Returns logs with `processingStatus: "pending"` for AI agent processing.

### Update Processing Status
```
PUT /api/logs/:logId/status
```

**Request Body:**
```json
{
  "teamId": "team-123",
  "status": "completed",
  "error": "Optional error message if failed"
}
```

### Update Classification
```
PUT /api/logs/:logId/classification
```

**Request Body:**
```json
{
  "teamId": "team-123",
  "classification": {
    "isDefect": true,
    "defectType": "UI Bug",
    "confidence": "high",
    "severity": "high"
  }
}
```

### Get Statistics
```
GET /api/logs/stats?teamId=team-123&days=7
```

Returns aggregated statistics for dashboard.

### Delete Log
```
DELETE /api/logs/:logId?teamId=team-123
```

## Data Models

### Artifact Types
- `har` - HTTP Archive files
- `screenshot` - UI screenshots
- `backend_log` - Backend/server logs
- `test_result` - Test execution results
- `ui_log` - Frontend/UI logs
- `api_log` - API test logs
- `video` - Screen recordings
- `network_trace` - Network traces

### Log Levels
- `info` - Informational messages
- `warn` - Warning messages
- `error` - Error messages
- `debug` - Debug messages
- `critical` - Critical failures

### Severity Levels
- `low` - Minor issues
- `medium` - Moderate impact
- `high` - Significant impact
- `critical` - Blocker issues

### Processing Status
- `pending` - Awaiting AI processing
- `processing` - Currently being analyzed
- `completed` - Analysis complete
- `failed` - Processing failed

## Examples

### Example 1: Upload HAR File
```bash
curl -X POST http://localhost:3000/api/logs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "payments-team",
    "testRunId": "run-001",
    "level": "error",
    "message": "Payment API returned 500 error",
    "artifactType": "har",
    "artifactData": {
      "log": {
        "version": "1.2",
        "entries": [...]
      }
    },
    "context": {
      "testName": "Payment Processing",
      "environment": "production"
    }
  }'
```

### Example 2: Query Recent Errors
```bash
curl "http://localhost:3000/api/logs?teamId=payments-team&level=error&limit=20"
```

### Example 3: Get Test Run Logs
```bash
curl "http://localhost:3000/api/logs/testrun/run-001?teamId=payments-team"
```

## Multi-Tenant Isolation

All endpoints require a `teamId` parameter to ensure data isolation between teams. The API enforces tenant boundaries at the database query level.

## Next Steps (Phase 2+)

- AI agent integration for automatic processing
- Vector embeddings for RAG analysis
- Jira integration for defect creation
- Real-time processing pipeline
- Advanced analytics and reporting

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "status": "error",
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "teamId",
      "message": "teamId is required"
    }
  ]
}
```

## Support

For issues or questions, please refer to the Technical Architecture document.
