import axios from 'axios';
import Log from '../models/Log';
import HistoricDefect from '../models/HistoricDefect';
import TestExecution from '../models/TestExecution';
import { logInfo, logError, logDebug } from '../utils/logger';

interface SimilarIssue {
  logId: string;
  message: string;
  classification?: any;
  similarity: number;
  source?: 'current_log' | 'historic_defect' | 'test_execution';
}

interface HistoricDefectMatch {
  defectId: string;
  title: string;
  rootCause: string;
  resolution: string;
  similarity: number;
  severity: string;
  occurrenceCount: number;
}

interface TestExecutionMatch {
  executionId: string;
  testName: string;
  failureMessage?: string;
  similarity: number;
  flakinessScore: number;
  passRate: number;
}

interface DualVectorRAGContext {
  query: string;
  // From current logs
  similarLogs: SimilarIssue[];
  // From historic defects
  historicMatches: HistoricDefectMatch[];
  // From test executions
  testMatches: TestExecutionMatch[];
  // Summary
  documentCount: number;
  totalMatches: number;
  enrichedContext: string;
}

interface RAGContext {
  query: string;
  similarIssues: SimilarIssue[];
  documentCount: number;
  totalMatches: number;
}

/**
 * Dual Vector RAG (Retrieval-Augmented Generation) Service
 * 
 * Retrieves context from THREE sources:
 * 1. Current logs - Recent log entries with embeddings
 * 2. Historic defects - Known defect patterns with root causes and resolutions
 * 3. Test execution history - Past test runs to identify flakiness and patterns
 * 
 * Provides context-aware defect analysis using vector embeddings
 */
class RAGService {
  private embeddingModel = 'text-embedding-3-small'; // OpenAI embeddings
  private similarityThreshold = 0.7; // Cosine similarity threshold
  private maxResults = 5; // Max similar issues to return
  
  // Weights for different sources (used in ranking)
  private weights = {
    currentLog: 1.0,
    historicDefect: 1.5, // Give more weight to known defects
    testExecution: 1.2, // Test patterns are also important
  };

  /**
   * Retrieve from both historic defects and test executions (Dual Vector RAG)
   */
  async retrieveDualVectorContext(
    query: string,
    artifactType: string,
    teamId: string,
    defectType?: string
  ): Promise<DualVectorRAGContext> {
    try {
      logDebug(
        `Dual Vector RAG retrieval for: "${query}" (type: ${artifactType}, team: ${teamId})`
      );

      // Get embedding for the query
      const queryEmbedding = await this.getEmbedding(query);

      // Search all three sources in parallel
      const [similarLogs, historicMatches, testMatches] = await Promise.all([
        this.searchSimilarLogs(teamId, artifactType, query),
        this.searchHistoricDefects(teamId, query, defectType),
        this.searchTestExecutions(teamId, query),
      ]);

      // Rank by semantic similarity
      const rankedLogs = await this.rankBySemanticSimilarity(
        queryEmbedding,
        similarLogs,
        query
      );

      const rankedHistoric = await this.rankHistoricDefectSimilarity(
        queryEmbedding,
        historicMatches,
        query
      );

      const rankedTests = await this.rankTestExecutionSimilarity(
        queryEmbedding,
        testMatches,
        query
      );

      // Filter and limit
      const topLogs = rankedLogs
        .filter(issue => issue.similarity >= this.similarityThreshold)
        .slice(0, this.maxResults)
        .map(issue => ({
          logId: issue._id.toString(),
          message: issue.message,
          classification: issue.classification,
          similarity: issue.similarity,
          source: 'current_log' as const,
        }));

      const topHistoric = rankedHistoric
        .filter(issue => issue.similarity >= this.similarityThreshold)
        .slice(0, this.maxResults);

      const topTests = rankedTests
        .filter(issue => issue.similarity >= this.similarityThreshold)
        .slice(0, this.maxResults);

      // Generate enriched context description
      const enrichedContext = this.generateEnrichedContext(
        topLogs,
        topHistoric,
        topTests
      );

      const context: DualVectorRAGContext = {
        query,
        similarLogs: topLogs,
        historicMatches: topHistoric,
        testMatches: topTests,
        documentCount: topLogs.length + topHistoric.length + topTests.length,
        totalMatches: similarLogs.length + historicMatches.length + testMatches.length,
        enrichedContext,
      };

      logDebug(
        `Dual Vector RAG found ${context.documentCount} matches from ${context.totalMatches} total candidates`
      );

      return context;
    } catch (error) {
      logError(`Error in Dual Vector RAG retrieval: ${error}`);
      return {
        query,
        similarLogs: [],
        historicMatches: [],
        testMatches: [],
        documentCount: 0,
        totalMatches: 0,
        enrichedContext: '',
      };
    }
  }

