import mongoose from 'mongoose';
import Log from '../models/Log';
import { ragService } from '../services/ragService';
import { logInfo, logError } from '../utils/logger';

/**
 * MongoDB Seeding Script
 * 
 * Populates MongoDB with sample test logs and embeddings
 * for testing the Phase 2 AI Agent Service
 * 
 * Usage: npx ts-node src/seed/seedDatabase.ts
 */

// Sample test data with various artifact types
const sampleLogs = [
  // UI Bug - Missing Element
  {
    teamId: 'qa-team',
    testRunId: 'run-001',
    failureId: 'fail-001',
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    level: 'error',
    message: 'Submit button not visible on login page',
    artifactType: 'ui_log',
    artifactData: {
      screenshot: 'base64_encoded_image_data_here',
      domSnapshot: '<html><body><form><input type="text" id="username"></input></form></body></html>',
      consoleErrors: ['TypeError: Cannot read property click of null'],
    },
    context: {
      testName: 'User Login Flow',
      testSuite: 'Authentication',
      environment: 'staging',
      browser: 'Chrome 120',
      platform: 'Windows 11',
      buildNumber: '1.0.0',
      commitHash: 'abc123def456',
    },
    metadata: {
      duration: 5000,
      retryCount: 2,
    },
    processingStatus: 'pending',
  },

  // API Error - 500
  {
    teamId: 'api-team',
    testRunId: 'run-002',
    failureId: 'fail-002',
    timestamp: new Date(Date.now() - 86400000 * 2),
    level: 'error',
    message: 'Payment API returned 500 Internal Server Error',
    artifactType: 'har',
    artifactData: {
      log: {
        version: '1.2',
        entries: [
          {
            request: {
              method: 'POST',
              url: 'https://api.example.com/payment/process',
              headers: [{ name: 'Content-Type', value: 'application/json' }],
            },
            response: {
              status: 500,
              statusText: 'Internal Server Error',
              headers: [],
            },
            time: 2500,
          },
        ],
      },
    },
    context: {
      testName: 'Payment Processing',
      environment: 'production',
      browser: 'Chrome',
    },
    processingStatus: 'pending',
  },

  // Backend Error - Stack Trace
  {
    teamId: 'backend-team',
    testRunId: 'run-003',
    failureId: 'fail-003',
    timestamp: new Date(Date.now() - 86400000 * 3),
    level: 'critical',
    message: 'Database connection timeout',
    artifactType: 'backend_log',
    artifactData: {
      stackTrace: `Error: Connection timeout
        at Database.connect (/app/src/db.ts:42:15)
        at Server.initialize (/app/src/server.ts:15:8)
        at Object.<anonymous> (/app/src/index.ts:5:1)`,
      errorMessage: 'Error: Connection timeout',
      errorType: 'TimeoutError',
      timestamp: '2026-01-03T10:30:00.000Z',
    },
    context: {
      testName: 'Database Connection Test',
      environment: 'production',
    },
    processingStatus: 'pending',
  },

  // UI Log - Console Errors
  {
    teamId: 'qa-team',
    testRunId: 'run-004',
    failureId: 'fail-004',
    timestamp: new Date(Date.now() - 86400000 * 0.5),
    level: 'error',
    message: 'Uncaught TypeError in checkout form',
    artifactType: 'ui_log',
    artifactData: {
      consoleErrors: [
        'TypeError: Cannot read property "value" of undefined',
        'ReferenceError: validateForm is not defined',
      ],
      screenshot: 'base64_image',
    },
    context: {
      testName: 'Checkout Flow',
      testSuite: 'E-Commerce',
      environment: 'staging',
      browser: 'Firefox 122',
    },
    metadata: {
      retryCount: 1,
    },
    processingStatus: 'pending',
  },

  // API Log - 404 Error
  {
    teamId: 'api-team',
    testRunId: 'run-005',
    failureId: 'fail-005',
    timestamp: new Date(Date.now() - 86400000 * 1.5),
    level: 'error',
    message: 'User endpoint returned 404 Not Found',
    artifactType: 'api_log',
    artifactData: {
      endpoint: 'GET /api/users/invalid-id',
      statusCode: 404,
      statusText: 'Not Found',
      responseBody: {
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      },
    },
    context: {
      testName: 'Get User By ID',
      environment: 'staging',
    },
    processingStatus: 'pending',
  },

  // Timeout Error
  {
    teamId: 'qa-team',
    testRunId: 'run-006',
    failureId: 'fail-006',
    timestamp: new Date(Date.now() - 86400000 * 4),
    level: 'error',
    message: 'Test timeout - operation took too long',
    artifactType: 'test_result',
    artifactData: {
      timeout: 30000,
      actualDuration: 35000,
      operation: 'form_submission',
    },
    context: {
      testName: 'Form Submission Test',
      environment: 'staging',
    },
    metadata: {
      retryCount: 3,
    },
    processingStatus: 'pending',
  },

  // Network Issue
  {
    teamId: 'api-team',
    testRunId: 'run-007',
    failureId: 'fail-007',
    timestamp: new Date(Date.now() - 86400000 * 5),
    level: 'error',
    message: 'Network error - failed to fetch from third-party service',
    artifactType: 'har',
    artifactData: {
      log: {
        version: '1.2',
        entries: [
          {
            request: {
              method: 'GET',
              url: 'https://external-service.com/data',
            },
            response: {
              status: 0,
              statusText: 'Network Error',
            },
          },
        ],
      },
    },
    context: {
      testName: 'External Service Integration',
      environment: 'staging',
    },
    processingStatus: 'pending',
  },

  // Already Processed - UI Bug (with classification)
  {
    teamId: 'qa-team',
    testRunId: 'run-008',
    failureId: 'fail-008',
    timestamp: new Date(Date.now() - 86400000 * 10),
    level: 'error',
    message: 'Login button not responsive on mobile',
    artifactType: 'screenshot',
    artifactData: {
      imageBase64: 'base64_image_data',
      width: 375,
      height: 667,
      platform: 'iOS',
    },
    context: {
      testName: 'Mobile Login Test',
      browser: 'Safari',
      platform: 'iOS 16',
      environment: 'staging',
    },
    processingStatus: 'completed',
    classification: {
      isDefect: true,
      defectType: 'ui_bug',
      severity: 'high',
      confidence: 'high',
      rootCauseAnalysis: 'CSS media query missing for mobile breakpoint',
      recommendations: [
        'Add mobile-specific CSS styles',
        'Test on multiple device sizes',
        'Implement responsive design',
      ],
      isFlaky: false,
      flakinessScore: 0.1,
    },
  },

  // Already Processed - Flaky Test
  {
    teamId: 'qa-team',
    testRunId: 'run-009',
    failureId: 'fail-009',
    timestamp: new Date(Date.now() - 86400000 * 20),
    level: 'warn',
    message: 'Test intermittently times out waiting for element',
    artifactType: 'ui_log',
    artifactData: {
      consoleErrors: ['TimeoutError: element did not appear'],
    },
    context: {
      testName: 'Dashboard Load Test',
      environment: 'staging',
    },
    metadata: {
      retryCount: 5,
    },
    processingStatus: 'completed',
    classification: {
      isDefect: false,
      defectType: 'flaky_test',
      severity: 'medium',
      confidence: 'high',
      rootCauseAnalysis: 'Race condition - element loading depends on network speed',
      recommendations: [
        'Add explicit wait conditions',
        'Implement retry logic with backoff',
        'Add logging for debugging',
      ],
      isFlaky: true,
      flakinessScore: 0.75,
    },
  },

  // Authentication Error
  {
    teamId: 'backend-team',
    testRunId: 'run-010',
    failureId: 'fail-010',
    timestamp: new Date(Date.now() - 86400000 * 6),
    level: 'error',
    message: 'Authentication token expired',
    artifactType: 'api_log',
    artifactData: {
      endpoint: 'POST /api/auth/refresh',
      statusCode: 401,
      statusText: 'Unauthorized',
      responseBody: {
        error: 'Token expired',
      },
    },
    context: {
      testName: 'Token Refresh Test',
      environment: 'production',
    },
    processingStatus: 'pending',
  },
];

