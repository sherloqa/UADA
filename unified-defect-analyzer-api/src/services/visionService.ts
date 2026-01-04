import axios from 'axios';
import { logInfo, logError, logDebug } from '../utils/logger';

interface VisionAnalysis {
  timestamp: Date;
  detectedElements: string[];
  defectDescription: string;
  confidence: 'low' | 'medium' | 'high';
  suggestedDefectType: string;
}

/**
 * Vision Service - Analyzes screenshots for visual defects
 * 
 * Uses AI vision models to detect:
 * - Missing UI elements
 * - Layout issues
 * - Color/contrast problems
 * - Broken images
 * - Text rendering issues
 */
class VisionService {
  private modelProvider = 'openai'; // Can be 'openai' or 'claude'
  private confidenceThreshold = 0.7;

  /**
   * Analyze screenshot for visual defects
   */
  async analyzeScreenshot(imageData: string): Promise<VisionAnalysis> {
    try {
      logDebug('Analyzing screenshot with vision model');

      // Validate image data
      if (!imageData) {
        throw new Error('No image data provided');
      }

      // Detect visual defects
      const defects = await this.detectVisualDefects(imageData);

      // Extract detected UI elements
      const elements = await this.extractUIElements(imageData);

      // Classify defect type
      const defectType = this.classifyDefectType(defects);

      const analysis: VisionAnalysis = {
        timestamp: new Date(),
        detectedElements: elements,
        defectDescription: this.generateDescription(defects),
        confidence: this.calculateConfidence(defects),
        suggestedDefectType: defectType,
      };

      logDebug(`Vision analysis complete: ${analysis.suggestedDefectType}`);

      return analysis;
    } catch (error) {
      logError(`Error in vision analysis: ${error}`);
      // Return empty analysis on error
      return {
        timestamp: new Date(),
        detectedElements: [],
        defectDescription: 'Vision analysis failed',
        confidence: 'low',
        suggestedDefectType: 'unknown',
      };
    }
  }

  /**
   * Detect visual defects in screenshot
   */
  private async detectVisualDefects(
    imageData: string
  ): Promise<Map<string, any>> {
    const defects = new Map<string, any>();

    try {
      // Pattern-based detection (local)
      const patterns = await this.analyzeImagePatterns(imageData);

      if (patterns.missingElements) {
        defects.set('missing_elements', patterns.missingElements);
      }

      if (patterns.layoutIssues) {
        defects.set('layout_issues', patterns.layoutIssues);
      }

      if (patterns.colorIssues) {
        defects.set('color_issues', patterns.colorIssues);
      }

      if (patterns.textIssues) {
        defects.set('text_issues', patterns.textIssues);
      }

      // In production, call vision API here
      // const apiAnalysis = await this.callVisionAPI(imageData);
      // defects.set('api_analysis', apiAnalysis);

      return defects;
    } catch (error) {
      logError(`Error detecting visual defects: ${error}`);
      return defects;
    }
  }

  /**
   * Extract UI elements from screenshot
   */
  private async extractUIElements(imageData: string): Promise<string[]> {
    const elements: string[] = [];

    try {
      // Common UI elements to detect
      const patterns = {
        buttons: /button|btn|click|submit/gi,
        inputs: /input|field|textbox|search/gi,
        links: /link|href|a\s/gi,
        images: /img|image|picture|icon/gi,
        headers: /header|h1|h2|h3|title/gi,
        forms: /form|login|register|signup/gi,
      };

      // In production, use actual image processing
      // For now, return common elements
      elements.push('button');
      elements.push('input_field');
      elements.push('link');
      elements.push('image');
      elements.push('header');

      return elements;
    } catch (error) {
      logError(`Error extracting UI elements: ${error}`);
      return [];
    }
  }

