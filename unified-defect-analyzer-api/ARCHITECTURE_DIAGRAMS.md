# Architecture & Flow Diagrams

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Test Automation / Users                      │
│              (Uploads logs, HAR files, screenshots)              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP REST API
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Unified Defect Analyzer API                    │
│                         (Express.js)                             │
│                                                                   │
│  ┌────────────┐  ┌─────────────┐  ┌───────────────────────┐    │
│  │  Routes    │→ │ Controllers │→ │   Validators          │    │
│  │ (11 APIs)  │  │ (Handlers)  │  │ (express-validator)   │    │
│  └────────────┘  └─────────────┘  └───────────────────────┘    │
│         │               │                                        │
│         │               ▼                                        │
│         │      ┌─────────────────┐                              │
│         │      │   Services      │                              │
│         │      │  (Business      │                              │
│         │      │   Logic)        │                              │
│         │      └────────┬────────┘                              │
│         │               │                                        │
│         └───────────────┴─────────────┐                         │
│                                       │                         │
│                                       ▼                         │
│                              ┌─────────────────┐                │
│                              │  Mongoose ODM   │                │
│                              └────────┬────────┘                │
└───────────────────────────────────────┼─────────────────────────┘
                                        │
                                        ▼
                        ┌───────────────────────────┐
                        │      MongoDB Cluster      │
                        │                           │
                        │  Collections:             │
                        │  • logs (main)            │
                        │                           │
                        │  Indexes:                 │
                        │  • teamId                 │
                        │  • testRunId              │
                        │  • timestamp              │
                        │  • artifactType           │
                        │  • processingStatus       │
                        │  • Compound indexes       │
                        └───────────────────────────┘
```

## Data Flow - Upload Log

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ POST /api/logs/upload
     │ {
     │   teamId: "team-123",
     │   level: "error",
     │   message: "Test failed",
     │   artifactType: "ui_log",
     │   artifactData: {...}
     │ }
     │
     ▼
┌────────────────────┐
│  Express Router    │
│  (routes/logs.ts)  │
└────┬───────────────┘
     │
     │ Route matching
     │
     ▼
┌────────────────────────┐
│  Validation Middleware │
│  (uploadLogValidator)  │
│  • Check required      │
│  • Validate types      │
│  • Validate enums      │
└────┬───────────────────┘
     │
     │ Validation passed
     │
     ▼
┌────────────────────────┐
│   LogsController       │
│   uploadLog()          │
│  • Extract req.body    │
│  • Call service        │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│   LogsService          │
│   saveLog()            │
│  • Create Log model    │
│  • Set defaults        │
│  • Save to MongoDB     │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│      MongoDB           │
│  • Insert document     │
│  • Generate _id        │
│  • Set timestamps      │
└────┬───────────────────┘
     │
     │ Return saved document
     │
     ▼
┌────────────────────────┐
│   Response to Client   │
│   {                    │
│     success: true,     │
│     data: {            │
│       logId: "...",    │
│       status: "pending"│
│     }                  │
│   }                    │
└────────────────────────┘
```

## Query Flow - Get Logs

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ GET /api/logs?teamId=team-123&level=error&limit=10
     │
     ▼
┌────────────────────┐
│  Express Router    │
└────┬───────────────┘
     │
     ▼
┌────────────────────────┐
│  Query Validator       │
│  • teamId required     │
│  • level enum check    │
│  • limit range         │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│   LogsController       │
│   queryLogs()          │
│  • Parse query params  │
│  • Build QueryDTO      │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│   LogsService          │
│   queryLogs()          │
│  • Build MongoDB query │
│  • Apply filters       │
│  • Add pagination      │
│  • Sort by timestamp   │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│      MongoDB           │
│  db.logs.find({        │
│    teamId: "team-123", │
│    level: "error"      │
│  })                    │
│  .sort({timestamp:-1}) │
│  .limit(10)            │
└────┬───────────────────┘
     │
     │ Return documents
     │
     ▼
┌────────────────────────┐
│   Response             │
│   {                    │
│     success: true,     │
│     data: {            │
│       logs: [...],     │
│       pagination: {...}│
│     }                  │
│   }                    │
└────────────────────────┘
```

## AI Agent Integration Flow (Phase 2)

```
┌────────────────────────────────────────────────────────────┐
│                    AI Agent Orchestrator                    │
│                     (Future - Phase 2)                      │
└────────┬───────────────────────────────────────────────────┘
         │
         │ 1. Poll for pending logs
         │
         ▼