/**
 * Connect to MongoDB
 */
async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/unified-defect-analyzer';

    await mongoose.connect(mongoUri);
    logInfo('Connected to MongoDB');

    return true;
  } catch (error) {
    logError(`Failed to connect to MongoDB: ${error}`);
    return false;
  }
}

/**
 * Clear existing logs (optional - for clean seeding)
 */
async function clearDatabase() {
  try {
    const count = await Log.deleteMany({});
    logInfo(`Cleared ${count.deletedCount} existing logs`);
  } catch (error) {
    logError(`Error clearing database: ${error}`);
  }
}

/**
 * Insert sample logs into database
 */
async function insertSampleLogs() {
  try {
    logInfo(`Inserting ${sampleLogs.length} sample logs...`);

    const inserted = await Log.insertMany(sampleLogs);

    logInfo(`Successfully inserted ${inserted.length} logs`);

    return inserted;
  } catch (error) {
    logError(`Error inserting logs: ${error}`);
    throw error;
  }
}

/**
 * Generate and store embeddings for logs
 */
async function generateEmbeddings(logs: any[]) {
  try {
    logInfo(`Generating embeddings for ${logs.length} logs...`);

    let successCount = 0;
    let errorCount = 0;

    for (const log of logs) {
      try {
        // Generate embedding from log message
        const embedding = await ragService.getEmbedding(log.message);

        // Store embedding in log (optional - for future optimization)
        // In production, this would be stored in a vector database
        logInfo(`Generated embedding for log ${log._id} (dimension: ${embedding.length})`);

        successCount++;
      } catch (error) {
        logError(`Error generating embedding for log ${log._id}: ${error}`);
        errorCount++;
      }
    }

    logInfo(
      `Embedding generation complete: ${successCount} successful, ${errorCount} failed`
    );

    return successCount;
  } catch (error) {
    logError(`Error in embedding generation: ${error}`);
    throw error;
  }
}

