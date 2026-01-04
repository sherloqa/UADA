import axios from 'axios';
import { logInfo, logError, logDebug } from '../utils/logger';

interface ClassificationResult {
  isDefect: boolean;
  defectType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: 'low' | 'medium' | 'high';
  rootCauseAnalysis: string;
  recommendations: string[];
  isFlaky: boolean;
  flakinessScore: number;
  timestamp: Date;
}

/**
 * Classification Service - Analyzes defects and classifies them
 * 
 * Determines:
 * - Is it actually a defect or flaky test?
 * - What type of defect (UI bug, backend error, network issue, etc.)?
 * - How severe is it?
 * - What's the likely root cause?
 * - What remediation actions should be taken?
 */
class ClassificationService {
  private defectTypes = [
    'ui_bug',
    'api_error',
    'backend_error',
    'network_issue',
    'timeout',
    'assertion_failure',
    'environment_issue',
    'flaky_test',
    'data_issue',
    'authentication_error',
  ];

  private severityLevels = ['low', 'medium', 'high', 'critical'];

  /**
   * Classify a defect based on analysis and RAG context
   */
  async classifyDefect(
    log: any,
    analysis: any,
    ragContext: any
  ): Promise<ClassificationResult> {
    try {
      logDebug(`Classifying defect for log ${log._id}`);

      // Analyze defect characteristics
      const defectType = this.determineDefectType(log, analysis);
      const severity = this.determineSeverity(log, analysis, defectType);
      const isFlaky = await this.assessFlakiness(log, ragContext);
      const rootCause = this.analyzeRootCause(log, analysis, ragContext);
      const recommendations = this.generateRecommendations(
        defectType,
        severity,
        rootCause
      );

      const classification: ClassificationResult = {
        isDefect: !isFlaky,
        defectType,
        severity,
        confidence: this.calculateConfidence(log, analysis),
        rootCauseAnalysis: rootCause,
        recommendations,
        isFlaky,
        flakinessScore: await this.calculateFlakinessScore(log, ragContext),
        timestamp: new Date(),
      };

      logDebug(
        `Defect classified: ${defectType} (severity: ${severity}, flaky: ${isFlaky})`
      );

      return classification;
    } catch (error) {
      logError(`Error classifying defect: ${error}`);
      throw error;
    }
  }

  /**
   * Determine defect type based on artifact analysis
   */
  private determineDefectType(log: any, analysis: any): string {
    // Rule-based classification
    const artifactType = log.artifactType;
    const message = log.message.toLowerCase();

    // Check analysis results
    if (analysis.statusCategory === 'server_error') {
      return 'api_error';
    }

    if (analysis.statusCategory === 'client_error') {
      return 'assertion_failure';
    }

    if (analysis.errorType === 'TimeoutError' || message.includes('timeout')) {
      return 'timeout';
    }

    if (analysis.errorType === 'NetworkError' || message.includes('network')) {
      return 'network_issue';
    }

    if (
      artifactType === 'backend_log' ||
      analysis.stackTrace ||
      message.includes('exception')
    ) {
      return 'backend_error';
    }

    if (artifactType === 'screenshot' || analysis.visionAnalysis) {
      return 'ui_bug';
    }

    if (message.includes('authentication') || message.includes('auth')) {
      return 'authentication_error';
    }

    if (message.includes('data') || message.includes('null')) {
      return 'data_issue';
    }

    return 'unknown_error';
  }

