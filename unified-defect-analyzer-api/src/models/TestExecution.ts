import { Schema, model, Document } from 'mongoose';

/**
 * Test Execution History Model
 * Stores historical test execution data with embeddings
 * Used by RAG service to understand test patterns and flakiness
 */

export interface ITestExecution extends Document {
  // Identification
  teamId: string;
  executionId: string; // Unique execution identifier
  
  // Test information
  testName: string;
  testSuite: string;
  testFile: string;
  description: string;
  
  // Execution details
  status: 'passed' | 'failed' | 'skipped' | 'flaky';
  duration: number; // milliseconds
  timestamp: Date;
  
  // Failure information
  failureMessage?: string;
  failureReason?: string;
  stackTrace?: string;
  
  // Environment
  environment: string; // dev, staging, production
  browser?: string;
  platform?: string;
  buildNumber?: string;
  commitHash?: string;
  
  // Historical statistics
  consecutiveFailures: number;
  totalExecutions: number;
  passRate: number; // 0-100
  flakinessScore: number; // 0-100 (higher = more flaky)
  
  // Vector embeddings (384 dimensions)
  testNameEmbedding: number[];
  failureMessageEmbedding?: number[];
  stackTraceEmbedding?: number[];
  
  // Classification
  defectType?: string; // If related to a known defect
  flakiness?: {
    isFlaky: boolean;
    flakySince?: Date;
    possibleCauses?: string[];
  };
  
  // Related information
  relatedExecutionIds?: string[];
  relatedHistoricDefectIds?: string[];
  jiraTicket?: string;
  
  // Metadata
  tags?: string[];
  metadata?: Record<string, any>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const testExecutionSchema = new Schema<ITestExecution>(
  {
    teamId: {
      type: String,
      required: true,
      index: true,
    },
    executionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    testName: {
      type: String,
      required: true,
      text: true,
      index: true,
    },
    testSuite: {
      type: String,
      required: true,
      index: true,
    },
    testFile: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      text: true,
    },
    
    // Execution details
    status: {
      type: String,
      enum: ['passed', 'failed', 'skipped', 'flaky'],
      required: true,
      index: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    
    // Failure info
    failureMessage: String,
    failureReason: String,
    stackTrace: String,
    
    // Environment
    environment: {
      type: String,
      required: true,
      index: true,
    },
    browser: String,
    platform: String,
    buildNumber: String,
    commitHash: String,
    
    // Statistics
    consecutiveFailures: {
      type: Number,
      default: 0,
    },
    totalExecutions: {
      type: Number,
      default: 1,
    },
    passRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    flakinessScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    
    // Vector embeddings
    testNameEmbedding: {
      type: [Number],
      required: true,
      // For MongoDB Atlas Vector Search
      // "dimensions": 384,
      // "similarity": "cosine"
    },
    failureMessageEmbedding: [Number],
    stackTraceEmbedding: [Number],
    
    // Classification
    defectType: String,
    flakiness: {
      isFlaky: Boolean,
      flakySince: Date,
      possibleCauses: [String],
    },
    
    // Related info
    relatedExecutionIds: [String],
    relatedHistoricDefectIds: [String],
    jiraTicket: String,
    
    // Metadata
    tags: [String],
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
    collection: 'test_executions',
  }
);

// Indexes for common queries
testExecutionSchema.index({ teamId: 1, timestamp: -1 });
testExecutionSchema.index({ teamId: 1, testName: 1, timestamp: -1 });
testExecutionSchema.index({ teamId: 1, status: 1, timestamp: -1 });
testExecutionSchema.index({ teamId: 1, flakinessScore: -1 });
testExecutionSchema.index({ testName: 1, status: 1 });

const TestExecution = model<ITestExecution>(
  'TestExecution',
  testExecutionSchema
);

export default TestExecution;
