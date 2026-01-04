import mongoose from 'mongoose';
import HistoricDefect from '../models/HistoricDefect';
import TestExecution from '../models/TestExecution';
import { ragService } from '../services/ragService';
import { logInfo, logError } from '../utils/logger';

/**
 * Seed Historic Defects and Test Execution Data
 * 
 * This script populates MongoDB with:
 * 1. Historic Defects - Known patterns from past issues
 * 2. Test Execution History - Previous test runs with flakiness data
 * 
 * These collections provide context for the AI Agent's analysis
 */

async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/unified-defect-analyzer';
    await mongoose.connect(mongoUri);
    logInfo(`Connected to database: ${mongoUri}`);
  } catch (error) {
    logError(`Database connection failed: ${error}`);
    throw error;
  }
}

async function clearCollections() {
  try {
    await HistoricDefect.deleteMany({});
    await TestExecution.deleteMany({});
    logInfo('Cleared historic_defects and test_executions collections');
  } catch (error) {
    logError(`Error clearing collections: ${error}`);
  }
}

async function insertHistoricDefects() {
  try {
    const historicDefects = [
      {
        teamId: 'qa-team',
        defectId: 'DEF-001',
        title: 'Login Button Not Responding on Mobile',
        description: 'The login button becomes unresponsive on iOS Safari when session expires',
        rootCause: 'Race condition in session management causing stale DOM references',
        resolution: 'Updated event listener binding order and added session refresh check',
        defectType: 'ui_bug',
        severity: 'high',
        component: 'Authentication',
        firstDiscovered: new Date('2024-01-15'),
        lastOccurred: new Date('2024-03-20'),
        occurrenceCount: 23,
        affectedVersions: ['1.2.0', '1.2.1', '1.3.0'],
        titleEmbedding: await ragService.getEmbedding('Login button unresponsive mobile'),
        descriptionEmbedding: await ragService.getEmbedding('session expires iOS Safari stale DOM'),
        rootCauseEmbedding: await ragService.getEmbedding('Race condition session management'),
        environment: 'production',
        status: 'resolved',
        resolutionDate: new Date('2024-03-22'),
        jiraTicket: 'JIRA-1234',
        tags: ['mobile', 'authentication', 'race-condition'],
      },
      {
        teamId: 'api-team',
        defectId: 'DEF-002',
        title: '500 Internal Server Error on /api/users Endpoint',
        description: 'Intermittent 500 errors on the /api/users GET endpoint during high load',
        rootCause: 'Unhandled exception in user validation middleware when cache misses occur',
        resolution: 'Added try-catch wrapping and implemented fallback cache strategy',
        defectType: 'api_error',
        severity: 'critical',
        component: 'User Service',
        firstDiscovered: new Date('2024-02-01'),
        lastOccurred: new Date('2024-03-10'),
        occurrenceCount: 45,
        affectedVersions: ['2.0.0', '2.0.1'],
        titleEmbedding: await ragService.getEmbedding('500 error API users endpoint'),
        descriptionEmbedding: await ragService.getEmbedding('intermittent 500 high load cache'),
        rootCauseEmbedding: await ragService.getEmbedding('Unhandled exception validation middleware'),
        environment: 'production',
        status: 'resolved',
        resolutionDate: new Date('2024-03-12'),
        jiraTicket: 'JIRA-2345',
        tags: ['api', 'performance', 'cache'],
      },
      {
        teamId: 'backend-team',
        defectId: 'DEF-003',
        title: 'Database Connection Timeout in Batch Jobs',
        description: 'Batch processing jobs timeout when database connection pool is exhausted',
        rootCause: 'Insufficient connection pool size for concurrent batch operations',
        resolution: 'Increased pool size from 10 to 30 and implemented queue management',
        defectType: 'backend_error',
        severity: 'high',
        component: 'Database Layer',
        firstDiscovered: new Date('2024-01-20'),
        lastOccurred: new Date('2024-03-15'),
        occurrenceCount: 34,
        affectedVersions: ['3.1.0', '3.1.1', '3.2.0'],
        titleEmbedding: await ragService.getEmbedding('Database connection timeout batch jobs'),
        descriptionEmbedding: await ragService.getEmbedding('connection pool exhausted batch processing'),
        rootCauseEmbedding: await ragService.getEmbedding('Insufficient pool size concurrent operations'),
        environment: 'production',
        status: 'resolved',
        resolutionDate: new Date('2024-03-18'),
        jiraTicket: 'JIRA-3456',
        tags: ['database', 'performance', 'batch-processing'],
      },
      {
        teamId: 'qa-team',
        defectId: 'DEF-004',
        title: 'Timeout Error During Heavy Network Load',
        description: 'API requests timeout when network bandwidth is limited',
        rootCause: 'Hardcoded timeout value of 5 seconds too short for 3G networks',
        resolution: 'Implemented dynamic timeout based on network condition detection',
        defectType: 'network_error',
        severity: 'medium',
        component: 'Network Layer',
        firstDiscovered: new Date('2024-02-10'),
        lastOccurred: new Date('2024-03-25'),
        occurrenceCount: 56,
        affectedVersions: ['1.4.0', '1.5.0'],
        titleEmbedding: await ragService.getEmbedding('Timeout error heavy network load'),
        descriptionEmbedding: await ragService.getEmbedding('API requests timeout limited bandwidth'),
        rootCauseEmbedding: await ragService.getEmbedding('Hardcoded 5 second timeout 3G networks'),
        environment: 'production',
        status: 'active',
        tags: ['network', 'timeout', 'mobile'],
      },
      {
        teamId: 'api-team',
        defectId: 'DEF-005',
        title: 'Memory Leak in WebSocket Handler',
        description: 'Memory usage grows unbounded in long-running WebSocket connections',
        rootCause: 'Event listeners not properly cleaned up on connection close',
        resolution: 'Added explicit cleanup in WebSocket close handler and added memory monitoring',
        defectType: 'backend_error',
        severity: 'critical',
        component: 'WebSocket Service',
        firstDiscovered: new Date('2024-03-01'),
        lastOccurred: new Date('2024-03-24'),
        occurrenceCount: 12,
        affectedVersions: ['2.1.0'],
        titleEmbedding: await ragService.getEmbedding('Memory leak WebSocket handler'),
        descriptionEmbedding: await ragService.getEmbedding('Memory unbounded WebSocket connections'),
        rootCauseEmbedding: await ragService.getEmbedding('Event listeners cleanup connection close'),
        status: 'active',
        tags: ['memory-leak', 'websocket', 'critical'],
      },
    ];

    const result = await HistoricDefect.insertMany(historicDefects);
    logInfo(`Inserted ${result.length} historic defects`);
    return result;
  } catch (error) {
    logError(`Error inserting historic defects: ${error}`);
    throw error;
  }
}