  /**
   * Determine severity level
   */
  private determineSeverity(
    log: any,
    analysis: any,
    defectType: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    let severityScore = 0;

    // Base severity from log level
    const levelMap: Record<string, number> = {
      critical: 40,
      error: 30,
      warn: 20,
      info: 10,
      debug: 5,
    };
    severityScore += levelMap[log.level] || 15;

    // Increase severity based on defect type
    if (
      defectType === 'backend_error' ||
      defectType === 'authentication_error'
    ) {
      severityScore += 20;
    } else if (defectType === 'api_error') {
      severityScore += 15;
    } else if (defectType === 'timeout') {
      severityScore += 10;
    }

    // Check for critical indicators
    if (log.context?.environment === 'production') {
      severityScore += 20;
    }

    if (analysis.failedRequests?.length > 0) {
      severityScore += analysis.failedRequests.length * 5;
    }

    if (analysis.stackTrace?.includes('critical')) {
      severityScore += 15;
    }

    // Map score to severity
    if (severityScore >= 60) return 'critical';
    if (severityScore >= 40) return 'high';
    if (severityScore >= 25) return 'medium';
    return 'low';
  }

  /**
   * Assess if this is a flaky test
   */
  private async assessFlakiness(log: any, ragContext: any): Promise<boolean> {
    try {
      // Check RAG context for similar flaky issues
      const flakyMatches = ragContext.similarIssues.filter(
        (issue: any) =>
          issue.classification?.isFlaky || issue.classification?.defectType === 'flaky_test'
      );

      const flakinessRate = flakyMatches.length / Math.max(ragContext.similarIssues.length, 1);

      // If > 50% of similar issues are flaky, this likely is too
      if (flakinessRate > 0.5) {
        return true;
      }

      // Check for common flaky patterns
      const message = log.message.toLowerCase();
      const flakyPatterns = [
        'timeout',
        'intermittent',
        'occasionally',
        'race condition',
        'random',
        'sometimes',
      ];

      const hasFlakeyPattern = flakyPatterns.some(pattern =>
        message.includes(pattern)
      );

      if (hasFlakeyPattern) {
        return true;
      }

      return false;
    } catch (error) {
      logError(`Error assessing flakiness: ${error}`);
      return false;
    }
  }

  /**
   * Calculate flakiness score (0-1)
   */
  private async calculateFlakinessScore(
    log: any,
    ragContext: any
  ): Promise<number> {
    try {
      // Count how many times this test has failed
      const similarIssues = ragContext.similarIssues || [];
      const totalMatches = ragContext.totalMatches || 1;

      // If we've seen similar failures before, increase flakiness score
      const occurrenceRate = Math.min(similarIssues.length / totalMatches, 1);

      // Weight by recency (logs we've seen recently are more likely flaky)
      let score = occurrenceRate;

      if (log.metadata?.retryCount > 0) {
        score += log.metadata.retryCount * 0.1;
      }

      return Math.min(score, 1);
    } catch (error) {
      logError(`Error calculating flakiness score: ${error}`);
      return 0;
    }
  }

  /**
   * Analyze root cause
   */
  private analyzeRootCause(log: any, analysis: any, ragContext: any): string {
    const causes: string[] = [];

    // Analyze from different artifact types
    if (analysis.errorType) {
      causes.push(`Error Type: ${analysis.errorType}`);
    }

    if (analysis.statusCategory === 'server_error') {
      causes.push('Server returned 5xx error');
    }

    if (analysis.stackTrace) {
      const firstLine = analysis.stackTrace.split('\n')[0];
      if (firstLine) {
        causes.push(`Stack trace indicates: ${firstLine}`);
      }
    }

    if (analysis.consoleErrors && analysis.consoleErrors.length > 0) {
      causes.push(`Console error: ${analysis.consoleErrors[0]}`);
    }

    if (analysis.failedRequests && analysis.failedRequests.length > 0) {
      causes.push(
        `API call failed: ${analysis.failedRequests[0].request?.url}`
      );
    }

    if (analysis.visionAnalysis?.suggestedDefectType) {
      causes.push(`Visual issue: ${analysis.visionAnalysis.suggestedDefectType}`);
    }

    // Check if similar issues have known root causes
    const similarWithCause = ragContext.similarIssues.filter(
      (issue: any) =>
        issue.classification?.rootCauseAnalysis
    );

    if (similarWithCause.length > 0) {
      causes.push(
        `Similar issue root cause: ${similarWithCause[0].classification?.rootCauseAnalysis}`
      );
    }

    if (causes.length === 0) {
      return 'Unable to determine root cause - manual investigation required';
    }

    return causes.join('; ');
  }