  /**
   * Retrieve similar issues from past logs (Legacy)
   */
  async retrieveSimilarIssues(
    query: string,
    artifactType: string,
    teamId: string
  ): Promise<RAGContext> {
    try {
      logDebug(
        `RAG retrieval for: "${query}" (type: ${artifactType}, team: ${teamId})`
      );

      // Get embedding for the query
      const queryEmbedding = await this.getEmbedding(query);

      // Search for similar logs in the database
      const similarLogs = await this.searchSimilarLogs(
        teamId,
        artifactType,
        query
      );

      // Score and rank similar issues
      const rankedIssues = await this.rankBySemanticSimilarity(
        queryEmbedding,
        similarLogs,
        query
      );

      // Filter by threshold and limit
      const topMatches = rankedIssues
        .filter(issue => issue.similarity >= this.similarityThreshold)
        .slice(0, this.maxResults)
        .map(issue => ({
          logId: issue._id.toString(),
          message: issue.message,
          classification: issue.classification,
          similarity: issue.similarity,
        }));

      const context: RAGContext = {
        query,
        similarIssues: topMatches,
        documentCount: topMatches.length,
        totalMatches: similarLogs.length,
      };

      logDebug(
        `RAG found ${context.documentCount} similar issues from ${context.totalMatches} candidates`
      );

      return context;
    } catch (error) {
      logError(`Error in RAG retrieval: ${error}`);
      // Return empty context on error instead of throwing
      return {
        query,
        similarIssues: [],
        documentCount: 0,
        totalMatches: 0,
      };
    }
  }

  /**
   * Get vector embedding for text
   */
  async getEmbedding(text: string): Promise<number[]> {
    try {
      // For now, return a simple hash-based embedding
      // In production, use OpenAI or similar API
      return this.simpleEmbedding(text);
    } catch (error) {
      logError(`Error getting embedding: ${error}`);
      throw error;
    }
  }

  /**
   * Search historic defects collection
   */
  private async searchHistoricDefects(
    teamId: string,
    query: string,
    defectType?: string
  ): Promise<any[]> {
    try {
      const filter: any = {
        teamId,
        status: { $in: ['active', 'resolved'] },
      };

      if (defectType) {
        filter.defectType = defectType;
      }

      const results = await HistoricDefect.find(filter)
        .sort({ occurrenceCount: -1, lastOccurred: -1 })
        .limit(20);

      return results;
    } catch (error) {
      logError(`Error searching historic defects: ${error}`);
      return [];
    }
  }

  /**
   * Search test execution history
   */
  private async searchTestExecutions(
    teamId: string,
    query: string
  ): Promise<any[]> {
    try {
      const results = await TestExecution.find({
        teamId,
        status: { $in: ['failed', 'flaky'] },
      })
        .sort({ flakinessScore: -1, timestamp: -1 })
        .limit(20);

      return results;
    } catch (error) {
      logError(`Error searching test executions: ${error}`);
      return [];
    }
  }