┌────────────────────────┐
│  GET /api/logs/pending │
│  ?teamId=team-123      │
└────────┬───────────────┘
         │
         │ Returns logs with processingStatus: "pending"
         │
         ▼
┌────────────────────────────────┐
│  Agent: Process each log       │
│  • Extract artifactData        │
│  • Determine artifact type     │
└────────┬───────────────────────┘
         │
         │ 2. Mark as processing
         │
         ▼
┌────────────────────────────┐
│ PUT /api/logs/:id/status   │
│ { status: "processing" }   │
└────────┬───────────────────┘
         │
         │ 3. Perform Analysis
         │
         ▼
┌─────────────────────────────────────────┐
│  Agent Analysis Pipeline:                │
│  ┌───────────────────────────────────┐  │
│  │ IF artifactType == "screenshot"   │  │
│  │   → Vision Model (GPT-4V/Claude)  │  │
│  │   → Extract visual defects        │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ IF artifactType == "har"          │  │
│  │   → Parse HTTP requests           │  │
│  │   → Analyze status codes          │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ IF artifactType == "backend_log"  │  │
│  │   → Parse stack traces            │  │
│  │   → Extract error patterns        │  │
│  └───────────────────────────────────┘  │
│                                          │
│  Common Processing:                      │
│  • Create embeddings                     │
│  • RAG retrieval (similar past issues)   │
│  • LLM analysis for root cause          │
│  • Classification (bug vs flaky)         │
│  • Severity assessment                   │
└────────┬─────────────────────────────────┘
         │
         │ 4. Update Classification
         │
         ▼
┌────────────────────────────────────┐
│ PUT /api/logs/:id/classification   │
│ {                                  │
│   isDefect: true,                  │
│   defectType: "UI Bug",            │
│   confidence: "high",              │
│   severity: "high"                 │
│ }                                  │
└────────┬───────────────────────────┘
         │
         │ 5. Mark as completed
         │
         ▼
┌────────────────────────────┐
│ PUT /api/logs/:id/status   │
│ { status: "completed" }    │
└────────────────────────────┘
```

## Multi-Tenant Isolation

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Requests                       │
└────┬─────────────────┬──────────────────┬──────────────────┘
     │                 │                  │
     │ Team A          │ Team B           │ Team C
     │ (teamId: A)     │ (teamId: B)      │ (teamId: C)
     │                 │                  │
     ▼                 ▼                  ▼
┌────────────────────────────────────────────────────────────┐
│                      API Layer                             │
│  All requests MUST include teamId parameter                │
└────┬─────────────────┬──────────────────┬─────────────────┘
     │                 │                  │
     ▼                 ▼                  ▼
┌────────────────────────────────────────────────────────────┐
│                   Service Layer                            │
│  Automatically filters all queries by teamId               │
│                                                             │
│  Query: { teamId: "A", ...otherFilters }                   │
└────┬─────────────────┬──────────────────┬─────────────────┘
     │                 │                  │
     ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB                                │
│                                                              │
│  logs Collection:                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ { _id: 1, teamId: "A", ... }  ← Team A sees this     │  │
│  │ { _id: 2, teamId: "B", ... }  ← Team B sees this     │  │
│  │ { _id: 3, teamId: "A", ... }  ← Team A sees this     │  │
│  │ { _id: 4, teamId: "C", ... }  ← Team C sees this     │  │
│  │ { _id: 5, teamId: "B", ... }  ← Team B sees this     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Index: { teamId: 1 } for fast filtering                    │
└──────────────────────────────────────────────────────────────┘

Security Rules:
✓ teamId is REQUIRED in all requests
✓ All queries automatically filter by teamId
✓ Cross-team access is IMPOSSIBLE at database level
✓ Each team sees only their own data
```

## Evidence Correlation Structure

