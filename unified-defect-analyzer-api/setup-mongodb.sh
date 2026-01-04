#!/bin/bash

# 🗄️ MongoDB Setup & Seeding Script
# This script helps set up MongoDB and seed it with test data
# Reads MONGODB_URI from .env file

set -e

# Load environment variables from .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/unified-defect-analyzer}"

echo "═══════════════════════════════════════════════════════════"
echo "📊 MongoDB Setup & Data Seeding"
echo "═══════════════════════════════════════════════════════════"
echo "Connection: $MONGODB_URI"
echo ""

# Check if MongoDB is running
check_mongodb() {
    if ! command -v mongosh &> /dev/null; then
        echo "⚠️  MongoDB Shell (mongosh) not installed"
        return 1
    fi
    
    if mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')" &>/dev/null; then
        echo "✅ MongoDB is accessible at: $MONGODB_URI"
        return 0
    else
        echo "❌ Cannot connect to MongoDB at: $MONGODB_URI"
        return 1
    fi
}

# Start MongoDB with Homebrew
start_mongodb_brew() {
    echo "🔧 Starting MongoDB with Homebrew..."
    if brew services start mongodb-community 2>/dev/null; then
        sleep 2
        echo "✅ MongoDB started"
        return 0
    else
        echo "⚠️  Homebrew MongoDB not available"
        return 1
    fi
}

# Start MongoDB with Docker
start_mongodb_docker() {
    echo "🐳 Starting MongoDB with Docker..."
    if docker run -d --name mongo-test -p 27017:27017 mongo:7.0 2>/dev/null; then
        sleep 3
        echo "✅ MongoDB started in Docker"
        return 0
    else
        echo "⚠️  Docker not available"
        return 1
    fi
}

# Install MongoDB locally (macOS)
install_mongodb_mac() {
    echo "📦 Installing MongoDB via Homebrew..."
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew not found. Please install MongoDB manually."
        return 1
    fi
    
    brew tap mongodb/brew
    brew install mongodb-community
    echo "✅ MongoDB installed"
    return 0
}