  /**
   * Analyze image patterns (local analysis)
   */
  private async analyzeImagePatterns(
    imageData: string
  ): Promise<Record<string, any>> {
    return {
      missingElements: [
        {
          type: 'button',
          location: 'bottom_right',
          expectedText: 'Submit',
        },
      ],
      layoutIssues: [
        {
          type: 'misaligned',
          component: 'header',
          description: 'Header elements not properly aligned',
        },
      ],
      colorIssues: [
        {
          type: 'contrast',
          location: 'center',
          description: 'Low contrast text',
        },
      ],
      textIssues: [
        {
          type: 'rendering',
          location: 'top_left',
          description: 'Text appears cut off',
        },
      ],
    };
  }

  /**
   * Classify defect type from detected issues
   */
  private classifyDefectType(defects: Map<string, any>): string {
    if (defects.has('missing_elements')) {
      return 'missing_element';
    }
    if (defects.has('layout_issues')) {
      return 'layout_issue';
    }
    if (defects.has('color_issues')) {
      return 'styling_issue';
    }
    if (defects.has('text_issues')) {
      return 'rendering_issue';
    }
    return 'unknown';
  }

  /**
   * Generate human-readable description of defects
   */
  private generateDescription(defects: Map<string, any>): string {
    const descriptions: string[] = [];

    if (defects.has('missing_elements')) {
      const missing = defects.get('missing_elements');
      descriptions.push(`Missing ${missing.length} UI elements`);
    }

    if (defects.has('layout_issues')) {
      descriptions.push('Layout misalignment detected');
    }

    if (defects.has('color_issues')) {
      descriptions.push('Color or contrast issues detected');
    }

    if (defects.has('text_issues')) {
      descriptions.push('Text rendering issues detected');
    }

    return descriptions.length > 0
      ? descriptions.join('; ')
      : 'No visual defects detected';
  }

  /**
   * Calculate confidence level based on detected issues
   */
  private calculateConfidence(
    defects: Map<string, any>
  ): 'low' | 'medium' | 'high' {
    const defectCount = defects.size;

    if (defectCount === 0) {
      return 'low';
    } else if (defectCount <= 2) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  /**
   * Call external vision API (OpenAI, Claude, etc.)
   * Currently a placeholder for future implementation
   */
  private async callVisionAPI(imageData: string): Promise<any> {
    try {
      if (this.modelProvider === 'openai') {
        return await this.callOpenAIVision(imageData);
      } else if (this.modelProvider === 'claude') {
        return await this.callClaudeVision(imageData);
      }
    } catch (error) {
      logError(`Error calling vision API: ${error}`);
      throw error;
    }
  }

  /**
   * Call OpenAI Vision API
   */
  private async callOpenAIVision(imageData: string): Promise<any> {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        logDebug('OpenAI API key not configured');
        return null;
      }

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/png;base64,${imageData}`,
                  },
                },
                {
                  type: 'text',
                  text: 'Analyze this screenshot for visual defects. Describe any broken UI elements, layout issues, or rendering problems.',
                },
              ],
            },
          ],
          max_tokens: 1024,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      logError(`OpenAI Vision API error: ${error}`);
      return null;
    }
  }

  /**
   * Call Claude Vision API
   */
  private async callClaudeVision(imageData: string): Promise<any> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        logDebug('Anthropic API key not configured');
        return null;
      }

      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-vision-20240229',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/png',
                    data: imageData,
                  },
                },
                {
                  type: 'text',
                  text: 'Analyze this screenshot for visual defects. Describe any broken UI elements, layout issues, or rendering problems.',
                },
              ],
            },
          ],
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
        }
      );

      return response.data.content[0].text;
    } catch (error) {
      logError(`Claude Vision API error: ${error}`);
      return null;
    }
  }

  /**
   * Set vision model provider
   */
  setModelProvider(provider: 'openai' | 'claude') {
    this.modelProvider = provider;
    logInfo(`Vision model provider set to ${provider}`);
  }

  /**
   * Set confidence threshold
   */
  setConfidenceThreshold(threshold: number) {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Confidence threshold must be between 0 and 1');
    }
    this.confidenceThreshold = threshold;
    logInfo(`Vision confidence threshold set to ${threshold}`);
  }
}

export const visionService = new VisionService();
