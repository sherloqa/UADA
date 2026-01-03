import express from 'express';
import logRoutes from './routes/logs';
import { errorHandler } from './middleware/errorHandler';
import connectDB from './config/db';

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' })); // Increased limit for large artifacts
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration (if needed for frontend)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Connect to MongoDB
connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Unified Defect Analyzer API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/logs', logRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;