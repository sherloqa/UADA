import { Request, Response, NextFunction } from 'express';
import LogsService, { CreateLogDTO, QueryLogsDTO } from '../services/logsService';
import { ArtifactType, LogLevel } from '../models/Log';

class LogsController {
    private logsService: LogsService;

    constructor() {
        this.logsService = new LogsService();
    }

    /**
     * Upload a single log/artifact
     * POST /api/logs/upload
     */
    public async uploadLog(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const logData: CreateLogDTO = req.body;
            const savedLog = await this.logsService.saveLog(logData);
            
            res.status(201).json({ 
                success: true,
                message: 'Log uploaded successfully', 
                data: {
                    logId: savedLog._id,
                    teamId: savedLog.teamId,
                    artifactType: savedLog.artifactType,
                    processingStatus: savedLog.processingStatus,
                    timestamp: savedLog.timestamp
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Bulk upload multiple logs/artifacts
     * POST /api/logs/upload/bulk
     */
    public async uploadBulkLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const logsData: CreateLogDTO[] = req.body.logs;
            
            if (!Array.isArray(logsData) || logsData.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid request: logs array is required'
                });
                return;
            }

            const savedLogs = await this.logsService.saveBulkLogs(logsData);
            
            res.status(201).json({ 
                success: true,
                message: `${savedLogs.length} logs uploaded successfully`, 
                data: {
                    count: savedLogs.length,
                    logIds: savedLogs.map(log => log._id)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a log by ID
     * GET /api/logs/:logId
     */
    public async getLog(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { logId } = req.params;
            const { teamId } = req.query;

            if (!teamId) {
                res.status(400).json({
                    success: false,
                    message: 'teamId query parameter is required'
                });
                return;
            }

            const log = await this.logsService.getLogById(logId, teamId as string);
            
            if (!log) {
                res.status(404).json({
                    success: false,
                    message: 'Log not found'
                });
                return;
            }

            res.status(200).json({ 
                success: true,
                data: log
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Query logs with filters
     * GET /api/logs
     */
    public async queryLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const queryParams: QueryLogsDTO = {
                teamId: req.query.teamId as string,
                testRunId: req.query.testRunId as string,
                failureId: req.query.failureId as string,
                artifactType: req.query.artifactType as ArtifactType,
                level: req.query.level as LogLevel,
                processingStatus: req.query.processingStatus as any,
                testName: req.query.testName as string,
                testSuite: req.query.testSuite as string,
                limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
                skip: req.query.skip ? parseInt(req.query.skip as string) : 0
            };

            if (!queryParams.teamId) {
                res.status(400).json({
                    success: false,
                    message: 'teamId query parameter is required'
                });
                return;
            }

            // Date range handling
            if (req.query.startDate) {
                queryParams.startDate = new Date(req.query.startDate as string);
            }
            if (req.query.endDate) {
                queryParams.endDate = new Date(req.query.endDate as string);
            }

            const result = await this.logsService.queryLogs(queryParams);
            
            res.status(200).json({ 
                success: true,
                data: {
                    logs: result.logs,
                    pagination: {
                        total: result.total,
                        limit: queryParams.limit,
                        skip: queryParams.skip,
                        hasMore: (queryParams.skip || 0) + (queryParams.limit || 100) < result.total
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get logs for a specific test run
     * GET /api/logs/testrun/:testRunId
     */
    public async getLogsByTestRun(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { testRunId } = req.params;
            const { teamId } = req.query;

            if (!teamId) {
                res.status(400).json({
                    success: false,
                    message: 'teamId query parameter is required'
                });
                return;
            }

            const logs = await this.logsService.getLogsByTestRun(testRunId, teamId as string);
            
            res.status(200).json({ 
                success: true,
                data: {
                    testRunId,
                    count: logs.length,
                    logs
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get pending logs for processing
     * GET /api/logs/pending
     */
    public async getPendingLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { teamId, limit } = req.query;

            if (!teamId) {
                res.status(400).json({
                    success: false,
                    message: 'teamId query parameter is required'
                });
                return;
            }

            const logs = await this.logsService.getPendingLogs(
                teamId as string,
                limit ? parseInt(limit as string) : 50
            );
            
            res.status(200).json({ 
                success: true,
                data: {
                    count: logs.length,
                    logs
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update processing status (for AI agents)
     * PUT /api/logs/:logId/status
     */
    public async updateProcessingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { logId } = req.params;
            const { teamId, status, error } = req.body;

            if (!teamId || !status) {
                res.status(400).json({
                    success: false,
                    message: 'teamId and status are required'
                });
                return;
            }

            const log = await this.logsService.updateProcessingStatus(
                logId,
                teamId,
                status,
                error
            );

            if (!log) {
                res.status(404).json({
                    success: false,
                    message: 'Log not found'
                });
                return;
            }

            res.status(200).json({ 
                success: true,
                message: 'Processing status updated',
                data: log
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update classification (for AI agents)
     * PUT /api/logs/:logId/classification
     */
    public async updateClassification(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { logId } = req.params;
            const { teamId, classification } = req.body;

            if (!teamId || !classification) {
                res.status(400).json({
                    success: false,
                    message: 'teamId and classification are required'
                });
                return;
            }

            const log = await this.logsService.updateClassification(
                logId,
                teamId,
                classification
            );

            if (!log) {
                res.status(404).json({
                    success: false,
                    message: 'Log not found'
                });
                return;
            }

            res.status(200).json({ 
                success: true,
                message: 'Classification updated',
                data: log
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get log statistics for dashboard
     * GET /api/logs/stats
     */
    public async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { teamId, days } = req.query;

            if (!teamId) {
                res.status(400).json({
                    success: false,
                    message: 'teamId query parameter is required'
                });
                return;
            }

            const stats = await this.logsService.getLogStatistics(
                teamId as string,
                days ? parseInt(days as string) : 7
            );
            
            res.status(200).json({ 
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a log
     * DELETE /api/logs/:logId
     */
    public async deleteLog(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { logId } = req.params;
            const { teamId } = req.query;

            if (!teamId) {
                res.status(400).json({
                    success: false,
                    message: 'teamId query parameter is required'
                });
                return;
            }

            const deleted = await this.logsService.deleteLog(logId, teamId as string);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Log not found'
                });
                return;
            }

            res.status(200).json({ 
                success: true,
                message: 'Log deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

export default LogsController;