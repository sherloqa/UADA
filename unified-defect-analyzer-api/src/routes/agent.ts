import { Router } from 'express';
import { body, query } from 'express-validator';
import { agentController } from '../controllers/agentController';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * Agent Management Routes
 */

/**
 * Start the AI agent
 * POST /api/agent/start
 */
router.post(
  '/start',
  body('teamId').optional().isString(),
  validateRequest,
  (req: any, res: any) => agentController.startAgent(req, res)
);

/**
 * Stop the AI agent
 * POST /api/agent/stop
 */
router.post('/stop', (req: any, res: any) => agentController.stopAgent(req, res));

/**
 * Get agent status
 * GET /api/agent/status
 */
router.get('/status', (req: any, res: any) => agentController.getStatus(req, res));

/**
 * Health check
 * GET /api/agent/health
 */
router.get('/health', (req, res) => agentController.health(req, res));

/**
 * Process pending logs manually
 * POST /api/agent/process-pending
 */
router.post(
  '/process-pending',
  body('teamId').optional().isString(),
  validateRequest,
  (req: any, res: any) => agentController.processPending(req, res)
);

/**
 * Configuration Routes
 */

/**
 * Set polling interval
 * PUT /api/agent/config/poll-interval
 */
router.put(
  '/config/poll-interval',
  body('interval')
    .isInt({ min: 1000, max: 3600000 })
    .withMessage('interval must be between 1000ms and 1 hour'),
  validateRequest,
  (req: any, res: any) => agentController.setPollInterval(req, res)
);

/**
 * Set RAG similarity threshold
 * PUT /api/agent/config/rag-threshold
 */
router.put(
  '/config/rag-threshold',
  body('threshold')
    .isFloat({ min: 0, max: 1 })
    .withMessage('threshold must be between 0 and 1'),
  validateRequest,
  (req: any, res: any) => agentController.setRAGThreshold(req, res)
);

/**
 * Set vision model provider
 * PUT /api/agent/config/vision-model
 */
router.put(
  '/config/vision-model',
  body('provider')
    .isIn(['openai', 'claude'])
    .withMessage('provider must be either "openai" or "claude"'),
  validateRequest,
  (req: any, res: any) => agentController.setVisionModel(req, res)
);

/**
 * Statistics Routes
 */

/**
 * Get RAG statistics
 * GET /api/agent/stats/rag
 */
router.get(
  '/stats/rag',
  query('teamId').notEmpty().withMessage('teamId is required'),
  validateRequest,
  (req: any, res: any) => agentController.getRAGStats(req, res)
);

/**
 * Get classification statistics
 * GET /api/agent/stats/classification
 */
router.get(
  '/stats/classification',
  query('teamId').notEmpty().withMessage('teamId is required'),
  validateRequest,
  (req: any, res: any) => agentController.getClassificationStats(req, res)
);

export default router;
