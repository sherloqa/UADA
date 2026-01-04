````markdown
# 🚀 Phase 2 AI Agent Service - Quick Start

## What's New

Built a complete AI agent system for automated defect analysis:

### 4 Powerful Services

1. **AI Agent Service** - Orchestrates the analysis pipeline
2. **RAG Service** - Retrieves similar past issues for context
3. **Vision Service** - Analyzes screenshots for visual defects
4. **Classification Service** - Classifies defects and generates recommendations

### 9 New REST Endpoints

- Agent control: Start, stop, status, health check
- Manual processing: Trigger log analysis
- Configuration: Tune behavior
- Statistics: View RAG and classification metrics

---

## Try It Now

### 1. Start the Server

```bash
npm run dev
```

### 2. Upload a Test Log

```bash
curl -X POST http://localhost:3000/api/logs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "demo-team",
    "level": "error",
    "message": "Login button not clickable",
    "artifactType": "ui_log",
    "artifactData": {
      "error": "Element not found",
      "selector": "#login-submit"
    }
  }'
```

### 3. Start the AI Agent

```bash
curl -X POST http://localhost:3000/api/agent/start \
  -H "Content-Type: application/json" \
  -d '{"teamId": "demo-team"}'
```

### 4. Check Status

```bash
curl http://localhost:3000/api/agent/status
```

### 5. Get Results

```bash
curl "http://localhost:3000/api/logs?teamId=demo-team"
```

The log will have a `classification` field with:
- **defectType** - What kind of defect
- **severity** - How serious (low, medium, high, critical)
- **confidence** - How confident (low, medium, high)
- **recommendations** - What to do next
- **isFlaky** - Is it a flaky test?

---

## Key Features

### 🎯 Intelligent Classification

Automatically determines:
- **Defect Type**: UI bug, API error, backend error, timeout, flaky test, etc.
- **Severity**: Low, medium, high, critical
- **Confidence**: How sure the classification is
- **Root Cause**: What likely caused the failure
- **Recommendations**: Actionable steps to fix

### 📚 Context-Aware Analysis (RAG)

- Retrieves similar past issues
- Learns from history
- Improves classification accuracy
- Provides pattern insights

### 👁️ Screenshot Analysis

- Detects missing UI elements
- Identifies layout issues
- Finds color/contrast problems
- Analyzes text rendering

### 🧪 Flaky Test Detection

- Identifies intermittent failures
- Tracks retry patterns
- Calculates flakiness score (0-1)
- Distinguishes from real defects

---

## API Reference

### Start Agent
```bash
POST /api/agent/start
{
  "teamId": "my-team"  // optional
}
```

### Stop Agent
```bash
POST /api/agent/stop
```

### Get Status
```bash
GET /api/agent/status
GET /api/agent/health
```

### Process Pending Logs
```bash
POST /api/agent/process-pending
{
  "teamId": "my-team"  // optional
}
```

### Configuration
```bash
PUT /api/agent/config/poll-interval
{ "interval": 5000 }  // milliseconds

PUT /api/agent/config/rag-threshold
{ "threshold": 0.7 }  // 0-1 scale

PUT /api/agent/config/vision-model
{ "provider": "openai" }  // or "claude"
```

### Statistics
```bash
GET /api/agent/stats/rag?teamId=my-team
GET /api/agent/stats/classification?teamId=my-team
```

---

## Architecture

```
Upload Log → Agent Polls → Analyzes → RAG Retrieves → Classifies → Updates Log
(Phase 1)   (Phase 2)     Context    Similar Issues   Defect      with Result
```

### Analysis Pipeline

1. **Receive** pending log
2. **Analyze** based on artifact type (screenshot, HAR, logs, etc.)
3. **Retrieve** similar past issues using RAG
4. **Classify** defect type, severity, confidence
5. **Generate** recommendations
6. **Detect** if it's a flaky test
7. **Update** log with classification
8. **Repeat** for next log

---

## Defect Types

The agent classifies logs into 10 defect types:

| Type | Description |
|------|-------------|
| `ui_bug` | Frontend/UI element issues |
| `api_error` | API endpoint failures (4xx, 5xx) |
| `backend_error` | Server/database errors |
| `timeout` | Operation timeouts |
| `network_issue` | Network connectivity problems |
| `assertion_failure` | Test assertion failures |
| `authentication_error` | Auth/permission failures |
| `environment_issue` | Config/environment problems |
| `data_issue` | Test data problems |
| `flaky_test` | Intermittent failures |

---

## Example Output

```json
{
  "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "teamId": "qa-team",
  "message": "Login button not clickable",
  "artifactType": "ui_log",
  "processingStatus": "completed",
  "classification": {
    "isDefect": true,
    "defectType": "ui_bug",
    "severity": "high",
    "confidence": "high",
    "rootCauseAnalysis": "Submit button missing from login form",
    "recommendations": [
      "Review recent CSS/layout changes",
      "Test on Chrome, Firefox, Safari",
      "Verify DOM selectors",
      "Check button visibility rules"
    ],
    "isFlaky": false,
    "flakinessScore": 0.15,
    "timestamp": "2026-01-04T10:30:00.000Z"
  }
}
```

---

## Troubleshooting

**Agent not processing logs?**
- Check it's started: `GET /api/agent/status`
- Verify logs are pending: `GET /api/logs?processingStatus=pending`
- Check MongoDB connection

**Incorrect classifications?**
- Adjust RAG threshold (lower = looser matching)
- Add more context in uploaded logs
- Check artifact data quality

**Slow processing?**
- Reduce poll interval (higher frequency)
- Increase batch size
- Use vision API hooks instead of local analysis

---

## Files Created

```
src/services/
  ├── aiAgentService.ts          (500+ lines)
  ├── ragService.ts              (300+ lines)
  ├── visionService.ts           (400+ lines)
  └── classificationService.ts   (500+ lines)

src/controllers/
  └── agentController.ts         (300+ lines)

src/routes/
  └── agent.ts                   (150+ lines)

Documentation/
  └── PHASE2_IMPLEMENTATION.md   (Complete guide)
```

---

## Next Steps

1. ✅ **Try it out** with sample logs
2. 🔄 **Tune configuration** based on your needs
3. 🔗 **Connect to Jira** (Phase 3)
4. 📊 **Build dashboard** (Phase 3)
5. 🚀 **Deploy to production** (Phase 3)

---

## Status

✅ Phase 2 Implementation Complete

- AI Agent Service: 4 intelligent services
- 9 REST API endpoints
- Full documentation
- Ready for production testing

**Next**: Integrate with production vision APIs and vector databases

````
