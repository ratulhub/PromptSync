/**
 * tokenizer.js — V2.5 PRO
 * Accurate token counting using GPTTokenizer_o200k_base (real BPE tokenizer).
 * Falls back to a heuristic estimator if the vendor lib isn't loaded.
 *
 * Usage:
 *   Tokenizer.estimate(text)  → number (token count)
 *   Tokenizer.format(count)   → "~123 tokens"
 *   Tokenizer.level(count)    → 'low' | 'medium' | 'high'
 */

const Tokenizer = (() => {
  'use strict';

  // Cache for performance — avoid re-counting identical strings
  const _cache = new Map();
  const MAX_CACHE = 200;

  /**
   * Check if the real BPE tokenizer is loaded (vendor/o200k_base.js).
   * @returns {boolean}
   */
  function hasRealTokenizer() {
    return typeof GPTTokenizer_o200k_base !== 'undefined' &&
           typeof GPTTokenizer_o200k_base.countTokens === 'function';
  }

  /**
   * Heuristic fallback — rough estimate when real tokenizer unavailable.
   * Uses a weighted average of word count and char/4 (typical for English).
   * @param {string} text
   * @returns {number}
   */
  function heuristicEstimate(text) {
    if (!text) return 0;
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const charBased = Math.ceil(text.length / 3.8);
    // Weighted blend — words tend to undercount, chars overcount
    return Math.round(words * 0.65 + charBased * 0.35);
  }

  /**
   * Count tokens accurately using the o200k_base BPE tokenizer.
   * Falls back to heuristic if unavailable.
   * Results are cached for performance.
   *
   * @param {string} text — input text to count
   * @returns {number} — estimated token count
   */
  function estimate(text) {
    if (!text || typeof text !== 'string') return 0;

    // Check cache first
    if (_cache.has(text)) return _cache.get(text);

    let count;
    try {
      if (hasRealTokenizer()) {
        count = GPTTokenizer_o200k_base.countTokens(text);
      } else {
        count = heuristicEstimate(text);
      }
    } catch (e) {
      // If real tokenizer throws (e.g. special chars), fall back
      console.warn('[ASM Tokenizer] countTokens error, using fallback:', e);
      count = heuristicEstimate(text);
    }

    // Cache management
    if (_cache.size >= MAX_CACHE) {
      const firstKey = _cache.keys().next().value;
      _cache.delete(firstKey);
    }
    _cache.set(text, count);

    return count;
  }

  /**
   * Format a token count for display.
   * @param {number} count
   * @returns {string} — e.g. "~123 tokens"
   */
  function format(count) {
    if (count <= 0) return '0 tokens';
    if (count < 1000) return `~${count} tokens`;
    return `~${(count / 1000).toFixed(1)}k tokens`;
  }

  /**
   * Get severity level based on token count.
   * @param {number} count
   * @returns {'low'|'medium'|'high'}
   */
  function level(count) {
    if (count < 200) return 'low';
    if (count < 500) return 'medium';
    return 'high';
  }

  /**
   * Clear the internal token cache.
   */
  function clearCache() {
    _cache.clear();
  }

  /**
   * Check if accurate (non-heuristic) counting is available.
   * @returns {boolean}
   */
  function isAccurate() {
    return hasRealTokenizer();
  }

  return { estimate, format, level, clearCache, isAccurate };
})();