async function insertTestExecutions() {
  try {
    const testExecutions = [
      {
        teamId: 'qa-team',
        executionId: 'TEST-001',
        testName: 'test_login_with_valid_credentials',
        testSuite: 'Authentication',
        testFile: 'tests/auth.test.ts',
        description: 'Validates successful login with correct email and password',
        status: 'failed',
        duration: 3500,
        timestamp: new Date('2024-03-20T10:30:00Z'),
        failureMessage: 'Timeout waiting for login button response',
        failureReason: 'Button click not triggering login process',
        environment: 'staging',
        browser: 'Chrome',
        platform: 'macOS',
        buildNumber: 'build-1234',
        consecutiveFailures: 3,
        totalExecutions: 50,
        passRate: 94,
        flakinessScore: 35,
        testNameEmbedding: await ragService.getEmbedding('login with valid credentials test'),
        failureMessageEmbedding: await ragService.getEmbedding('Timeout waiting login button'),
        defectType: 'ui_bug',
        flakiness: {
          isFlaky: true,
          flakySince: new Date('2024-03-10'),
          possibleCauses: ['Network latency', 'DOM synchronization issue'],
        },
        relatedHistoricDefectIds: ['DEF-001'],
        jiraTicket: 'JIRA-1234',
        tags: ['authentication', 'flaky', 'ui'],
      },
      {
        teamId: 'api-team',
        executionId: 'TEST-002',
        testName: 'test_get_users_with_pagination',
        testSuite: 'User API',
        testFile: 'tests/api/users.test.ts',
        description: 'Tests paginated retrieval of users from API',
        status: 'failed',
        duration: 5200,
        timestamp: new Date('2024-03-21T14:15:00Z'),
        failureMessage: '500 Internal Server Error from /api/users endpoint',
        failureReason: 'Cache miss in validation middleware',
        environment: 'staging',
        browser: 'API Client',
        platform: 'Linux',
        buildNumber: 'build-5678',
        consecutiveFailures: 2,
        totalExecutions: 120,
        passRate: 98.3,
        flakinessScore: 22,
        testNameEmbedding: await ragService.getEmbedding('get users pagination API test'),
        failureMessageEmbedding: await ragService.getEmbedding('500 Internal Server Error users endpoint'),
        defectType: 'api_error',
        flakiness: {
          isFlaky: true,
          flakySince: new Date('2024-02-28'),
          possibleCauses: ['Cache misconfiguration', 'Timing issue'],
        },
        relatedHistoricDefectIds: ['DEF-002'],
        jiraTicket: 'JIRA-2345',
        tags: ['api', 'users', 'pagination'],
      },
      {
        teamId: 'backend-team',
        executionId: 'TEST-003',
        testName: 'test_batch_job_completion',
        testSuite: 'Batch Processing',
        testFile: 'tests/batch.test.ts',
        description: 'Tests successful completion of batch processing job',
        status: 'failed',
        duration: 8500,
        timestamp: new Date('2024-03-21T16:45:00Z'),
        failureMessage: 'Database connection timeout after 30 seconds',
        failureReason: 'Connection pool exhaustion during peak load',
        environment: 'staging',
        browser: 'N/A',
        platform: 'Linux',
        buildNumber: 'build-9012',
        consecutiveFailures: 1,
        totalExecutions: 30,
        passRate: 96.7,
        flakinessScore: 45,
        testNameEmbedding: await ragService.getEmbedding('batch job completion test'),
        failureMessageEmbedding: await ragService.getEmbedding('Database connection timeout'),
        defectType: 'backend_error',
        flakiness: {
          isFlaky: true,
          flakySince: new Date('2024-03-01'),
          possibleCauses: ['Connection pool size', 'Load timing'],
        },
        relatedHistoricDefectIds: ['DEF-003'],
        jiraTicket: 'JIRA-3456',
        tags: ['batch', 'database', 'backend'],
      },
      {
        teamId: 'qa-team',
        executionId: 'TEST-004',
        testName: 'test_network_resilience',
        testSuite: 'Network',
        testFile: 'tests/network.test.ts',
        description: 'Tests API resilience on slow networks',
        status: 'flaky',
        duration: 12000,
        timestamp: new Date('2024-03-22T08:20:00Z'),
        failureMessage: 'Request timeout on 3G network simulation',
        failureReason: 'Fixed timeout too short for slow networks',
        environment: 'staging',
        browser: 'Mobile Simulator',
        platform: 'iOS',
        buildNumber: 'build-3456',
        consecutiveFailures: 5,
        totalExecutions: 40,
        passRate: 87.5,
        flakinessScore: 72,
        testNameEmbedding: await ragService.getEmbedding('network resilience test'),
        failureMessageEmbedding: await ragService.getEmbedding('Request timeout 3G network'),
        defectType: 'network_error',
        flakiness: {
          isFlaky: true,
          flakySince: new Date('2024-02-10'),
          possibleCauses: ['Fixed timeout value', 'Network simulation variance'],
        },
        relatedHistoricDefectIds: ['DEF-004'],
        tags: ['network', 'mobile', 'timeout'],
      },
      {
        teamId: 'api-team',
        executionId: 'TEST-005',
        testName: 'test_websocket_long_connection',
        testSuite: 'WebSocket',
        testFile: 'tests/websocket.test.ts',
        description: 'Tests WebSocket connection stability over long duration',
        status: 'failed',
        duration: 45000,
        timestamp: new Date('2024-03-22T11:30:00Z'),
        failureMessage: 'Memory usage exceeded threshold after 40 seconds',
        failureReason: 'Event listener accumulation in WebSocket handler',
        environment: 'staging',
        browser: 'Node.js',
        platform: 'Linux',
        buildNumber: 'build-7890',
        consecutiveFailures: 8,
        totalExecutions: 25,
        passRate: 68,
        flakinessScore: 92,
        testNameEmbedding: await ragService.getEmbedding('websocket long connection test'),
        failureMessageEmbedding: await ragService.getEmbedding('Memory exceeded threshold WebSocket'),
        defectType: 'backend_error',
        flakiness: {
          isFlaky: true,
          flakySince: new Date('2024-03-01'),
          possibleCauses: ['Memory leak in handler', 'Event listener cleanup'],
        },
        relatedHistoricDefectIds: ['DEF-005'],
        jiraTicket: 'JIRA-5678',
        tags: ['websocket', 'memory', 'critical'],
      },
    ];

    const result = await TestExecution.insertMany(testExecutions);
    logInfo(`Inserted ${result.length} test executions`);
    return result;
  } catch (error) {
    logError(`Error inserting test executions: ${error}`);
    throw error;
  }
}

