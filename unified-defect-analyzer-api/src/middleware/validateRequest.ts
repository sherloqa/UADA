import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

/**
 * Middleware to validate request using express-validator
 */
export const validateRequest = (validations: ValidationChain[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Execute all validations
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        // Format errors for better readability
        const formattedErrors = errors.array().map(error => ({
            field: error.type === 'field' ? (error as any).path : 'unknown',
            message: error.msg,
            value: error.type === 'field' ? (error as any).value : undefined
        }));

        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: formattedErrors
        });
    };
};