```
Test Run: "run-001" (Single test execution)
│
├─ Log 1: UI Log
│  ├─ _id: "log-1"
│  ├─ testRunId: "run-001"
│  ├─ failureId: "fail-xyz"
│  ├─ artifactType: "ui_log"
│  ├─ artifactData: { consoleErrors: [...] }
│  └─ relatedArtifacts: ["log-2", "log-3"]
│
├─ Log 2: Screenshot
│  ├─ _id: "log-2"
│  ├─ testRunId: "run-001"
│  ├─ failureId: "fail-xyz"
│  ├─ artifactType: "screenshot"
│  ├─ artifactData: { imageBase64: "..." }
│  └─ relatedArtifacts: ["log-1", "log-3"]
│
├─ Log 3: HAR File
│  ├─ _id: "log-3"
│  ├─ testRunId: "run-001"
│  ├─ failureId: "fail-xyz"
│  ├─ artifactType: "har"
│  ├─ artifactData: { entries: [...] }
│  └─ relatedArtifacts: ["log-1", "log-2", "log-4"]
│
└─ Log 4: Backend Log
   ├─ _id: "log-4"
   ├─ testRunId: "run-001"
   ├─ failureId: "fail-xyz"
   ├─ artifactType: "backend_log"
   ├─ artifactData: { stackTrace: "..." }
   └─ relatedArtifacts: ["log-3"]

AI Agent can:
1. Query by testRunId to get ALL related logs
2. Query by failureId to get specific failure evidence
3. Follow relatedArtifacts links for cross-layer correlation
4. Build comprehensive defect analysis from multiple sources
```

## File Structure

```
unified-defect-analyzer-api/
│
├── src/
│   ├── models/
│   │   └── Log.ts                    # 📊 Data model (8 artifact types)
│   │
│   ├── services/
│   │   └── logsService.ts            # 🔧 Business logic (10 methods)
│   │
│   ├── controllers/
│   │   └── logsController.ts         # 🎮 Request handlers (11 endpoints)
│   │
│   ├── routes/
│   │   └── logs.ts                   # 🛣️ API routes
│   │
│   ├── validators/
│   │   └── logValidator.ts           # ✅ Validation schemas (6 validators)
│   │
│   ├── middleware/
│   │   ├── validateRequest.ts        # 🛡️ Request validation
│   │   └── errorHandler.ts           # ⚠️ Error handling
│   │
│   ├── config/
│   │   └── db.ts                     # 🗄️ MongoDB connection
│   │
│   ├── types/
│   │   └── index.ts                  # 📝 TypeScript types
│   │
│   ├── app.ts                        # 🚀 Express setup
│   └── server.ts                     # 🌐 Server entry point
│
├── tests/
│   └── logs/
│       └── logsService.test.ts       # 🧪 Service tests
│
├── 📚 Documentation/
│   ├── API_DOCUMENTATION.md          # Complete API reference
│   ├── README_NEW.md                 # Project overview
│   ├── QUICK_START.md                # 5-minute guide
│   └── IMPLEMENTATION_SUMMARY.md     # This summary
│
├── 🔧 Configuration/
│   ├── package.json                  # Dependencies
│   ├── tsconfig.json                 # TypeScript config
│   ├── .env.example                  # Env template
│   └── postman_collection.json       # API testing
│
└── Dockerfile                        # Container config
```

## Processing Status State Machine

```
┌─────────────┐
│   PENDING   │ ← Initial state when log is uploaded
└──────┬──────┘
       │
       │ AI Agent picks up log
       │
       ▼
┌──────────────┐
│  PROCESSING  │ ← Agent is analyzing the log
└──────┬───────┘
       │
       ├──────────┐
       │          │
       │ Success  │ Error occurred
       │          │
       ▼          ▼
┌──────────┐  ┌────────┐
│COMPLETED │  │ FAILED │
└──────────┘  └────────┘

States:
• PENDING     - Uploaded, waiting for AI processing
• PROCESSING  - Currently being analyzed by AI agent
• COMPLETED   - Analysis finished successfully
• FAILED      - Processing error (with error message)

Transitions managed via:
PUT /api/logs/:id/status
```

---

## Legend

- 📊 Data Models
- 🔧 Services  
- 🎮 Controllers
- 🛣️ Routes
- ✅ Validators
- 🛡️ Middleware
- 🗄️ Database
- 📝 Types
- 🚀 App
- 🌐 Server
- 🧪 Tests
- 📚 Docs
