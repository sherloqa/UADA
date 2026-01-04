/**
 * Sample Embeddings Dataset
 * 
 * Pre-computed embeddings for test logs
 * Used for RAG (Retrieval-Augmented Generation) testing
 * 
 * Each embedding is a 384-dimensional vector generated from the log message
 * using the simple hash-based embedding function in ragService.ts
 */

export const embeddingsDataset = [
  {
    logId: 'log-001',
    message: 'Submit button not visible on login page',
    artifactType: 'ui_log',
    teamId: 'qa-team',
    embedding: generateSimpleEmbedding('Submit button not visible on login page'),
    metadata: {
      defectType: 'ui_bug',
      severity: 'high',
      timestamp: new Date(Date.now() - 86400000),
    },
  },
  {
    logId: 'log-002',
    message: 'Payment API returned 500 Internal Server Error',
    artifactType: 'har',
    teamId: 'api-team',
    embedding: generateSimpleEmbedding('Payment API returned 500 Internal Server Error'),
    metadata: {
      defectType: 'api_error',
      severity: 'critical',
      timestamp: new Date(Date.now() - 86400000 * 2),
    },
  },
  {
    logId: 'log-003',
    message: 'Database connection timeout',
    artifactType: 'backend_log',
    teamId: 'backend-team',
    embedding: generateSimpleEmbedding('Database connection timeout'),
    metadata: {
      defectType: 'backend_error',
      severity: 'critical',
      timestamp: new Date(Date.now() - 86400000 * 3),
    },
  },
  {
    logId: 'log-004',
    message: 'Uncaught TypeError in checkout form',
    artifactType: 'ui_log',
    teamId: 'qa-team',
    embedding: generateSimpleEmbedding('Uncaught TypeError in checkout form'),
    metadata: {
      defectType: 'ui_bug',
      severity: 'high',
      timestamp: new Date(Date.now() - 86400000 * 0.5),
    },
  },
  {
    logId: 'log-005',
    message: 'User endpoint returned 404 Not Found',
    artifactType: 'api_log',
    teamId: 'api-team',
    embedding: generateSimpleEmbedding('User endpoint returned 404 Not Found'),
    metadata: {
      defectType: 'assertion_failure',
      severity: 'medium',
      timestamp: new Date(Date.now() - 86400000 * 1.5),
    },
  },
  {
    logId: 'log-006',
    message: 'Test timeout - operation took too long',
    artifactType: 'test_result',
    teamId: 'qa-team',
    embedding: generateSimpleEmbedding('Test timeout - operation took too long'),
    metadata: {
      defectType: 'timeout',
      severity: 'medium',
      timestamp: new Date(Date.now() - 86400000 * 4),
    },
  },
  {
    logId: 'log-007',
    message: 'Network error - failed to fetch from third-party service',
    artifactType: 'har',
    teamId: 'api-team',
    embedding: generateSimpleEmbedding('Network error - failed to fetch from third-party service'),
    metadata: {
      defectType: 'network_issue',
      severity: 'high',
      timestamp: new Date(Date.now() - 86400000 * 5),
    },
  },
  {
    logId: 'log-008',
    message: 'Login button not responsive on mobile',
    artifactType: 'screenshot',
    teamId: 'qa-team',
    embedding: generateSimpleEmbedding('Login button not responsive on mobile'),
    metadata: {
      defectType: 'ui_bug',
      severity: 'high',
      timestamp: new Date(Date.now() - 86400000 * 10),
    },
  },
  {
    logId: 'log-009',
    message: 'Test intermittently times out waiting for element',
    artifactType: 'ui_log',
    teamId: 'qa-team',
    embedding: generateSimpleEmbedding('Test intermittently times out waiting for element'),
    metadata: {
      defectType: 'flaky_test',
      severity: 'medium',
      timestamp: new Date(Date.now() - 86400000 * 20),
    },
  },
  {
    logId: 'log-010',
    message: 'Authentication token expired',
    artifactType: 'api_log',
    teamId: 'backend-team',
    embedding: generateSimpleEmbedding('Authentication token expired'),
    metadata: {
      defectType: 'authentication_error',
      severity: 'high',
      timestamp: new Date(Date.now() - 86400000 * 6),
    },
  },
];

/**
 * Generate a simple embedding for testing
 * Uses the same algorithm as ragService.simpleEmbedding
 */
function generateSimpleEmbedding(text: string): number[] {
  const embedding: number[] = [];
  const normalized = text.toLowerCase();

  for (let i = 0; i < 384; i++) {
    let hash = 0;
    for (let j = 0; j < normalized.length; j++) {
      const char = normalized.charCodeAt(j);
      hash = (hash << 5) - hash + char + i;
      hash = hash & hash;
    }
    embedding.push(Math.sin(hash / 1000) * 0.5 + 0.5);
  }

  return embedding;
}

/**
 * Search similar embeddings using cosine similarity
 */
export function searchSimilarEmbeddings(
  queryEmbedding: number[],
  threshold: number = 0.7
): Array<{
  logId: string;
  message: string;
  similarity: number;
  metadata: any;
}> {
  return embeddingsDataset
    .map(item => ({
      logId: item.logId,
      message: item.message,
      similarity: cosineSimilarity(queryEmbedding, item.embedding),
      metadata: item.metadata,
    }))
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
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
 * Get embeddings grouped by defect type
 */
export function getEmbeddingsByDefectType(defectType: string) {
  return embeddingsDataset.filter(item => item.metadata.defectType === defectType);
}

/**
 * Get embeddings by team
 */
export function getEmbeddingsByTeam(teamId: string) {
  return embeddingsDataset.filter(item => item.teamId === teamId);
}

/**
 * Get embeddings by artifact type
 */
export function getEmbeddingsByArtifactType(artifactType: string) {
  return embeddingsDataset.filter(item => item.artifactType === artifactType);
}

/**
 * Get all embeddings with statistics
 */
export function getEmbeddingsStatistics() {
  const defectTypes = new Map<string, number>();
  const teams = new Map<string, number>();
  const artifactTypes = new Map<string, number>();

  embeddingsDataset.forEach(item => {
    defectTypes.set(
      item.metadata.defectType,
      (defectTypes.get(item.metadata.defectType) || 0) + 1
    );
    teams.set(item.teamId, (teams.get(item.teamId) || 0) + 1);
    artifactTypes.set(
      item.artifactType,
      (artifactTypes.get(item.artifactType) || 0) + 1
    );
  });

  return {
    totalEmbeddings: embeddingsDataset.length,
    byDefectType: Object.fromEntries(defectTypes),
    byTeam: Object.fromEntries(teams),
    byArtifactType: Object.fromEntries(artifactTypes),
  };
}
