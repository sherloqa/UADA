#!/bin/bash

# 🗄️ Direct MongoDB Seeding - No Prerequisites
# Use this if MongoDB is already running
# Reads MONGODB_URI from .env file

# Load environment variables from .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/unified-defect-analyzer}"

echo "════════════════════════════════════════════════════════════"
echo "📊 Seeding MongoDB with Sample Data"
echo "════════════════════════════════════════════════════════════"
echo "Connection: $MONGODB_URI"
echo ""

mongosh "$MONGODB_URI" << 'MONGO_SCRIPT'

// 1. Clear existing data
console.log("🧹 Clearing existing collections...");
db.logs.deleteMany({});
db.historic_defects.deleteMany({});
db.test_executions.deleteMany({});

// 2. Create sample logs
console.log("📝 Creating sample logs...");
const sampleLogs = [
  {
    teamId: "qa-team",
    level: "error",
    message: "Login button not responding on mobile",
    artifactType: "ui_log",
    artifactData: {
      url: "https://example.com/login",
      error: "Button click not triggered",
      userAgent: "Mozilla/5.0 (iPhone)"
    },
    processingStatus: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    teamId: "api-team",
    level: "error",
    message: "500 Internal Server Error on /api/users",
    artifactType: "api_response",
    artifactData: {
      endpoint: "/api/users",
      method: "GET",
      statusCode: 500,
      errorMessage: "Unhandled exception in validation middleware"
    },
    processingStatus: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    teamId: "backend-team",
    level: "error",
    message: "Database connection timeout",
    artifactType: "backend_log",
    artifactData: {
      error: "Connection pool exhausted",
      poolSize: 10,
      activeConnections: 12
    },
    processingStatus: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    teamId: "qa-team",
    level: "error",
    message: "Network timeout on slow 3G connection",
    artifactType: "ui_log",
    artifactData: {
      networkType: "3g",
      timeout: 5000,
      actualTime: 12000
    },
    processingStatus: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    teamId: "api-team",
    level: "error",
    message: "Memory leak detected in WebSocket handler",
    artifactType: "backend_log",
    artifactData: {
      memoryUsage: "1.2GB",
      threshold: "500MB",
      component: "WebSocket"
    },
    processingStatus: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    teamId: "qa-team",
    level: "warn",
    message: "Flaky test: test_login_with_valid_credentials",
    artifactType: "backend_log",
    artifactData: {
      testName: "test_login_with_valid_credentials",
      failureRate: "5/10",
      consecutive: 3
    },
    processingStatus: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    teamId: "api-team",
    level: "error",
    message: "API rate limit exceeded",
    artifactType: "api_response",
    artifactData: {
      endpoint: "/api/search",
      rateLimit: 100,
      requests: 150
    },
    processingStatus: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    teamId: "backend-team",
    level: "error",
    message: "Batch job timeout after 30 seconds",
    artifactType: "backend_log",
    artifactData: {
      jobName: "data_sync",
      timeout: 30000,
      processed: 5000,
      remaining: 95000
    },
    processingStatus: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const logResult = db.logs.insertMany(sampleLogs);
console.log(`✅ Inserted ${logResult.insertedIds.length} logs`);

// 3. Create historic defects with embeddings
console.log("📚 Creating historic defects...");
const historicDefects = [
  {
    teamId: "qa-team",
    defectId: "DEF-001",
    title: "Login Button Not Responding on Mobile",
    description: "The login button becomes unresponsive on iOS Safari when session expires",
    rootCause: "Race condition in session management causing stale DOM references",
    resolution: "Updated event listener binding order and added session refresh check",
    defectType: "ui_bug",
    severity: "high",
    component: "Authentication",
    firstDiscovered: new Date("2024-01-15"),
    lastOccurred: new Date("2024-03-20"),
    occurrenceCount: 23,
    affectedVersions: ["1.2.0", "1.2.1", "1.3.0"],
    titleEmbedding: Array(384).fill(Math.random()),
    descriptionEmbedding: Array(384).fill(Math.random()),
    rootCauseEmbedding: Array(384).fill(Math.random()),
    environment: "production",
    status: "resolved",
    resolutionDate: new Date("2024-03-22"),
    jiraTicket: "JIRA-1234",
    tags: ["mobile", "authentication", "race-condition"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    teamId: "api-team",
    defectId: "DEF-002",
    title: "500 Internal Server Error on /api/users Endpoint",
    description: "Intermittent 500 errors on the /api/users GET endpoint during high load",
    rootCause: "Unhandled exception in user validation middleware when cache misses occur",
    resolution: "Added try-catch wrapping and implemented fallback cache strategy",
    defectType: "api_error",
    severity: "critical",
    component: "User Service",
    firstDiscovered: new Date("2024-02-01"),
    lastOccurred: new Date("2024-03-10"),
    occurrenceCount: 45,
    affectedVersions: ["2.0.0", "2.0.1"],
    titleEmbedding: Array(384).fill(Math.random()),
    descriptionEmbedding: Array(384).fill(Math.random()),
    rootCauseEmbedding: Array(384).fill(Math.random()),
    environment: "production",
    status: "resolved",
    resolutionDate: new Date("2024-03-12"),
    jiraTicket: "JIRA-2345",
    tags: ["api", "performance", "cache"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    teamId: "backend-team",
    defectId: "DEF-003",
    title: "Database Connection Timeout in Batch Jobs",
    description: "Batch processing jobs timeout when database connection pool is exhausted",
    rootCause: "Insufficient connection pool size for concurrent batch operations",
    resolution: "Increased pool size from 10 to 30 and implemented queue management",
    defectType: "backend_error",
    severity: "high",
    component: "Database Layer",
    firstDiscovered: new Date("2024-01-20"),
    lastOccurred: new Date("2024-03-15"),
    occurrenceCount: 34,
    affectedVersions: ["3.1.0", "3.1.1", "3.2.0"],
    titleEmbedding: Array(384).fill(Math.random()),
    descriptionEmbedding: Array(384).fill(Math.random()),
    rootCauseEmbedding: Array(384).fill(Math.random()),
    environment: "production",
    status: "resolved",
    resolutionDate: new Date("2024-03-18"),
    jiraTicket: "JIRA-3456",
    tags: ["database", "performance", "batch-processing"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    teamId: "qa-team",
    defectId: "DEF-004",
    title: "Timeout Error During Heavy Network Load",
    description: "API requests timeout when network bandwidth is limited",
    rootCause: "Hardcoded timeout value of 5 seconds too short for 3G networks",
    resolution: "Implemented dynamic timeout based on network condition detection",
    defectType: "network_error",
    severity: "medium",
    component: "Network Layer",
    firstDiscovered: new Date("2024-02-10"),
    lastOccurred: new Date("2024-03-25"),
    occurrenceCount: 56,
    affectedVersions: ["1.4.0", "1.5.0"],
    titleEmbedding: Array(384).fill(Math.random()),
    descriptionEmbedding: Array(384).fill(Math.random()),
    rootCauseEmbedding: Array(384).fill(Math.random()),
    environment: "production",
    status: "active",
    tags: ["network", "timeout", "mobile"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    teamId: "api-team",
    defectId: "DEF-005",
    title: "Memory Leak in WebSocket Handler",
    description: "Memory usage grows unbounded in long-running WebSocket connections",
    rootCause: "Event listeners not properly cleaned up on connection close",
    resolution: "Added explicit cleanup in WebSocket close handler and added memory monitoring",
    defectType: "backend_error",
    severity: "critical",
    component: "WebSocket Service",
    firstDiscovered: new Date("2024-03-01"),
    lastOccurred: new Date("2024-03-24"),
    occurrenceCount: 12,
    affectedVersions: ["2.1.0"],
    titleEmbedding: Array(384).fill(Math.random()),
    descriptionEmbedding: Array(384).fill(Math.random()),
    rootCauseEmbedding: Array(384).fill(Math.random()),
    status: "active",
    tags: ["memory-leak", "websocket", "critical"],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const defectResult = db.historic_defects.insertMany(historicDefects);
console.log(`✅ Inserted ${defectResult.insertedIds.length} historic defects`);

// 4. Create test executions with embeddings
console.log("🧪 Creating test executions...");
const testExecutions = [
  {
    teamId: "qa-team",
    executionId: "TEST-001",
    testName: "test_login_with_valid_credentials",
    testSuite: "Authentication",
    testFile: "tests/auth.test.ts",
    description: "Validates successful login with correct email and password",
    status: "failed",
    duration: 3500,
    timestamp: new Date(),
    failureMessage: "Timeout waiting for login button response",
    failureReason: "Button click not triggering login process",
    environment: "staging",
    browser: "Chrome",
    platform: "macOS",
    buildNumber: "build-1234",
    consecutiveFailures: 3,
    totalExecutions: 50,
    passRate: 94,
    flakinessScore: 35,
    testNameEmbedding: Array(384).fill(Math.random()),
    failureMessageEmbedding: Array(384).fill(Math.random()),
    defectType: "ui_bug",
    flakiness: {
      isFlaky: true,
      flakySince: new Date("2024-03-10"),
      possibleCauses: ["Network latency", "DOM synchronization issue"]
    },
    relatedHistoricDefectIds: ["DEF-001"],
    jiraTicket: "JIRA-1234",
    tags: ["authentication", "flaky", "ui"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    teamId: "api-team",
    executionId: "TEST-002",
    testName: "test_get_users_with_pagination",
    testSuite: "User API",
    testFile: "tests/api/users.test.ts",
    description: "Tests paginated retrieval of users from API",
    status: "failed",
    duration: 5200,
    timestamp: new Date(),
    failureMessage: "500 Internal Server Error from /api/users endpoint",
    failureReason: "Cache miss in validation middleware",
    environment: "staging",
    browser: "API Client",
    platform: "Linux",
    buildNumber: "build-5678",
    consecutiveFailures: 2,
    totalExecutions: 120,
    passRate: 98.3,
    flakinessScore: 22,
    testNameEmbedding: Array(384).fill(Math.random()),
    failureMessageEmbedding: Array(384).fill(Math.random()),
    defectType: "api_error",
    flakiness: {
      isFlaky: true,
      flakySince: new Date("2024-02-28"),
      possibleCauses: ["Cache misconfiguration", "Timing issue"]
    },
    relatedHistoricDefectIds: ["DEF-002"],
    jiraTicket: "JIRA-2345",
    tags: ["api", "users", "pagination"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    teamId: "backend-team",
    executionId: "TEST-003",
    testName: "test_batch_job_completion",
    testSuite: "Batch Processing",
    testFile: "tests/batch.test.ts",
    description: "Tests successful completion of batch processing job",
    status: "failed",
    duration: 8500,
    timestamp: new Date(),
    failureMessage: "Database connection timeout after 30 seconds",
    failureReason: "Connection pool exhaustion during peak load",
    environment: "staging",
    browser: "N/A",
    platform: "Linux",
    buildNumber: "build-9012",
    consecutiveFailures: 1,
    totalExecutions: 30,
    passRate: 96.7,
    flakinessScore: 45,
    testNameEmbedding: Array(384).fill(Math.random()),
    failureMessageEmbedding: Array(384).fill(Math.random()),
    defectType: "backend_error",
    flakiness: {
      isFlaky: true,
      flakySince: new Date("2024-03-01"),
      possibleCauses: ["Connection pool size", "Load timing"]
    },
    relatedHistoricDefectIds: ["DEF-003"],
    jiraTicket: "JIRA-3456",
    tags: ["batch", "database", "backend"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    teamId: "qa-team",
    executionId: "TEST-004",
    testName: "test_network_resilience",
    testSuite: "Network",
    testFile: "tests/network.test.ts",
    description: "Tests API resilience on slow networks",
    status: "flaky",
    duration: 12000,
    timestamp: new Date(),
    failureMessage: "Request timeout on 3G network simulation",
    failureReason: "Fixed timeout too short for slow networks",
    environment: "staging",
    browser: "Mobile Simulator",
    platform: "iOS",
    buildNumber: "build-3456",
    consecutiveFailures: 5,
    totalExecutions: 40,
    passRate: 87.5,
    flakinessScore: 72,
    testNameEmbedding: Array(384).fill(Math.random()),
    failureMessageEmbedding: Array(384).fill(Math.random()),
    defectType: "network_error",
    flakiness: {
      isFlaky: true,
      flakySince: new Date("2024-02-10"),
      possibleCauses: ["Fixed timeout value", "Network simulation variance"]
    },
    relatedHistoricDefectIds: ["DEF-004"],
    tags: ["network", "mobile", "timeout"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    teamId: "api-team",
    executionId: "TEST-005",
    testName: "test_websocket_long_connection",
    testSuite: "WebSocket",
    testFile: "tests/websocket.test.ts",
    description: "Tests WebSocket connection stability over long duration",
    status: "failed",
    duration: 45000,
    timestamp: new Date(),
    failureMessage: "Memory usage exceeded threshold after 40 seconds",
    failureReason: "Event listener accumulation in WebSocket handler",
    environment: "staging",
    browser: "Node.js",
    platform: "Linux",
    buildNumber: "build-7890",
    consecutiveFailures: 8,
    totalExecutions: 25,
    passRate: 68,
    flakinessScore: 92,
    testNameEmbedding: Array(384).fill(Math.random()),
    failureMessageEmbedding: Array(384).fill(Math.random()),
    defectType: "backend_error",
    flakiness: {
      isFlaky: true,
      flakySince: new Date("2024-03-01"),
      possibleCauses: ["Memory leak in handler", "Event listener cleanup"]
    },
    relatedHistoricDefectIds: ["DEF-005"],
    jiraTicket: "JIRA-5678",
    tags: ["websocket", "memory", "critical"],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const testResult = db.test_executions.insertMany(testExecutions);
console.log(`✅ Inserted ${testResult.insertedIds.length} test executions`);

// 5. Create indexes for optimal query performance
console.log("📑 Creating database indexes...");

// Logs collection indexes
db.logs.createIndex({ teamId: 1, createdAt: -1 });
db.logs.createIndex({ processingStatus: 1 });
db.logs.createIndex({ message: "text", artifactType: 1 });
db.logs.createIndex({ teamId: 1, artifactType: 1 });

// Historic defects collection indexes
db.historic_defects.createIndex({ teamId: 1, status: 1 });
db.historic_defects.createIndex({ defectType: 1, severity: 1 });
db.historic_defects.createIndex({ lastOccurred: -1 });
db.historic_defects.createIndex({ occurrenceCount: -1 });

// Test executions collection indexes
db.test_executions.createIndex({ teamId: 1, timestamp: -1 });
db.test_executions.createIndex({ flakinessScore: -1 });
db.test_executions.createIndex({ testName: 1, status: 1 });
db.test_executions.createIndex({ status: 1, flakinessScore: -1 });

console.log("✅ Created database indexes");

// 6. Display summary
console.log("\n════════════════════════════════════════════════");
console.log("📊 MongoDB Seeding Complete!");
console.log("════════════════════════════════════════════════");

const logCount = db.logs.countDocuments();
const defectCount = db.historic_defects.countDocuments();
const testCount = db.test_executions.countDocuments();

console.log(`\n✅ Sample Logs: ${logCount}`);
console.log(`✅ Historic Defects: ${defectCount}`);
console.log(`✅ Test Executions: ${testCount}`);

console.log("\n📁 Collections:");
console.log("  • logs");
console.log("  • historic_defects");
console.log("  • test_executions");

console.log("\n🧪 Ready for testing!");
console.log("════════════════════════════════════════════════\n");

MONGO_SCRIPT

echo ""
echo "✅ MongoDB seeding complete!"
echo ""
echo "📊 Collections created:"
echo "  • logs (8 sample entries)"
echo "  • historic_defects (5 known defect patterns)"
echo "  • test_executions (5 test execution records)"
echo ""
echo "Verify with:"
echo "  mongosh unified-defect-analyzer"
echo "  db.logs.countDocuments()"
echo ""
