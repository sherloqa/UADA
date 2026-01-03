import LogsService, { CreateLogDTO } from '../../src/services/logsService';
import Log, { ArtifactType, LogLevel } from '../../src/models/Log';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

describe('LogsService', () => {
    beforeAll(async () => {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        
        // Only connect if not already connected
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(uri);
        }
    });

    afterAll(async () => {
        // Clean up only test data
        await Log.deleteMany({ teamId: { $regex: /^test-/ } });
        await mongoose.connection.close();
    });

    afterEach(async () => {
        // Clean up only test data after each test
        await Log.deleteMany({ teamId: { $regex: /^test-/ } });
    });

    describe('saveLog', () => {
        it('should save a log successfully', async () => {
            const logsService = new LogsService();
            const logData: CreateLogDTO = {
                teamId: 'test-team-service',
                level: LogLevel.ERROR,
                message: 'Test error message',
                artifactType: ArtifactType.UI_LOG,
                artifactData: { error: 'Sample error' },
                context: {
                    testName: 'Login Test',
                    environment: 'staging'
                }
            };

            const savedLog = await logsService.saveLog(logData);

            expect(savedLog).toBeDefined();
            expect(savedLog.teamId).toBe('test-team-service');
            expect(savedLog.level).toBe(LogLevel.ERROR);
            expect(savedLog.processingStatus).toBe('pending');
        });

        it('should set default timestamp if not provided', async () => {
            const logsService = new LogsService();
            const logData: CreateLogDTO = {
                teamId: 'test-team-timestamp',
                level: LogLevel.INFO,
                message: 'Test message',
                artifactType: ArtifactType.API_LOG,
                artifactData: {}
            };

            const savedLog = await logsService.saveLog(logData);

            expect(savedLog.timestamp).toBeDefined();
            expect(savedLog.timestamp).toBeInstanceOf(Date);
        });

        it('should throw error for missing required fields', async () => {
            const logsService = new LogsService();
            const logData: any = {
                teamId: 'test-team-invalid',
                level: LogLevel.INFO
                // Missing message, artifactType, artifactData
            };

            await expect(logsService.saveLog(logData)).rejects.toThrow();
        });
    });

    describe('queryLogs', () => {
        beforeEach(async () => {
            // Create test data
            const logsService = new LogsService();
            const logs: CreateLogDTO[] = [
                {
                    teamId: 'test-team1',
                    testRunId: 'run1',
                    level: LogLevel.ERROR,
                    message: 'Error 1',
                    artifactType: ArtifactType.UI_LOG,
                    artifactData: {}
                },
                {
                    teamId: 'test-team1',
                    testRunId: 'run1',
                    level: LogLevel.WARN,
                    message: 'Warning 1',
                    artifactType: ArtifactType.HAR,
                    artifactData: {}
                },
                {
                    teamId: 'test-team2',
                    level: LogLevel.ERROR,
                    message: 'Error 2',
                    artifactType: ArtifactType.BACKEND_LOG,
                    artifactData: {}
                }
            ];

            await logsService.saveBulkLogs(logs);
        });

        it('should query logs by teamId', async () => {
            const logsService = new LogsService();
            const result = await logsService.queryLogs({ teamId: 'test-team1' });

            expect(result.logs).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        it('should query logs by testRunId', async () => {
            const logsService = new LogsService();
            const result = await logsService.queryLogs({
                teamId: 'test-team1',
                testRunId: 'run1'
            });

            expect(result.logs).toHaveLength(2);
        });

        it('should query logs by artifactType', async () => {
            const logsService = new LogsService();
            const result = await logsService.queryLogs({
                teamId: 'test-team1',
                artifactType: ArtifactType.UI_LOG
            });

            expect(result.logs).toHaveLength(1);
            expect(result.logs[0].artifactType).toBe(ArtifactType.UI_LOG);
        });

        it('should enforce tenant isolation', async () => {
            const logsService = new LogsService();
            const result = await logsService.queryLogs({ teamId: 'test-team2' });

            expect(result.logs).toHaveLength(1);
            expect(result.logs[0].teamId).toBe('test-team2');
        });

        it('should support pagination', async () => {
            const logsService = new LogsService();
            const result = await logsService.queryLogs({
                teamId: 'test-team1',
                skip: 0,
                limit: 1
            });

            expect(result.logs).toHaveLength(1);
            expect(result.total).toBe(2);
        });
    });

    describe('updateProcessingStatus', () => {
        it('should update processing status', async () => {
            const logsService = new LogsService();
            const logData: CreateLogDTO = {
                teamId: 'test-team-status',
                level: LogLevel.ERROR,
                message: 'Test',
                artifactType: ArtifactType.UI_LOG,
                artifactData: {}
            };

            const savedLog = await logsService.saveLog(logData);
            const updated = await logsService.updateProcessingStatus(
                savedLog._id.toString(),
                'test-team-status',
                'completed'
            );

            expect(updated).toBeDefined();
            expect(updated?.processingStatus).toBe('completed');
        });

        it('should not update log from different team', async () => {
            const logsService = new LogsService();
            const logData: CreateLogDTO = {
                teamId: 'test-team-isolation',
                level: LogLevel.ERROR,
                message: 'Test',
                artifactType: ArtifactType.UI_LOG,
                artifactData: {}
            };

            const savedLog = await logsService.saveLog(logData);
            const updated = await logsService.updateProcessingStatus(
                savedLog._id.toString(),
                'different-team',
                'completed'
            );

            expect(updated).toBeNull();
        });
    });

    describe('getLogById', () => {
        it('should get log by id with tenant isolation', async () => {
            const logsService = new LogsService();
            const logData: CreateLogDTO = {
                teamId: 'test-team-getbyid',
                level: LogLevel.ERROR,
                message: 'Test',
                artifactType: ArtifactType.UI_LOG,
                artifactData: {}
            };

            const savedLog = await logsService.saveLog(logData);
            const retrieved = await logsService.getLogById(
                savedLog._id.toString(),
                'test-team-getbyid'
            );

            expect(retrieved).toBeDefined();
            expect(retrieved?._id.toString()).toBe(savedLog._id.toString());
        });

        it('should not get log from different team', async () => {
            const logsService = new LogsService();
            const logData: CreateLogDTO = {
                teamId: 'test-team-isolation2',
                level: LogLevel.ERROR,
                message: 'Test',
                artifactType: ArtifactType.UI_LOG,
                artifactData: {}
            };

            const savedLog = await logsService.saveLog(logData);
            const retrieved = await logsService.getLogById(
                savedLog._id.toString(),
                'different-team'
            );

            expect(retrieved).toBeNull();
        });
    });

    describe('deleteLog', () => {
        it('should delete log with tenant isolation', async () => {
            const logsService = new LogsService();
            const logData: CreateLogDTO = {
                teamId: 'test-team-delete',
                level: LogLevel.ERROR,
                message: 'Test',
                artifactType: ArtifactType.UI_LOG,
                artifactData: {}
            };

            const savedLog = await logsService.saveLog(logData);
            const deleted = await logsService.deleteLog(
                savedLog._id.toString(),
                'test-team-delete'
            );

            expect(deleted).toBe(true);

            const retrieved = await logsService.getLogById(
                savedLog._id.toString(),
                'test-team-delete'
            );
            expect(retrieved).toBeNull();
        });

        it('should not delete log from different team', async () => {
            const logsService = new LogsService();
            const logData: CreateLogDTO = {
                teamId: 'test-team-delete2',
                level: LogLevel.ERROR,
                message: 'Test',
                artifactType: ArtifactType.UI_LOG,
                artifactData: {}
            };

            const savedLog = await logsService.saveLog(logData);
            const deleted = await logsService.deleteLog(
                savedLog._id.toString(),
                'different-team'
            );

            expect(deleted).toBe(false);
        });
    });

    describe('saveBulkLogs', () => {
        it('should save multiple logs', async () => {
            const logsService = new LogsService();
            const logs: CreateLogDTO[] = [
                {
                    teamId: 'test-team-bulk',
                    level: LogLevel.ERROR,
                    message: 'Error 1',
                    artifactType: ArtifactType.UI_LOG,
                    artifactData: {}
                },
                {
                    teamId: 'test-team-bulk',
                    level: LogLevel.WARN,
                    message: 'Warning 1',
                    artifactType: ArtifactType.API_LOG,
                    artifactData: {}
                }
            ];

            const savedLogs = await logsService.saveBulkLogs(logs);

            expect(savedLogs).toHaveLength(2);
            expect(savedLogs[0].processingStatus).toBe('pending');
            expect(savedLogs[1].processingStatus).toBe('pending');
        });
    });
});

