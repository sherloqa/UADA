import { body, query } from 'express-validator';
import { ArtifactType, LogLevel, Severity } from '../models/Log';

/**
 * Validator for single log upload
 */
export const uploadLogValidator = [
    body('teamId')
        .exists().withMessage('teamId is required')
        .isString().withMessage('teamId must be a string')
        .notEmpty().withMessage('teamId cannot be empty'),
    
    body('testRunId')
        .optional()
        .isString().withMessage('testRunId must be a string'),
    
    body('failureId')
        .optional()
        .isString().withMessage('failureId must be a string'),
    
    body('timestamp')
        .optional()
        .isISO8601().withMessage('timestamp must be a valid ISO 8601 date'),
    
    body('level')
        .exists().withMessage('level is required')
        .isIn(Object.values(LogLevel))
        .withMessage(`level must be one of: ${Object.values(LogLevel).join(', ')}`),
    
    body('message')
        .exists().withMessage('message is required')
        .isString().withMessage('message must be a string')
        .notEmpty().withMessage('message cannot be empty'),
    
    body('artifactType')
        .exists().withMessage('artifactType is required')
        .isIn(Object.values(ArtifactType))
        .withMessage(`artifactType must be one of: ${Object.values(ArtifactType).join(', ')}`),
    
    body('artifactData')
        .exists().withMessage('artifactData is required')
        .custom((value) => {
            if (value === null || value === undefined) {
                throw new Error('artifactData cannot be null or undefined');
            }
            return true;
        }),
    
    body('artifactUrl')
        .optional()
        .isString().withMessage('artifactUrl must be a string')
        .isURL().withMessage('artifactUrl must be a valid URL'),
    
    body('context')
        .optional()
        .isObject().withMessage('context must be an object'),
    
    body('context.testName')
        .optional()
        .isString().withMessage('context.testName must be a string'),
    
    body('context.testSuite')
        .optional()
        .isString().withMessage('context.testSuite must be a string'),
    
    body('context.environment')
        .optional()
        .isString().withMessage('context.environment must be a string'),
    
    body('context.browser')
        .optional()
        .isString().withMessage('context.browser must be a string'),
    
    body('context.platform')
        .optional()
        .isString().withMessage('context.platform must be a string'),
    
    body('context.buildNumber')
        .optional()
        .isString().withMessage('context.buildNumber must be a string'),
    
    body('context.commitHash')
        .optional()
        .isString().withMessage('context.commitHash must be a string'),
    
    body('relatedArtifacts')
        .optional()
        .isArray().withMessage('relatedArtifacts must be an array'),
    
    body('metadata')
        .optional()
        .isObject().withMessage('metadata must be an object')
];

/**
 * Validator for bulk log upload
 */
export const uploadBulkLogsValidator = [
    body('logs')
        .exists().withMessage('logs array is required')
        .isArray().withMessage('logs must be an array')
        .custom((logs) => {
            if (logs.length === 0) {
                throw new Error('logs array cannot be empty');
            }
            if (logs.length > 100) {
                throw new Error('Cannot upload more than 100 logs at once');
            }
            return true;
        }),
    
    body('logs.*.teamId')
        .exists().withMessage('Each log must have a teamId')
        .isString().withMessage('teamId must be a string'),
    
    body('logs.*.level')
        .exists().withMessage('Each log must have a level')
        .isIn(Object.values(LogLevel))
        .withMessage(`level must be one of: ${Object.values(LogLevel).join(', ')}`),
    
    body('logs.*.message')
        .exists().withMessage('Each log must have a message')
        .isString().withMessage('message must be a string'),
    
    body('logs.*.artifactType')
        .exists().withMessage('Each log must have an artifactType')
        .isIn(Object.values(ArtifactType))
        .withMessage(`artifactType must be one of: ${Object.values(ArtifactType).join(', ')}`),
    
    body('logs.*.artifactData')
        .exists().withMessage('Each log must have artifactData')
];

/**
 * Validator for query logs
 */
export const queryLogsValidator = [
    query('teamId')
        .exists().withMessage('teamId is required')
        .isString().withMessage('teamId must be a string'),
    
    query('testRunId')
        .optional()
        .isString().withMessage('testRunId must be a string'),
    
    query('failureId')
        .optional()
        .isString().withMessage('failureId must be a string'),
    
    query('artifactType')
        .optional()
        .isIn(Object.values(ArtifactType))
        .withMessage(`artifactType must be one of: ${Object.values(ArtifactType).join(', ')}`),
    
    query('level')
        .optional()
        .isIn(Object.values(LogLevel))
        .withMessage(`level must be one of: ${Object.values(LogLevel).join(', ')}`),
    
    query('processingStatus')
        .optional()
        .isIn(['pending', 'processing', 'completed', 'failed'])
        .withMessage('processingStatus must be one of: pending, processing, completed, failed'),
    
    query('testName')
        .optional()
        .isString().withMessage('testName must be a string'),
    
    query('testSuite')
        .optional()
        .isString().withMessage('testSuite must be a string'),
    
    query('startDate')
        .optional()
        .isISO8601().withMessage('startDate must be a valid ISO 8601 date'),
    
    query('endDate')
        .optional()
        .isISO8601().withMessage('endDate must be a valid ISO 8601 date'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 1000 }).withMessage('limit must be between 1 and 1000'),
    
    query('skip')
        .optional()
        .isInt({ min: 0 }).withMessage('skip must be a non-negative integer')
];

/**
 * Validator for getting log by ID
 */
export const getLogByIdValidator = [
    query('teamId')
        .exists().withMessage('teamId is required')
        .isString().withMessage('teamId must be a string')
];

/**
 * Validator for update processing status
 */
export const updateProcessingStatusValidator = [
    body('teamId')
        .exists().withMessage('teamId is required')
        .isString().withMessage('teamId must be a string'),
    
    body('status')
        .exists().withMessage('status is required')
        .isIn(['pending', 'processing', 'completed', 'failed'])
        .withMessage('status must be one of: pending, processing, completed, failed'),
    
    body('error')
        .optional()
        .isString().withMessage('error must be a string')
];

/**
 * Validator for update classification
 */
export const updateClassificationValidator = [
    body('teamId')
        .exists().withMessage('teamId is required')
        .isString().withMessage('teamId must be a string'),
    
    body('classification')
        .exists().withMessage('classification is required')
        .isObject().withMessage('classification must be an object'),
    
    body('classification.isDefect')
        .exists().withMessage('classification.isDefect is required')
        .isBoolean().withMessage('classification.isDefect must be a boolean'),
    
    body('classification.defectType')
        .optional()
        .isString().withMessage('classification.defectType must be a string'),
    
    body('classification.confidence')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('classification.confidence must be one of: low, medium, high'),
    
    body('classification.severity')
        .optional()
        .isIn(Object.values(Severity))
        .withMessage(`classification.severity must be one of: ${Object.values(Severity).join(', ')}`)
];

// Export default for backward compatibility
export default uploadLogValidator;