/**
 * Create database indexes
 */
async function createIndexes() {
  try {
    logInfo('Creating database indexes...');

    await Log.collection.createIndex({ teamId: 1, timestamp: -1 });
    await Log.collection.createIndex({ teamId: 1, testRunId: 1 });
    await Log.collection.createIndex({ teamId: 1, artifactType: 1, timestamp: -1 });
    await Log.collection.createIndex({ teamId: 1, processingStatus: 1 });
    await Log.collection.createIndex({ message: 'text' });

    logInfo('Indexes created successfully');
  } catch (error) {
    logError(`Error creating indexes: ${error}`);
  }
}

/**
 * Display seeding summary
 */
async function displaySummary() {
  try {
    const totalCount = await Log.countDocuments({});
    const byTeam = await Log.aggregate([
      {
        $group: {
          _id: '$teamId',
          count: { $sum: 1 },
        },
      },
    ]);

    const byStatus = await Log.aggregate([
      {
        $group: {
          _id: '$processingStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const byType = await Log.aggregate([
      {
        $group: {
          _id: '$artifactType',
          count: { $sum: 1 },
        },
      },
    ]);

    console.log('\n📊 SEEDING SUMMARY\n');
    console.log(`Total logs: ${totalCount}`);

    console.log('\nBy Team:');
    byTeam.forEach(team => {
      console.log(`  ${team._id}: ${team.count} logs`);
    });

    console.log('\nBy Status:');
    byStatus.forEach(status => {
      console.log(`  ${status._id}: ${status.count} logs`);
    });

    console.log('\nBy Artifact Type:');
    byType.forEach(type => {
      console.log(`  ${type._id}: ${type.count} logs`);
    });

    console.log('\n✅ Database seeding complete!\n');
  } catch (error) {
    logError(`Error displaying summary: ${error}`);
  }
}

/**
 * Main seeding function
 */
async function seed() {
  try {
    console.log('\n🌱 Starting MongoDB Database Seeding\n');

    // Connect to database
    const connected = await connectDatabase();
    if (!connected) {
      throw new Error('Failed to connect to MongoDB');
    }

    // Optional: Clear existing data
    // Uncomment to reset database on each run
    // await clearDatabase();

    // Insert sample logs
    const insertedLogs = await insertSampleLogs();

    // Generate embeddings
    await generateEmbeddings(insertedLogs);

    // Create indexes
    await createIndexes();

    // Display summary
    await displaySummary();

    logInfo('Database seeding completed successfully');
  } catch (error) {
    logError(`Seeding failed: ${error}`);
    process.exit(1);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    logInfo('Disconnected from MongoDB');
  }
}

// Run seeding
seed();