  /**
   * Search for similar logs in the database
   */
  private async searchSimilarLogs(
    teamId: string,
    artifactType: string,
    query: string
  ): Promise<any[]> {
    try {
      // Full-text search on message and artifactData
      const searchResults = await Log.find(
        {
          $text: { $search: query },
          teamId,
          artifactType,
          processingStatus: { $in: ['completed', 'failed'] }, // Only use processed logs
        },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(20);

      return searchResults;
    } catch (error) {
      logError(`Error searching similar logs: ${error}`);
      // Fallback to basic query
      return await Log.find({
        teamId,
        artifactType,
        message: { $regex: query, $options: 'i' },
      }).limit(10);
    }
  }

  /**
   * Rank historic defects by semantic similarity
   */
  private async rankHistoricDefectSimilarity(
    queryEmbedding: number[],
    defects: any[],
    query: string
  ): Promise<HistoricDefectMatch[]> {
    // Safety check for undefined or null
    if (!defects || !Array.isArray(defects)) {
      return [];
    }

    const ranked = await Promise.all(
      defects.map(async defect => {
        // Use title as primary embedding source
        const titleEmbedding = defect.titleEmbedding || 
          await this.getEmbedding(defect.title);
        const similarity = this.cosineSimilarity(queryEmbedding, titleEmbedding);
        
        return {
          defectId: defect.defectId,
          title: defect.title,
          rootCause: defect.rootCause,
          resolution: defect.resolution,
          similarity,
          severity: defect.severity,
          occurrenceCount: defect.occurrenceCount,
        };
      })
    );

    return ranked.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Rank test executions by semantic similarity
   */
  private async rankTestExecutionSimilarity(
    queryEmbedding: number[],
    tests: any[],
    query: string
  ): Promise<TestExecutionMatch[]> {
    // Safety check for undefined or null
    if (!tests || !Array.isArray(tests)) {
      return [];
    }

    const ranked = await Promise.all(
      tests.map(async test => {
        const testEmbedding = test.testNameEmbedding || 
          await this.getEmbedding(test.testName);
        const similarity = this.cosineSimilarity(queryEmbedding, testEmbedding);
        
        return {
          executionId: test.executionId,
          testName: test.testName,
          failureMessage: test.failureMessage,
          similarity,
          flakinessScore: test.flakinessScore,
          passRate: test.passRate,
        };
      })
    );

    return ranked.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Generate enriched context description
   */
  private generateEnrichedContext(
    logs: SimilarIssue[],
    historic: HistoricDefectMatch[],
    tests: TestExecutionMatch[]
  ): string {
    const parts: string[] = [];

    if (historic.length > 0) {
      const topDefect = historic[0];
      parts.push(
        `KNOWN DEFECT HISTORY: "${topDefect.title}" ` +
        `(Severity: ${topDefect.severity}, Occurrences: ${topDefect.occurrenceCount}). ` +
        `Root Cause: ${topDefect.rootCause}. ` +
        `Resolution: ${topDefect.resolution}`
      );
    }

    if (tests.length > 0) {
      const flakyTests = tests.filter(t => t.flakinessScore > 50);
      if (flakyTests.length > 0) {
        parts.push(
          `FLAKY TEST DETECTED: "${flakyTests[0].testName}" ` +
          `(Flakiness Score: ${flakyTests[0].flakinessScore}%, Pass Rate: ${flakyTests[0].passRate}%)`
        );
      }
    }

    if (logs.length > 0) {
      parts.push(`SIMILAR RECENT ISSUES: ${logs.length} related logs found`);
    }

    return parts.join('\n');
  }

  /**
   * Rank logs by semantic similarity
   */
  private async rankBySemanticSimilarity(
    queryEmbedding: number[],
    logs: any[],
    query: string
  ): Promise<any[]> {
    // Safety check for undefined or null
    if (!logs || !Array.isArray(logs)) {
      return [];
    }

    const ranked = await Promise.all(
      logs.map(async log => {
        try {
          const logObj = log.toObject ? log.toObject() : log;
          const logEmbedding = await this.getEmbedding(log.message);
          const similarity = this.cosineSimilarity(queryEmbedding, logEmbedding);
          return {
            ...logObj,
            similarity,
          };
        } catch (e) {
          logError(`Error ranking log: ${e}`);
          return { similarity: 0 };
        }
      })
    );

    return ranked.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Store embedding for a log (for future incremental updates)
   */
  async storeEmbedding(logId: string, text: string): Promise<number[]> {
    try {
      const embedding = await this.getEmbedding(text);
      
      // In production, store embedding in a vector database
      // For now, just return it
      logDebug(`Embedding generated for log ${logId}`);
      
      return embedding;
    } catch (error) {
      logError(`Error storing embedding: ${error}`);
      throw error;
    }
  }

  /**
   * Get RAG statistics for a team
   */
  async getRAGStatistics(teamId: string): Promise<any> {
    try {
      const totalLogs = await Log.countDocuments({ teamId });
      const processedLogs = await Log.countDocuments({
        teamId,
        processingStatus: { $in: ['completed', 'failed'] },
      });
      const withClassification = await Log.countDocuments({
        teamId,
        'classification.isDefect': { $exists: true },
      });

      return {
        totalLogs,
        processedLogs,
        withClassification,
        processingRate: processedLogs / totalLogs || 0,
        classificationRate: withClassification / totalLogs || 0,
      };
    } catch (error) {
      logError(`Error getting RAG statistics: ${error}`);
      throw error;
    }
  }

  // ============== Helper Methods ==============

  /**
   * Simple hash-based embedding (for local development)
   * In production, use OpenAI or similar API
   */
  private simpleEmbedding(text: string): number[] {
    const embedding: number[] = [];
    const normalized = text.toLowerCase();

    // Simple character-based hashing
    for (let i = 0; i < 384; i++) {
      let hash = 0;
      for (let j = 0; j < normalized.length; j++) {
        const char = normalized.charCodeAt(j);
        hash = (hash << 5) - hash + char + i;
        hash = hash & hash; // Convert to 32bit integer
      }
      embedding.push(Math.sin(hash / 1000) * 0.5 + 0.5);
    }

    return embedding;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < Math.min(vecA.length, vecB.length); i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Set similarity threshold
   */
  setSimilarityThreshold(threshold: number) {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Similarity threshold must be between 0 and 1');
    }
    this.similarityThreshold = threshold;
    logInfo(`Similarity threshold updated to ${threshold}`);
  }

  /**
   * Set max results
   */
  setMaxResults(max: number) {
    if (max < 1) {
      throw new Error('Max results must be at least 1');
    }
    this.maxResults = max;
    logInfo(`Max results updated to ${max}`);
  }
}

export const ragService = new RAGService();
