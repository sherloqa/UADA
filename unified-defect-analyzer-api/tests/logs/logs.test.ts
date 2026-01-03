import request from 'supertest';
import app from '../../src/app';
import mongoose from 'mongoose';
import Log from '../../src/models/Log';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

describe('Log Upload API', () => {
    beforeAll(async () => {
        // Use the MongoDB Atlas URI from environment variables
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
        // Don't drop the database - just clean up test data
        await Log.deleteMany({ teamId: { $regex: /^test-/ } });
        await mongoose.connection.close();
    });

    afterEach(async () => {
        // Clean up only test data after each test
        await Log.deleteMany({ teamId: { $regex: /^test-/ } });
    });

    it('should upload a log successfully', async () => {
        const logData = {
            teamId: 'test-team',
            level: 'error',
            message: 'This is a test log message',
            artifactType: 'ui_log',
            artifactData: { error: 'Test error' },
            timestamp: new Date().toISOString(),
            context: {
                testName: 'unit-test'
            }
        };

        const response = await request(app)
            .post('/api/logs/upload')
            .send(logData)
            .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('logId');
    });

    it('should return 400 for invalid log data', async () => {
        const invalidLogData = {
            teamId: 'test-team',
            level: 'error',
            message: '', // Invalid: message is required
            artifactType: 'ui_log',
            artifactData: {}
        };

        const response = await request(app)
            .post('/api/logs/upload')
            .send(invalidLogData)
            .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for missing teamId', async () => {
        const invalidLogData = {
            level: 'error',
            message: 'Test message',
            artifactType: 'ui_log',
            artifactData: {}
        };

        const response = await request(app)
            .post('/api/logs/upload')
            .send(invalidLogData)
            .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for invalid artifact type', async () => {
        const invalidLogData = {
            teamId: 'test-team',
            level: 'error',
            message: 'Test message',
            artifactType: 'invalid_type',
            artifactData: {}
        };

        const response = await request(app)
            .post('/api/logs/upload')
            .send(invalidLogData)
            .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body).toHaveProperty('errors');
    });

    it('should query logs with filters', async () => {
        // Create test data
        await request(app)
            .post('/api/logs/upload')
            .send({
                teamId: 'test-team-query',
                level: 'error',
                message: 'Error 1',
                artifactType: 'ui_log',
                artifactData: {}
            });

        await request(app)
            .post('/api/logs/upload')
            .send({
                teamId: 'test-team-query',
                level: 'warn',
                message: 'Warning 1',
                artifactType: 'api_log',
                artifactData: {}
            });

        const response = await request(app)
            .get('/api/logs?teamId=test-team-query&level=error')
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.logs.length).toBeGreaterThanOrEqual(1);
        expect(response.body.data.logs[0].level).toBe('error');
    });
});