  /**
   * Generate remediation recommendations
   */
  private generateRecommendations(
    defectType: string,
    severity: string,
    rootCause: string
  ): string[] {
    const recommendations: string[] = [];

    // General recommendations
    if (severity === 'critical') {
      recommendations.push('URGENT: Escalate to development team immediately');
      recommendations.push('Consider rolling back recent changes if in production');
    }

    // Defect-type specific recommendations
    switch (defectType) {
      case 'ui_bug':
        recommendations.push('Review UI layout and CSS changes');
        recommendations.push('Test on multiple browsers and screen sizes');
        recommendations.push('Verify DOM element selectors');
        break;

      case 'api_error':
        recommendations.push('Check API endpoint status and availability');
        recommendations.push('Verify request/response format');
        recommendations.push('Review API authentication tokens');
        break;

      case 'backend_error':
        recommendations.push('Review server logs for stack trace');
        recommendations.push('Check database connectivity');
        recommendations.push('Verify environment variables and configuration');
        break;

      case 'timeout':
        recommendations.push('Increase timeout threshold');
        recommendations.push('Optimize slow operations');
        recommendations.push('Check network latency');
        break;

      case 'network_issue':
        recommendations.push('Verify network connectivity');
        recommendations.push('Check firewall and proxy settings');
        recommendations.push('Review network traces');
        break;

      case 'authentication_error':
        recommendations.push('Refresh authentication tokens');
        recommendations.push('Verify user credentials and permissions');
        recommendations.push('Check authentication service status');
        break;

      case 'data_issue':
        recommendations.push('Verify test data exists and is valid');
        recommendations.push('Check database state');
        recommendations.push('Review data transformation logic');
        break;

      case 'flaky_test':
        recommendations.push('Add explicit waits and retry logic');
        recommendations.push('Review test timing and dependencies');
        recommendations.push('Add logging for debugging');
        break;
    }

    recommendations.push('Create ticket for tracking and monitoring');

    return recommendations;
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(log: any, analysis: any): 'low' | 'medium' | 'high' {
    let confidence = 0.5; // Base confidence

    // Increase with detailed analysis
    if (analysis.stackTrace) confidence += 0.2;
    if (analysis.errorType) confidence += 0.1;
    if (analysis.visionAnalysis) confidence += 0.15;
    if (analysis.failedRequests?.length > 0) confidence += 0.1;

    // Increase with rich context
    if (log.context?.testName) confidence += 0.05;
    if (log.context?.environment) confidence += 0.05;

    confidence = Math.min(confidence, 1);

    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Get classification statistics for a team
   */
  async getClassificationStats(teamId: string): Promise<any> {
    try {
      const Log = (await import('../models/Log')).default;
      const classifications = await Log.aggregate([
        {
          $match: {
            teamId,
            'classification.isDefect': { $exists: true },
          },
        },
        {
          $group: {
            _id: '$classification.defectType',
            count: { $sum: 1 },
            avgSeverity: {
              $avg: {
                $cond: [
                  { $eq: ['$classification.severity', 'critical'] },
                  4,
                  {
                    $cond: [
                      { $eq: ['$classification.severity', 'high'] },
                      3,
                      {
                        $cond: [
                          { $eq: ['$classification.severity', 'medium'] },
                          2,
                          1,
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      ]);

      return {
        totalClassified: classifications.reduce((sum: number, c: any) => sum + c.count, 0),
        byDefectType: classifications,
      };
    } catch (error) {
      logError(`Error getting classification stats: ${error}`);
      throw error;
    }
  }
}

export const classificationService = new ClassificationService();
