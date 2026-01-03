import { Schema, model, Document } from 'mongoose';

// Artifact types supported by the system
export enum ArtifactType {
    HAR = 'har',
    SCREENSHOT = 'screenshot',
    BACKEND_LOG = 'backend_log',
    TEST_RESULT = 'test_result',
    UI_LOG = 'ui_log',
    API_LOG = 'api_log',
    VIDEO = 'video',
    NETWORK_TRACE = 'network_trace'
}

// Log levels
export enum LogLevel {
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    DEBUG = 'debug',
    CRITICAL = 'critical'
}

// Severity levels for defect classification
export enum Severity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

// Evidence source for correlation
interface IEvidence {
    source: ArtifactType;
    data: any;
    timestamp: Date;
    metadata?: Record<string, any>;
}

// Main Log interface
export interface ILog extends Document {
    // Core identification
    teamId: string; // For multi-tenant isolation
    testRunId?: string; // Link to test execution
    failureId?: string; // Unique identifier for failure instance
    
    // Basic log fields
    timestamp: Date;
    level: LogLevel;
    message: string;
    
    // Artifact information
    artifactType: ArtifactType;
    artifactData: any; // Could be HAR content, log lines, etc.
    artifactUrl?: string; // If stored externally (GridFS, S3)
    
    // Context and metadata for RAG
    context?: {
        testName?: string;
        testSuite?: string;
        environment?: string;
        browser?: string;
        platform?: string;
        buildNumber?: string;
        commitHash?: string;
    };
    
    // Evidence correlation (Phase 1 - basic)
    relatedArtifacts?: string[]; // Array of related log IDs
    evidence?: IEvidence[];
    
    // Classification (to be populated by AI agents)
    classification?: {
        isDefect: boolean;
        defectType?: string; // UI, API, Backend, etc.
        confidence?: 'low' | 'medium' | 'high';
        severity?: Severity;
    };
    
    // Processing status
    processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
    processingError?: string;
    
    // Metadata for extensibility
    metadata?: Record<string, any>;
    
    // Audit fields
    createdAt: Date;
    updatedAt: Date;
}

const logSchema = new Schema<ILog>({
    // Core identification
    teamId: { 
        type: String, 
        required: true, 
        index: true // For multi-tenant queries
    },
    testRunId: { type: String, index: true },
    failureId: { type: String, index: true },
    
    // Basic log fields
    timestamp: { 
        type: Date, 
        default: Date.now, 
        index: true // For time-based queries
    },
    level: { 
        type: String, 
        required: true,
        enum: Object.values(LogLevel),
        default: LogLevel.INFO
    },
    message: { 
        type: String, 
        required: true,
        text: true // Full-text search index
    },
    
    // Artifact information
    artifactType: { 
        type: String, 
        required: true,
        enum: Object.values(ArtifactType),
        index: true
    },
    artifactData: { 
        type: Schema.Types.Mixed, 
        required: true 
    },
    artifactUrl: { type: String },
    
    // Context and metadata
    context: {
        type: {
            testName: { type: String },
            testSuite: { type: String },
            environment: { type: String },
            browser: { type: String },
            platform: { type: String },
            buildNumber: { type: String },
            commitHash: { type: String }
        },
        required: false
    },
    
    // Evidence correlation
    relatedArtifacts: [{ type: String }],
    evidence: [{
        source: { 
            type: String, 
            enum: Object.values(ArtifactType) 
        },
        data: Schema.Types.Mixed,
        timestamp: Date,
        metadata: Schema.Types.Mixed
    }],
    
    // Classification
    classification: {
        isDefect: { type: Boolean },
        defectType: { type: String },
        confidence: { 
            type: String, 
            enum: ['low', 'medium', 'high'] 
        },
        severity: { 
            type: String, 
            enum: Object.values(Severity) 
        }
    },
    
    // Processing status
    processingStatus: { 
        type: String, 
        required: true,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
        index: true
    },
    processingError: { type: String },
    
    // Metadata
    metadata: { type: Schema.Types.Mixed }
}, {
    timestamps: true // Automatically add createdAt and updatedAt
});

// Compound indexes for common query patterns
logSchema.index({ teamId: 1, timestamp: -1 });
logSchema.index({ teamId: 1, testRunId: 1 });
logSchema.index({ teamId: 1, artifactType: 1, timestamp: -1 });
logSchema.index({ teamId: 1, processingStatus: 1 });

const Log = model<ILog>('Log', logSchema);

export default Log;