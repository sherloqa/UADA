import { Schema, model, Document } from 'mongoose';

/**
 * Historic Defect Model
 * Stores historical defect patterns with vector embeddings
 * Used by RAG service to provide context for defect analysis
 */

export interface IHistoricDefect extends Document {
  // Identification
  teamId: string;
  defectId: string; // Unique defect identifier
  
  // Defect information
  title: string;
  description: string;
  rootCause: string;
  resolution: string;
  
  // Classification
  defectType: string; // UI bug, API error, backend error, etc.
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string; // Which component/module
  
  // Occurrence data
  firstDiscovered: Date;
  lastOccurred: Date;
  occurrenceCount: number;
  affectedVersions: string[];
  
  // Vector embeddings (384 dimensions)
  titleEmbedding: number[];
  descriptionEmbedding: number[];
  rootCauseEmbedding: number[];
  
  // Related information
  jiraTicket?: string;
  relatedDefectIds?: string[];
  environment?: 'dev' | 'staging' | 'production';
  
  // Status
  status: 'active' | 'resolved' | 'obsolete';
  resolutionDate?: Date;
  
  // Metadata
  tags?: string[];
  metadata?: Record<string, any>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const historicDefectSchema = new Schema<IHistoricDefect>(
  {
    teamId: {
      type: String,
      required: true,
      index: true,
    },
    defectId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      text: true, // Full-text search
    },
    description: {
      type: String,
      required: true,
      text: true,
    },
    rootCause: {
      type: String,
      required: true,
    },
    resolution: {
      type: String,
      required: true,
    },
    defectType: {
      type: String,
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    component: {
      type: String,
      required: true,
      index: true,
    },
    firstDiscovered: {
      type: Date,
      default: Date.now,
    },
    lastOccurred: {
      type: Date,
      default: Date.now,
    },
    occurrenceCount: {
      type: Number,
      default: 1,
    },
    affectedVersions: [String],
    
    // Vector embeddings
    titleEmbedding: {
      type: [Number],
      required: true,
      // For MongoDB Atlas Vector Search
      // "dimensions": 384,
      // "similarity": "cosine"
    },
    descriptionEmbedding: {
      type: [Number],
      required: true,
    },
    rootCauseEmbedding: {
      type: [Number],
      required: true,
    },
    
    // Related info
    jiraTicket: String,
    relatedDefectIds: [String],
    environment: {
      type: String,
      enum: ['dev', 'staging', 'production'],
    },
    
    // Status
    status: {
      type: String,
      enum: ['active', 'resolved', 'obsolete'],
      default: 'active',
      index: true,
    },
    resolutionDate: Date,
    
    // Metadata
    tags: [String],
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
    collection: 'defectsData',
  }
);

// Indexes for common queries
historicDefectSchema.index({ teamId: 1, status: 1 });
historicDefectSchema.index({ teamId: 1, defectType: 1 });
historicDefectSchema.index({ teamId: 1, severity: 1, lastOccurred: -1 });
historicDefectSchema.index({ component: 1, defectType: 1 });

const HistoricDefect = model<IHistoricDefect>(
  'HistoricDefect',
  historicDefectSchema
);

export default HistoricDefect;
