#!/bin/bash

# 🗄️ Enhanced MongoDB Seeding - 100+ Records
# Seeds MongoDB with comprehensive defect and test execution data
# Reads MONGODB_URI from .env file

# Load environment variables from .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

if [ -z "$MONGODB_URI" ]; then
    echo "❌ ERROR: MONGODB_URI environment variable is not set"
    echo "Please set MONGODB_URI in your .env file"
    exit 1
fi

echo "════════════════════════════════════════════════════════════"
echo "📊 Seeding MongoDB with 100+ Sample Defects & Tests"
echo "════════════════════════════════════════════════════════════"
echo "Connection: $MONGODB_URI"
echo ""

mongosh "$MONGODB_URI" << 'MONGO_SCRIPT'

// 1. Clear existing data
console.log("🧹 Clearing existing collections...");
db.logs.deleteMany({});
db.defectsData.deleteMany({});
db.testResults.deleteMany({});

// 2. Create sample logs (8 records)
console.log("📝 Creating sample logs (8)...");
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
      errorMessage: "Unhandled exception"
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
      poolSize: 10
    },
    processingStatus: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    teamId: "qa-team",
    level: "error",
    message: "Network timeout on 3G connection",
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
    message: "Memory leak in WebSocket",
    artifactType: "backend_log",
    artifactData: {
      component: "WebSocket",
      memoryUsage: "1.2GB"
    },
    processingStatus: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    teamId: "qa-team",
    level: "warn",
    message: "Flaky test detected",
    artifactType: "backend_log",
    artifactData: {
      testName: "test_login",
      failureRate: "5/10"
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
    message: "Batch job timeout",
    artifactType: "backend_log",
    artifactData: {
      jobName: "data_sync",
      timeout: 30000
    },
    processingStatus: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const logResult = db.logs.insertMany(sampleLogs);
console.log(`✅ Inserted ${logResult.insertedIds.length} logs`);

// 3. Create 100+ historic defects with embeddings
console.log("📚 Creating 100+ historic defects...");

const defectTypes = ["ui_bug", "api_error", "backend_error", "network_error", "performance", "flaky_test", "data_issue", "security_issue"];
const components = ["Authentication", "User Service", "Database Layer", "WebSocket Service", "Cache Layer", "API Gateway", "Search", "Payment", "Notification", "Admin Panel", "Mobile App", "Desktop App", "iOS", "Android"];
const severities = ["low", "medium", "high", "critical"];
const teams = ["qa-team", "api-team", "backend-team", "frontend-team", "devops-team"];
const statuses = ["active", "resolved", "obsolete"];

const generateEmbedding = () => {
  const arr = [];
  for (let i = 0; i < 384; i++) {
    arr.push(Math.random());
  }
  return arr;
};

const historicDefects = [];
for (let i = 1; i <= 105; i++) {
  const defectType = defectTypes[Math.floor(Math.random() * defectTypes.length)];
  const component = components[Math.floor(Math.random() * components.length)];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const team = teams[Math.floor(Math.random() * teams.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  historicDefects.push({
    teamId: team,
    defectId: `DEF-${String(i).padStart(3, '0')}`,
    title: `${defectType.toUpperCase()} in ${component} - Issue #${i}`,
    description: `Detailed description of ${defectType} found in ${component} component. This defect was identified during testing and reported on various platforms.`,
    rootCause: `Root cause analysis for defect #${i}: Investigation revealed ${['race condition', 'memory leak', 'improper error handling', 'missing validation', 'timeout misconfiguration', 'cache invalidation issue', 'concurrency problem'][Math.floor(Math.random() * 7)]}.`,
    resolution: `Applied fix: ${['refactored code logic', 'added synchronization', 'implemented caching', 'increased timeout', 'added retry logic', 'improved error handling', 'optimized query'][Math.floor(Math.random() * 7)]}.`,
    defectType: defectType,
    severity: severity,
    component: component,
    firstDiscovered: new Date(2024, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
    lastOccurred: new Date(2026, 0, Math.floor(Math.random() * 4) + 1),
    occurrenceCount: Math.floor(Math.random() * 100) + 1,
    affectedVersions: [`${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.0`],
    titleEmbedding: generateEmbedding(),
    descriptionEmbedding: generateEmbedding(),
    rootCauseEmbedding: generateEmbedding(),
    environment: ['dev', 'staging', 'production'][Math.floor(Math.random() * 3)],
    status: status,
    resolutionDate: status === 'active' ? null : new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    jiraTicket: `JIRA-${1000 + i}`,
    tags: [defectType, component.toLowerCase().replace(' ', '-'), severity],
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

const defectResult = db.defectsData.insertMany(historicDefects);
console.log(`✅ Inserted ${defectResult.insertedIds.length} historic defects`);

// 4. Create 100+ test executions with embeddings
console.log("🧪 Creating 100+ test executions...");

const testSuites = ["Authentication", "User API", "Batch Processing", "Payment", "Search", "Notifications", "Admin", "Mobile UI", "Performance", "Security"];
const testStatuses = ["passed", "failed", "skipped", "flaky"];
const browsers = ["Chrome", "Firefox", "Safari", "Edge", "API Client"];
const platforms = ["Windows", "macOS", "Linux", "iOS", "Android"];

const testExecutions = [];
for (let i = 1; i <= 105; i++) {
  const testStatus = testStatuses[Math.floor(Math.random() * testStatuses.length)];
  const testSuite = testSuites[Math.floor(Math.random() * testSuites.length)];
  const browser = browsers[Math.floor(Math.random() * browsers.length)];
  const platform = platforms[Math.floor(Math.random() * platforms.length)];
  const passCount = Math.floor(Math.random() * 200) + 1;
  const passRate = Math.floor((passCount / (passCount + Math.floor(Math.random() * 50))) * 100);
  const flakinessScore = testStatus === 'flaky' ? Math.floor(Math.random() * 100) : 0;
  
  testExecutions.push({
    teamId: teams[Math.floor(Math.random() * teams.length)],
    executionId: `TEST-${String(i).padStart(3, '0')}`,
    testName: `test_${testSuite.toLowerCase().replace(/ /g, '_')}_${i}`,
    testSuite: testSuite,
    testFile: `tests/${testSuite.toLowerCase().replace(/ /g, '_')}.test.ts`,
    description: `Test case #${i} for ${testSuite} functionality`,
    status: testStatus,
    duration: Math.floor(Math.random() * 10000) + 1000,
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    failureMessage: testStatus === 'failed' ? `Test assertion failed: Expected value to match` : null,
    failureReason: testStatus === 'failed' ? `${['assertion failure', 'timeout', 'exception', 'memory error', 'network issue'][Math.floor(Math.random() * 5)]}` : null,
    environment: ['dev', 'staging', 'production'][Math.floor(Math.random() * 3)],
    browser: browser,
    platform: platform,
    buildNumber: `build-${5000 + i}`,
    consecutiveFailures: testStatus === 'failed' ? Math.floor(Math.random() * 10) + 1 : 0,
    totalExecutions: passCount + Math.floor(Math.random() * 50),
    passRate: passRate,
    flakinessScore: flakinessScore,
    testNameEmbedding: generateEmbedding(),
    failureMessageEmbedding: testStatus === 'failed' ? generateEmbedding() : null,
    defectType: testStatus === 'failed' ? defectTypes[Math.floor(Math.random() * defectTypes.length)] : null,
    flakiness: {
      isFlaky: testStatus === 'flaky' || flakinessScore > 30,
      flakySince: testStatus === 'flaky' ? new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1) : null,
      possibleCauses: [['Network latency', 'DOM synchronization'], ['Timing issue', 'Race condition'], ['Cache inconsistency', 'External service'], ['Resource contention', 'Test isolation']][Math.floor(Math.random() * 4)]
    },
    relatedHistoricDefectIds: [`DEF-${String(Math.floor(Math.random() * 105) + 1).padStart(3, '0')}`],
    jiraTicket: `JIRA-${2000 + i}`,
    tags: [testStatus, testSuite.toLowerCase().replace(/ /g, '-')],
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

const testResult = db.testResults.insertMany(testExecutions);
console.log(`✅ Inserted ${testResult.insertedIds.length} test executions`);

// 5. Create indexes for better query performance
console.log("🔍 Creating database indexes...");

// Logs indexes
db.logs.createIndex({ teamId: 1, createdAt: -1 });
db.logs.createIndex({ processingStatus: 1 });
db.logs.createIndex({ message: "text" });

// DefectsData indexes
db.defectsData.createIndex({ teamId: 1, status: 1 });
db.defectsData.createIndex({ defectType: 1, severity: 1 });
db.defectsData.createIndex({ lastOccurred: -1 });
db.defectsData.createIndex({ component: 1 });
db.defectsData.createIndex({ environment: 1 });

// TestResults indexes
db.testResults.createIndex({ teamId: 1, timestamp: -1 });
db.testResults.createIndex({ flakinessScore: -1 });
db.testResults.createIndex({ testName: 1, status: 1 });
db.testResults.createIndex({ status: 1 });
db.testResults.createIndex({ environment: 1 });

console.log("✅ Created performance indexes");

// 6. Summary
const logCount = db.logs.countDocuments();
const defectCount = db.defectsData.countDocuments();
const testCount = db.testResults.countDocuments();

console.log("\n════════════════════════════════════════════════════════════");
console.log("📊 Database Seeding Complete");
console.log("════════════════════════════════════════════════════════════");
console.log(`✅ Total Logs: ${logCount}`);
console.log(`✅ Historic Defects: ${defectCount}`);
console.log(`✅ Test Executions: ${testCount}`);
console.log(`✅ Total Records: ${logCount + defectCount + testCount}`);
console.log("════════════════════════════════════════════════════════════\n");

MONGO_SCRIPT

if [ $? -eq 0 ]; then
    echo "✅ MongoDB seeding completed successfully!"
    echo ""
    echo "📊 Sample Data Summary:"
    echo "  • Logs: 8 records"
    echo "  • Historic Defects: 105 records"
    echo "  • Test Executions: 105 records"
    echo "  • Total: 218 records"
    echo ""
    echo "🎯 Collections:"
    echo "  • logs"
    echo "  • defectsData"
    echo "  • testResults"
    echo ""
    echo "🧪 Ready for testing!"
else
    echo "❌ MongoDB seeding failed!"
    exit 1
fi
