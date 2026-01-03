import Log, { ILog, ArtifactType, LogLevel } from '../models/Log';
import { FilterQuery } from 'mongoose';

// DTOs for request/response
export interface CreateLogDTO {
    teamId: string;
    testRunId?: string;
    failureId?: string;
    timestamp?: Date;
    level: LogLevel;
    message: string;
    artifactType: ArtifactType;
    artifactData: any;
    artifactUrl?: string;
    context?: {
        testName?: string;
        testSuite?: string;
        environment?: string;
        browser?: string;
        platform?: string;
        buildNumber?: string;
        commitHash?: string;
    };
    relatedArtifacts?: string[];
    metadata?: Record<string, any>;
}

export interface QueryLogsDTO {
    teamId: string;
    testRunId?: string;
    failureId?: string;
    artifactType?: ArtifactType;
    level?: LogLevel;
    processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
    startDate?: Date;
    endDate?: Date;
    testName?: string;
    testSuite?: string;
    limit?: number;
    skip?: number;
}

class LogsService {
    /**
     * Save a log/artifact to MongoDB
     */
    public async saveLog(logData: CreateLogDTO): Promise<ILog> {
        try {
            const log = new Log({
                ...logData,
                timestamp: logData.timestamp || new Date(),
                processingStatus: 'pending'
            });
            
            const savedLog = await log.save();
            return savedLog;
        } catch (error) {
            throw new Error(`Failed to save log: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Bulk upload multiple logs (useful for batch processing)
     */
    public async saveBulkLogs(logsData: CreateLogDTO[]): Promise<ILog[]> {
        try {
            const logs = logsData.map(logData => ({
                ...logData,
                timestamp: logData.timestamp || new Date(),
                processingStatus: 'pending' as const
            }));
            
            const savedLogs = await Log.insertMany(logs);
            return savedLogs;
        } catch (error) {
            throw new Error(`Failed to save bulk logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get a log by ID
     */
    public async getLogById(logId: string, teamId: string): Promise<ILog | null> {
        try {
            const log = await Log.findOne({ _id: logId, teamId });
            return log;
        } catch (error) {
            throw new Error(`Failed to retrieve log: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Query logs with filters (multi-tenant aware)
     */
    public async queryLogs(queryParams: QueryLogsDTO): Promise<{ logs: ILog[]; total: number }> {
        try {
            const {
                teamId,
                testRunId,
                failureId,
                artifactType,
                level,
                processingStatus,
                startDate,
                endDate,
                testName,
                testSuite,
                limit = 100,
                skip = 0
            } = queryParams;

            // Build query - always filter by teamId for tenant isolation
            const query: FilterQuery<ILog> = { teamId };

            if (testRunId) query.testRunId = testRunId;
            if (failureId) query.failureId = failureId;
            if (artifactType) query.artifactType = artifactType;
            if (level) query.level = level;
            if (processingStatus) query.processingStatus = processingStatus;
            if (testName) query['context.testName'] = testName;
            if (testSuite) query['context.testSuite'] = testSuite;

            // Date range query
            if (startDate || endDate) {
                query.timestamp = {};
                if (startDate) query.timestamp.$gte = startDate;
                if (endDate) query.timestamp.$lte = endDate;
            }

            const [logs, total] = await Promise.all([
                Log.find(query)
                    .sort({ timestamp: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Log.countDocuments(query)
            ]);

            return { logs: logs as ILog[], total };
        } catch (error) {
            throw new Error(`Failed to query logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get logs by test run ID (for evidence correlation)
     */
    public async getLogsByTestRun(testRunId: string, teamId: string): Promise<ILog[]> {
        try {
            const logs = await Log.find({ testRunId, teamId })
                .sort({ timestamp: 1 })
                .lean();
            return logs as ILog[];
        } catch (error) {
            throw new Error(`Failed to retrieve test run logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Update processing status (to be called by AI agents)
     */
    public async updateProcessingStatus(
        logId: string,
        teamId: string,
        status: 'pending' | 'processing' | 'completed' | 'failed',
        error?: string
    ): Promise<ILog | null> {
        try {
            const update: any = { processingStatus: status };
            if (error) update.processingError = error;

            const log = await Log.findOneAndUpdate(
                { _id: logId, teamId },
                update,
                { new: true }
            );
            return log;
        } catch (error) {
            throw new Error(`Failed to update processing status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Update classification (to be called by AI agents)
     */
    public async updateClassification(
        logId: string,
        teamId: string,
        classification: {
            isDefect: boolean;
            defectType?: string;
            confidence?: 'low' | 'medium' | 'high';
            severity?: string;
        }
    ): Promise<ILog | null> {
        try {
            const log = await Log.findOneAndUpdate(
                { _id: logId, teamId },
                { classification },
                { new: true }
            );
            return log;
        } catch (error) {
            throw new Error(`Failed to update classification: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get pending logs for processing (for AI agent orchestration)
     */
    public async getPendingLogs(teamId: string, limit: number = 50): Promise<ILog[]> {
        try {
            const logs = await Log.find({ 
                teamId, 
                processingStatus: 'pending' 
            })
                .sort({ timestamp: 1 })
                .limit(limit)
                .lean();
            return logs as ILog[];
        } catch (error) {
            throw new Error(`Failed to retrieve pending logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Delete a log (admin operation)
     */
    public async deleteLog(logId: string, teamId: string): Promise<boolean> {
        try {
            const result = await Log.deleteOne({ _id: logId, teamId });
            return result.deletedCount === 1;
        } catch (error) {
            throw new Error(`Failed to delete log: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get statistics for dashboard (Phase 1 - basic metrics)
     */
    public async getLogStatistics(teamId: string, days: number = 7): Promise<any> {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const stats = await Log.aggregate([
                {
                    $match: {
                        teamId,
                        timestamp: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            artifactType: '$artifactType',
                            level: '$level',
                            processingStatus: '$processingStatus'
                        },
                        count: { $sum: 1 }
                    }
                }
            ]);

            return stats;
        } catch (error) {
            throw new Error(`Failed to get statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export default LogsService;