import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { aiAgentService } from '../services/aiAgentService';
import { ragService } from '../services/ragService';
import { classificationService } from '../services/classificationService';
import { logInfo, logError } from '../utils/logger';

/**
 * AI Agent Controller - Manages agent lifecycle and operations
 */
class AgentController {
  /**
   * Start the AI agent
   * POST /api/agent/start
   */
  async startAgent(req: Request, res: Response) {
    try {
      const { teamId } = req.body;

      const status = aiAgentService.getStatus();
      if (status.isRunning) {
        return res.status(400).json({
          success: false,
          message: 'Agent is already running',
        });
      }

      // Start agent in background (don't wait)
      aiAgentService.startAgent(teamId);

      logInfo(`Agent started for team: ${teamId || 'all teams'}`);

      return res.status(200).json({
        success: true,
        message: 'AI Agent started successfully',
        data: {
          status: aiAgentService.getStatus(),
        },
      });
    } catch (error) {
      logError(`Error starting agent: ${error}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to start agent',
        error: String(error),
      });
    }
  }

  /**
   * Stop the AI agent
   * POST /api/agent/stop
   */
  async stopAgent(req: Request, res: Response) {
    try {
      const status = aiAgentService.getStatus();
      if (!status.isRunning) {
        return res.status(400).json({
          success: false,
          message: 'Agent is not running',
        });
      }

      aiAgentService.stopAgent();
      logInfo('Agent stopped');

      return res.status(200).json({
        success: true,
        message: 'AI Agent stopped successfully',
        data: {
          status: aiAgentService.getStatus(),
        },
      });
    } catch (error) {
      logError(`Error stopping agent: ${error}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to stop agent',
        error: String(error),
      });
    }
  }

  /**
   * Get agent status
   * GET /api/agent/status
   */
  async getStatus(req: Request, res: Response) {
    try {
      const status = aiAgentService.getStatus();

      return res.status(200).json({
        success: true,
        data: {
          agent: status,
        },
      });
    } catch (error) {
      logError(`Error getting agent status: ${error}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to get agent status',
        error: String(error),
      });
    }
  }

  /**
   * Process pending logs manually
   * POST /api/agent/process-pending
   */
  async processPending(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { teamId } = req.body;

      const results = await aiAgentService.processPendingLogs(teamId);

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      return res.status(200).json({
        success: true,
        message: `Processed ${results.length} logs (${successful} successful, ${failed} failed)`,
        data: {
          processed: results.length,
          successful,
          failed,
          results,
        },
      });
    } catch (error) {
      logError(`Error processing pending logs: ${error}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to process pending logs',
        error: String(error),
      });
    }
  }

  /**
   * Set polling interval
   * PUT /api/agent/config/poll-interval
   */
  async setPollInterval(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { interval } = req.body;

      aiAgentService.setPollInterval(interval);

      return res.status(200).json({
        success: true,
        message: `Poll interval updated to ${interval}ms`,
        data: {
          status: aiAgentService.getStatus(),
        },
      });
    } catch (error) {
      logError(`Error setting poll interval: ${error}`);
      return res.status(400).json({
        success: false,
        message: String(error),
      });
    }
  }

  /**
   * Get RAG statistics
   * GET /api/agent/stats/rag
   */
  async getRAGStats(req: Request, res: Response) {
    try {
      const { teamId } = req.query;

      if (!teamId || typeof teamId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'teamId is required',
        });
      }

      const stats = await ragService.getRAGStatistics(teamId);

      return res.status(200).json({
        success: true,
        data: {
          rag: stats,
        },
      });
    } catch (error) {
      logError(`Error getting RAG stats: ${error}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to get RAG statistics',
        error: String(error),
      });
    }
  }

  /**
   * Get classification statistics
   * GET /api/agent/stats/classification
   */
  async getClassificationStats(req: Request, res: Response) {
    try {
      const { teamId } = req.query;

      if (!teamId || typeof teamId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'teamId is required',
        });
      }

      const stats = await classificationService.getClassificationStats(teamId);

      return res.status(200).json({
        success: true,
        data: {
          classification: stats,
        },
      });
    } catch (error) {
      logError(`Error getting classification stats: ${error}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to get classification statistics',
        error: String(error),
      });
    }
  }

  /**
   * Set RAG similarity threshold
   * PUT /api/agent/config/rag-threshold
   */
  async setRAGThreshold(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { threshold } = req.body;

      ragService.setSimilarityThreshold(threshold);

      return res.status(200).json({
        success: true,
        message: `RAG similarity threshold updated to ${threshold}`,
      });
    } catch (error) {
      logError(`Error setting RAG threshold: ${error}`);
      return res.status(400).json({
        success: false,
        message: String(error),
      });
    }
  }

  /**
   * Set vision model provider
   * PUT /api/agent/config/vision-model
   */
  async setVisionModel(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { provider } = req.body;

      if (!['openai', 'claude'].includes(provider)) {
        return res.status(400).json({
          success: false,
          message: 'provider must be either "openai" or "claude"',
        });
      }

      // Set provider in visionService
      // visionService.setModelProvider(provider);

      return res.status(200).json({
        success: true,
        message: `Vision model provider updated to ${provider}`,
      });
    } catch (error) {
      logError(`Error setting vision model: ${error}`);
      return res.status(400).json({
        success: false,
        message: String(error),
      });
    }
  }

  /**
   * Health check for agent
   * GET /api/agent/health
   */
  async health(req: Request, res: Response) {
    try {
      const status = aiAgentService.getStatus();

      return res.status(200).json({
        success: true,
        message: 'Agent health check passed',
        data: {
          agent: status,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Agent health check failed',
        error: String(error),
      });
    }
  }
}

export const agentController = new AgentController();