# Create sample data using mongosh
seed_data() {
    echo ""
    echo "📝 Seeding sample data..."
    echo ""
    
    # Create logs collection with sample data
    mongosh "$MONGODB_URI" <<'MONGO_SCRIPT'

// Clear existing collections
db.logs.deleteMany({});
db.defectsData.deleteMany({});
db.testResults.deleteMany({});

// Insert sample logs
const sampleLogs = [
  {
    teamId: "qa-team",
    level: "error",
    message: "Login button not responding on mobile",
    artifactType: "ui_log",
    artifactData: {
      url: "https://example.com/login",
      error: "Button click not triggered",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)"
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
print(`✅ Inserted ${logResult.insertedIds.length} logs`);

// Insert historic defects
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
    titleEmbedding: Array(384).fill(0.5),
    descriptionEmbedding: Array(384).fill(0.5),
    rootCauseEmbedding: Array(384).fill(0.5),
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
    titleEmbedding: Array(384).fill(0.5),
    descriptionEmbedding: Array(384).fill(0.5),
    rootCauseEmbedding: Array(384).fill(0.5),
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
    titleEmbedding: Array(384).fill(0.5),
    descriptionEmbedding: Array(384).fill(0.5),
    rootCauseEmbedding: Array(384).fill(0.5),
    environment: "production",
    status: "resolved",
    resolutionDate: new Date("2024-03-18"),
    jiraTicket: "JIRA-3456",
    tags: ["database", "performance", "batch-processing"],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const defectResult = db.defectsData.insertMany(historicDefects);
print(`✅ Inserted ${defectResult.insertedIds.length} historic defects`);

// Insert test executions
const testExecutions = [
  {
    teamId: "qa-team",
    executionId: "TEST-001",
    testName: "test_login_with_valid_credentials",
    testSuite: "Authentication",
    testFile: "tests/auth.test.ts",
    status: "failed",
    duration: 3500,
    timestamp: new Date(),
    failureMessage: "Timeout waiting for login button response",
    failureReason: "Button click not triggering login process",
    environment: "staging",
    browser: "Chrome",
    platform: "macOS",
    consecutiveFailures: 3,
    totalExecutions: 50,
    passRate: 94,
    flakinessScore: 35,
    testNameEmbedding: Array(384).fill(0.5),
    failureMessageEmbedding: Array(384).fill(0.5),
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
    status: "failed",
    duration: 5200,
    timestamp: new Date(),
    failureMessage: "500 Internal Server Error from /api/users endpoint",
    failureReason: "Cache miss in validation middleware",
    environment: "staging",
    platform: "Linux",
    consecutiveFailures: 2,
    totalExecutions: 120,
    passRate: 98.3,
    flakinessScore: 22,
    testNameEmbedding: Array(384).fill(0.5),
    failureMessageEmbedding: Array(384).fill(0.5),
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
    status: "failed",
    duration: 8500,
    timestamp: new Date(),
    failureMessage: "Database connection timeout after 30 seconds",
    failureReason: "Connection pool exhaustion during peak load",
    environment: "staging",
    platform: "Linux",
    consecutiveFailures: 1,
    totalExecutions: 30,
    passRate: 96.7,
    flakinessScore: 45,
    testNameEmbedding: Array(384).fill(0.5),
    failureMessageEmbedding: Array(384).fill(0.5),
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
  }
];

const testResult = db.testResults.insertMany(testExecutions);
print(`✅ Inserted ${testResult.insertedIds.length} test executions`);

// Create indexes
db.logs.createIndex({ teamId: 1, createdAt: -1 });
db.logs.createIndex({ processingStatus: 1 });
db.logs.createIndex({ message: "text" });

db.defectsData.createIndex({ teamId: 1, status: 1 });
db.defectsData.createIndex({ defectType: 1, severity: 1 });
db.defectsData.createIndex({ lastOccurred: -1 });

db.testResults.createIndex({ teamId: 1, timestamp: -1 });
db.testResults.createIndex({ flakinessScore: -1 });
db.testResults.createIndex({ testName: 1, status: 1 });

print("✅ Created database indexes");

// Summary
const logCount = db.logs.countDocuments();
const defectCount = db.defectsData.countDocuments();
const testCount = db.testResults.countDocuments();

print("\n════════════════════════════════════");
print("📊 Database Seeding Complete");
print("════════════════════════════════════");
print(`Total Logs: ${logCount}`);
print(`Historic Defects: ${defectCount}`);
print(`Test Executions: ${testCount}`);
print("════════════════════════════════════\n");

MONGO_SCRIPT
}

# Main execution
main() {
    echo "Checking MongoDB status..."
    echo ""
    
    if ! check_mongodb; then
        echo ""
        echo "📌 MongoDB is not running. Attempting to start..."
        echo ""
        
        # Try Homebrew first
        if ! start_mongodb_brew; then
            # Try Docker
            if ! start_mongodb_docker; then
                # Try installing
                echo ""
                echo "❓ MongoDB needs to be installed or running."
                echo ""
                echo "Options:"
                echo "1. Install MongoDB locally:"
                echo "   brew tap mongodb/brew && brew install mongodb-community"
                echo "   brew services start mongodb-community"
                echo ""
                echo "2. Run MongoDB in Docker:"
                echo "   docker run -d -p 27017:27017 mongo:7.0"
                echo ""
                echo "3. Use MongoDB Atlas (cloud):"
                echo "   Set MONGODB_URI environment variable to your Atlas connection string"
                echo ""
                exit 1
            fi
        fi
    fi
    
    echo ""
    
    # Verify MongoDB is responsive
    sleep 2
    if ! mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')" &>/dev/null; then
        echo "❌ MongoDB is running but not responding"
        exit 1
    fi
    
    # Seed the data
    seed_data
    
    echo "✅ Setup complete!"
    echo ""
    echo "📊 MongoDB Collections Created:"
    echo "  • logs (8 sample log entries)"
    echo "  • historic_defects (3 known defect patterns)"
    echo "  • test_executions (3 test execution records)"
    echo ""
    echo "🧪 You can now run:"
    echo "  npm run dev"
    echo ""
}

main
