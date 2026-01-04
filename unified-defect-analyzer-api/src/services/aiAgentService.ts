import Log from '../models/Log';
import { logInfo, logError, logDebug } from '../utils/logger';
import { ragService } from './ragService';
import { visionService } from './visionService';
import { classificationService } from './classificationService';

interface ProcessingResult {
  logId: string;
  success: boolean;
  classification?: any;
  error?: string;
  processingTime?: number;
}

/**
 * AI Agent Service - Orchestrates AI-powered defect analysis
 * 
 * Workflow:
 * 1. Poll for pending logs
 * 2. Analyze based on artifact type
 * 3. Perform RAG retrieval for context
 * 4. Classify defect
 * 5. Update log with classification
 */
class AIAgentService {
  private isRunning = false;
  private pollInterval = 5000; // 5 seconds

  /**
   * Start the AI agent polling loop
   */
  async startAgent(teamId?: string) {
    if (this.isRunning) {
      logInfo('Agent is already running');
      return;
    }

    this.isRunning = true;
    logInfo(`AI Agent started - polling every ${this.pollInterval}ms`);

    while (this.isRunning) {
      try {
        await this.processPendingLogs(teamId);
      } catch (error) {
        logError(`Error in agent loop: ${error}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, this.pollInterval));
    }
  }

  /**
   * Stop the AI agent
   */
  stopAgent() {
    this.isRunning = false;
    logInfo('AI Agent stopped');
  }

  /**
   * Process all pending logs for a team
   */
  async processPendingLogs(teamId?: string): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];

    try {
      // Query pending logs
      const query: any = { processingStatus: 'pending' };
      if (teamId) {
        query.teamId = teamId;
      }

      const pendingLogs = await Log.find(query).limit(10); // Process 10 at a time

      if (pendingLogs.length === 0) {
        logDebug('No pending logs to process');
        return results;
      }

      logInfo(`Found ${pendingLogs.length} pending logs for processing`);

      // Process each log
      for (const log of pendingLogs) {
        const result = await this.processLog(log);
        results.push(result);
      }

      return results;
    } catch (error) {
      logError(`Error processing pending logs: ${error}`);
      throw error;
    }
  }

  /**
   * Process a single log through the analysis pipeline
   */
  async processLog(log: any): Promise<ProcessingResult> {
    const startTime = Date.now();
    const result: ProcessingResult = {
      logId: log._id.toString(),
      success: false,
    };

    try {
      logInfo(`Processing log ${log._id} (type: ${log.artifactType})`);

      // Step 1: Mark as processing
      await Log.findByIdAndUpdate(log._id, {
        processingStatus: 'processing',
      });

      // Step 2: Analyze based on artifact type
      let analysis: any = {};

      switch (log.artifactType) {
        case 'screenshot':
          analysis = await this.analyzeScreenshot(log);
          break;
        case 'har':
          analysis = await this.analyzeHAR(log);
          break;
        case 'backend_log':
          analysis = await this.analyzeBackendLog(log);
          break;
        case 'ui_log':
          analysis = await this.analyzeUILog(log);
          break;
        case 'api_log':
          analysis = await this.analyzeAPILog(log);
          break;
        default:
          analysis = await this.analyzeGenericLog(log);
      }

      // Step 3: Retrieve context from THREE sources (Dual Vector RAG)
      // - Current logs
      // - Historic defects 
      // - Test execution history
      const ragContext = await ragService.retrieveDualVectorContext(
        log.message,
        log.artifactType,
        log.teamId,
        log.classification?.defectType
      );

      logDebug(
        `Dual Vector RAG retrieved ${ragContext.similarLogs.length} logs, ` +
        `${ragContext.historicMatches.length} historic defects, ` +
        `${ragContext.testMatches.length} test patterns`
      );

      // Log enriched context for debugging
      if (ragContext.enrichedContext) {
        logDebug(`Enriched Context:\n${ragContext.enrichedContext}`);
      }

      // Step 4: Classify the defect with enhanced context
      const classification = await classificationService.classifyDefect(
        log,
        analysis,
        ragContext
      );

      // Step 5: Update log with classification
      await Log.findByIdAndUpdate(log._id, {
        classification,
        processingStatus: 'completed',
      });

      result.success = true;
      result.classification = classification;
      result.processingTime = Date.now() - startTime;

      logInfo(`Successfully processed log ${log._id} in ${result.processingTime}ms`);

      return result;
    } catch (error) {
      logError(`Error processing log ${log._id}: ${error}`);

      // Update log as failed
      try {
        await Log.findByIdAndUpdate(log._id, {
          processingStatus: 'failed',
          processingError: String(error),
        });
      } catch (updateError) {
        logError(`Failed to update log status: ${updateError}`);
      }

      result.success = false;
      result.error = String(error);
      result.processingTime = Date.now() - startTime;

      return result;
    }
  }

  /**
   * Analyze screenshot artifacts
   */
  private async analyzeScreenshot(log: any) {
    logDebug(`Analyzing screenshot for log ${log._id}`);

    const analysis: any = {
      type: 'screenshot',
      timestamp: new Date(),
    };

    try {
      // Use vision service to analyze the screenshot
      if (log.artifactData?.screenshot || log.artifactData?.imageBase64) {
        const imageData =
          log.artifactData.screenshot || log.artifactData.imageBase64;
        const visionAnalysis = await visionService.analyzeScreenshot(imageData);
        analysis.visionAnalysis = visionAnalysis;
      }

      // Extract UI errors from context
      if (log.artifactData?.domSnapshot) {
        analysis.uiElements = this.extractUIErrors(log.artifactData.domSnapshot);
      }

      if (log.artifactData?.consoleErrors) {
        analysis.consoleErrors = log.artifactData.consoleErrors;
      }

      return analysis;
    } catch (error) {
      logError(`Error analyzing screenshot: ${error}`);
      throw error;
    }
  }

  /**
   * Analyze HAR file (network capture)
   */
  private async analyzeHAR(log: any) {
    logDebug(`Analyzing HAR file for log ${log._id}`);

    const analysis: any = {
      type: 'har',
      timestamp: new Date(),
    };

    try {
      if (log.artifactData?.log?.entries) {
        const entries = log.artifactData.log.entries;

        // Extract failed requests
        analysis.failedRequests = entries.filter(
          (e: any) => e.response?.status >= 400
        );

        // Extract response times
        analysis.responseMetrics = entries.map((e: any) => ({
          url: e.request?.url,
          status: e.response?.status,
          time: e.time,
        }));

        // Analyze error patterns
        analysis.errorPatterns = this.analyzeErrorPatterns(entries);
      }

      return analysis;
    } catch (error) {
      logError(`Error analyzing HAR: ${error}`);
      throw error;
    }
  }

  /**
   * Analyze backend logs
   */
  private async analyzeBackendLog(log: any) {
    logDebug(`Analyzing backend log for log ${log._id}`);

    const analysis: any = {
      type: 'backend_log',
      timestamp: new Date(),
    };

    try {
      if (log.artifactData?.stackTrace) {
        analysis.stackTrace = log.artifactData.stackTrace;
        analysis.errorLines = this.extractStackTraceLines(
          log.artifactData.stackTrace
        );
      }

      if (log.artifactData?.errorMessage) {
        analysis.errorMessage = log.artifactData.errorMessage;
        analysis.errorType = this.extractErrorType(log.artifactData.errorMessage);
      }

      return analysis;
    } catch (error) {
      logError(`Error analyzing backend log: ${error}`);
      throw error;
    }
  }

  /**
   * Analyze UI logs
   */
  private async analyzeUILog(log: any) {
    logDebug(`Analyzing UI log for log ${log._id}`);

    const analysis: any = {
      type: 'ui_log',
      timestamp: new Date(),
    };

    try {
      if (log.artifactData?.consoleErrors) {
        analysis.consoleErrors = log.artifactData.consoleErrors;
        analysis.errorPatterns = this.analyzeErrorPatterns(
          log.artifactData.consoleErrors
        );
      }

      if (log.artifactData?.screenshot) {
        const visionAnalysis = await visionService.analyzeScreenshot(
          log.artifactData.screenshot
        );
        analysis.visionAnalysis = visionAnalysis;
      }

      return analysis;
    } catch (error) {
      logError(`Error analyzing UI log: ${error}`);
      throw error;
    }
  }

  /**
   * Analyze API logs
   */
  private async analyzeAPILog(log: any) {
    logDebug(`Analyzing API log for log ${log._id}`);

    const analysis: any = {
      type: 'api_log',
      timestamp: new Date(),
    };

    try {
      if (log.artifactData?.statusCode) {
        analysis.statusCode = log.artifactData.statusCode;
        analysis.statusCategory = this.categorizeHTTPStatus(
          log.artifactData.statusCode
        );
      }

      if (log.artifactData?.endpoint) {
        analysis.endpoint = log.artifactData.endpoint;
      }

      if (log.artifactData?.responseBody) {
        analysis.responseAnalysis = this.analyzeAPIResponse(
          log.artifactData.responseBody
        );
      }

      return analysis;
    } catch (error) {
      logError(`Error analyzing API log: ${error}`);
      throw error;
    }
  }

  /**
   * Analyze generic/unknown artifact types
   */
  private async analyzeGenericLog(log: any) {
    logDebug(`Analyzing generic log for log ${log._id}`);

    const analysis: any = {
      type: 'generic',
      timestamp: new Date(),
      message: log.message,
      level: log.level,
    };

    try {
      // Extract keywords from message
      analysis.keywords = this.extractKeywords(log.message);

      return analysis;
    } catch (error) {
      logError(`Error analyzing generic log: ${error}`);
      throw error;
    }
  }

  /**
   * Helper: Extract UI element errors from DOM snapshot
   */
  private extractUIErrors(domSnapshot: string): string[] {
    // Simple pattern matching for common UI errors
    const patterns = [
      /element.*not.*found/gi,
      /timeout.*waiting/gi,
      /not.*visible/gi,
      /not.*clickable/gi,
    ];

    const errors: string[] = [];
    patterns.forEach(pattern => {
      const matches = domSnapshot.match(pattern);
      if (matches) {
        errors.push(...matches);
      }
    });

    return errors;
  }

  /**
   * Helper: Analyze error patterns in a list
   */
  private analyzeErrorPatterns(items: any[]): { pattern: string; count: number }[] {
    const patterns = new Map<string, number>();

    items.forEach(item => {
      let pattern = '';
      if (typeof item === 'string') {
        pattern = item.split(':')[0]; // Get error type before colon
      } else if (item.message) {
        pattern = item.message.split(':')[0];
      }

      if (pattern) {
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
      }
    });

    return Array.from(patterns.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Helper: Extract error lines from stack trace
   */
  private extractStackTraceLines(stackTrace: string): string[] {
    return stackTrace
      .split('\n')
      .filter(line => line.includes('at '))
      .slice(0, 5); // Top 5 stack frames
  }

  /**
   * Helper: Extract error type from error message
   */
  private extractErrorType(errorMessage: string): string {
    const match = errorMessage.match(/^(\w+)\s*:/);
    return match ? match[1] : 'Unknown';
  }

  /**
   * Helper: Categorize HTTP status codes
   */
  private categorizeHTTPStatus(status: number): string {
    if (status < 300) return 'success';
    if (status < 400) return 'redirect';
    if (status < 500) return 'client_error';
    return 'server_error';
  }

  /**
   * Helper: Analyze API response
   */
  private analyzeAPIResponse(responseBody: any): any {
    return {
      hasError: responseBody?.error !== undefined,
      errorMessage: responseBody?.error?.message,
      hasData: responseBody?.data !== undefined,
      dataType: typeof responseBody?.data,
    };
  }

  /**
   * Helper: Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const commonWords =
      /\b(the|a|an|and|or|but|in|on|at|to|for|of|is|are|was|were)\b/gi;
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => !commonWords.test(word) && word.length > 3)
      .slice(0, 10);
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      pollInterval: this.pollInterval,
    };
  }

  /**
   * Set poll interval (in milliseconds)
   */
  setPollInterval(interval: number) {
    if (interval < 1000) {
      throw new Error('Poll interval must be at least 1000ms');
    }
    this.pollInterval = interval;
    logInfo(`Poll interval updated to ${interval}ms`);
  }
}

export const aiAgentService = new AIAgentService();
