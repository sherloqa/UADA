import { Request, Response, NextFunction } from 'express';

/**
 * Custom Error class with status code
 */
export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Global error handler middleware
 */
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Handle MongoDB errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map((e: any) => e.message).join(', ');
    }

    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    }

    if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate field value entered';
    }

    // Log error for debugging
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        statusCode,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    });

    res.status(statusCode).json({
        success: false,
        status: 'error',
        statusCode,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

export { errorHandler };
export default errorHandler;