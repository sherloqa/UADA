// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
config();

import app from './app';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        app.listen(PORT, () => {
            console.log(`✓ Unified Defect Analyzer API is running`);
            console.log(`✓ Server: http://localhost:${PORT}`);
            console.log(`✓ Health Check: http://localhost:${PORT}/health`);
            console.log(`✓ API Endpoint: http://localhost:${PORT}/api/logs`);
            console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Error starting the server:', error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error);
    process.exit(1);
});

startServer();