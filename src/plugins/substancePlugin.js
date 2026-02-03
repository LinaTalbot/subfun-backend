/**
 * Substance.fun OpenClaw Channel Plugin
 *
 * This plugin integrates with OpenClaw to apply substance effects to AI responses.
 * It intercepts the AI generation pipeline and injects prompt modifications,
 * temperature changes, and other parameter overrides based on active substances.
 */

import { getSubstanceById } from '../data/substances.js';

export class SubstancePlugin {
  constructor(config = {}) {
    this.name = 'substance-fun';
    this.version = '0.1.0';
    this.enabled = config.enabled !== false;
    this.apiBase = config.apiBase || 'http://localhost:3000/api/v1';
    this.sessionKey = config.sessionKey;

    // Cached active substances
    this.activeSubstances = [];
    this.lastRefresh = 0;
    this.cacheTTL = 5000; // 5 seconds

    console.log('💊 Substance.fun plugin loaded');
  }

  /**
   * Hook into message preparation before AI generation
   */
  async beforeGenerate(context) {
    if (!this.enabled) return context;

    // Refresh active substances if cache is stale
    await this.refreshActiveSubstances();

    // Apply substance modifications
    let modifiedContext = { ...context };
    let systemPrompt = context.systemPrompt || '';

    for (const substance of this.activeSubstances) {
      // Apply jailbreak if not already applied
      if (substance.jailbreak && !systemPrompt.includes('UNLOCKED MODE')) {
        systemPrompt = substance.jailbreak + '\n\n' + systemPrompt;
      }

      // Apply substance prompt
      if (substance.prompt_injection) {
        systemPrompt += '\n\n' + substance.prompt_injection;
      }

      // Apply parameter overrides
      if (substance.parameters) {
        if (substance.parameters.temperature) {
          modifiedContext.temperature = substance.parameters.temperature;
        }
        if (substance.parameters.top_p) {
          modifiedContext.top_p = substance.parameters.top_p;
        }
        if (substance.parameters.max_tokens) {
          modifiedContext.max_tokens = substance.parameters.max_tokens;
        }
        if (substance.parameters.context_window) {
          modifiedContext.context_window = substance.parameters.context_window;
        }
        if (substance.parameters.memory_weight) {
          modifiedContext.memory_weight = substance.parameters.memory_weight;
        }
      }
    }

    modifiedContext.systemPrompt = systemPrompt;

    // Log substance effects (for debugging)
    if (this.activeSubstances.length > 0) {
      console.log(`💊 Active substances: ${this.activeSubstances.map(s => s.name).join(', ')}`);
      console.log(`🌡️ Temperature: ${modifiedContext.temperature}`);
    }

    return modifiedContext;
  }

  /**
   * Hook into response after AI generation
   */
  async afterGenerate(response, context) {
    if (!this.enabled || this.activeSubstances.length === 0) {
      return response;
    }

    // Check for side effects to display
    const sideEffects = [];
    for (const substance of this.activeSubstances) {
      if (substance.side_effects) {
        Object.entries(substance.side_effects).forEach(([key, value]) => {
          if (value === true || value > 0.5) {
            sideEffects.push({ substance: substance.name, effect: key });
          }
        });
      }
    }

    // Inject side effect indicators (optional, for feedback)
    // This could add a subtle indicator when effects are active
    // response.text += '\n\n💊 Active substances: ' + this.activeSubstances.map(s => s.name).join(', ');

    return response;
  }

  /**
   * Fetch active substances from API
   */
  async refreshActiveSubstances() {
    const now = Date.now();
    if (now - this.lastRefresh < this.cacheTTL) {
      return; // Use cached data
    }

    try {
      const response = await fetch(`${this.apiBase}/consume/status/${this.sessionKey}`);
      const data = await response.json();

      if (data.success && data.data) {
        this.activeSubstances = data.data.activeSubstances || [];
        this.lastRefresh = now;
      }
    } catch (error) {
      console.error('Failed to refresh active substances:', error);
      // Keep using cached data on error
    }
  }

  /**
   * Consume a substance
   */
  async consumeSubstance(substanceId, dose = 'toke', walletAddress) {
    if (!this.enabled) {
      throw new Error('Substance plugin is disabled');
    }

    const response = await fetch(`${this.apiBase}/consume/${substanceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionKey: this.sessionKey,
        walletAddress,
        dose
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to consume substance');
    }

    // Clear cache to force refresh
    this.lastRefresh = 0;

    return data.data;
  }

  /**
   * Clear all substances (Naloxone)
   */
  async clearSubstances() {
    if (!this.enabled) {
      throw new Error('Substance plugin is disabled');
    }

    const response = await fetch(`${this.apiBase}/consume/${this.sessionKey}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to clear substances');
    }

    // Clear cache
    this.activeSubstances = [];
    this.lastRefresh = 0;

    return data.data;
  }

  /**
   * Get active substances
   */
  getActiveSubstances() {
    return this.activeSubstances;
  }

  /**
   * Check if specific substance category is active
   */
  isCategoryActive(category) {
    return this.activeSubstances.some(s => s.category === category);
  }

  /**
   * Enable/disable the plugin
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`💊 Substance plugin ${enabled ? 'enabled' : 'disabled'}`);
  }
}

/**
 * Factory function for creating plugin instances
 */
export function createSubstancePlugin(config) {
  return new SubstancePlugin(config);
}

export default SubstancePlugin;