async function createIndexes() {
  try {
    // Historic Defect Indexes
    await HistoricDefect.collection.createIndex({ teamId: 1, status: 1 });
    await HistoricDefect.collection.createIndex({ defectType: 1, severity: 1 });
    await HistoricDefect.collection.createIndex({ lastOccurred: -1 });

    // Test Execution Indexes
    await TestExecution.collection.createIndex({ teamId: 1, timestamp: -1 });
    await TestExecution.collection.createIndex({ flakinessScore: -1 });
    await TestExecution.collection.createIndex({ testName: 1, status: 1 });

    logInfo('Created database indexes for both collections');
  } catch (error) {
    logError(`Error creating indexes: ${error}`);
  }
}

async function displaySummary() {
  try {
    const historicCount = await HistoricDefect.countDocuments();
    const testCount = await TestExecution.countDocuments();

    const historicByTeam = await HistoricDefect.aggregate([
      { $group: { _id: '$teamId', count: { $sum: 1 } } },
    ]);

    const testByTeam = await TestExecution.aggregate([
      { $group: { _id: '$teamId', count: { $sum: 1 } } },
    ]);

    console.log('\n=====================================');
    console.log('📊 Dual Vector Database Seeding Summary');
    console.log('=====================================\n');

    console.log('Historic Defects:');
    console.log(`  - Total: ${historicCount}`);
    historicByTeam.forEach(item => {
      console.log(`  - ${item._id}: ${item.count}`);
    });

    console.log('\nTest Executions:');
    console.log(`  - Total: ${testCount}`);
    testByTeam.forEach(item => {
      console.log(`  - ${item._id}: ${item.count}`);
    });

    console.log('\nVector Collections Ready for RAG Analysis');
    console.log('=====================================\n');
  } catch (error) {
    logError(`Error displaying summary: ${error}`);
  }
}

async function main() {
  try {
    await connectDatabase();
    await clearCollections();
    await insertHistoricDefects();
    await insertTestExecutions();
    await createIndexes();
    await displaySummary();
    await mongoose.disconnect();
    logInfo('Seeding completed successfully');
  } catch (error) {
    logError(`Seeding failed: ${error}`);
    process.exit(1);
  }
}

main();
