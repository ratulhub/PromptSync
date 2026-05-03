/**
 * securityGuard.js — v3.1.1 PRO
 * Detects sensitive data (API keys, passwords, credit cards) to prevent
 * accidental storage. Used in content.js and popup.js.
 *
 * Usage:
 *   SecurityGuard.scan(text) → { hasSensitive, matches: [{ type, preview }] }
 *   SecurityGuard.isEnabled() — checks setting
 */

const SecurityGuard = (() => {
  'use strict';

  const PATTERNS = [
    { type: 'OpenAI API Key',    regex: /\bsk-[a-zA-Z0-9]{20,}\b/g },
    { type: 'Stripe Key',       regex: /\b[sp]k_(test|live)_[a-zA-Z0-9]{10,}\b/g },
    { type: 'AWS Access Key',   regex: /\bAKIA[0-9A-Z]{16}\b/g },
    { type: 'GitHub Token',     regex: /\bgh[ps]_[a-zA-Z0-9]{36,}\b/g },
    { type: 'GitLab Token',     regex: /\bglpat-[a-zA-Z0-9\-]{20,}\b/g },
    { type: 'Generic API Key',  regex: /\b[a-f0-9]{32,64}\b/g },
    { type: 'Password Field',   regex: /(?:password|passwd|secret|api_key|apikey|token)\s*[:=]\s*\S{6,}/gi },
    { type: 'Credit Card',      regex: /\b(?:\d[ -]*?){13,19}\b/g },
    { type: 'Private Key',      regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g },
    { type: 'Bearer Token',     regex: /\bBearer\s+[a-zA-Z0-9\-._~+/]{20,}\b/g }
  ];

  /**
   * Scan text for sensitive data patterns.
   * @param {string} text
   * @returns {{ hasSensitive: boolean, matches: Array<{type: string, preview: string}> }}
   */
  function scan(text) {
    if (!text || typeof text !== 'string') {
      return { hasSensitive: false, matches: [] };
    }

    const matches = [];
    const seen = new Set();

    for (const pattern of PATTERNS) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        const raw = match[0];
        // Skip short generic hex matches (too many false positives)
        if (pattern.type === 'Generic API Key' && raw.length < 40) continue;
        // Skip credit card false positives (not enough digits)
        if (pattern.type === 'Credit Card') {
          const digits = raw.replace(/\D/g, '');
          if (digits.length < 13 || digits.length > 19) continue;
          if (!luhnCheck(digits)) continue;
        }
        const key = `${pattern.type}:${raw.slice(0, 12)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        matches.push({
          type: pattern.type,
          preview: raw.length > 20 ? raw.slice(0, 8) + '…' + raw.slice(-4) : raw.slice(0, 12) + '…'
        });
      }
    }

    return { hasSensitive: matches.length > 0, matches };
  }

  /** Luhn checksum for credit card validation */
  function luhnCheck(numStr) {
    let sum = 0;
    let alt = false;
    for (let i = numStr.length - 1; i >= 0; i--) {
      let n = parseInt(numStr[i], 10);
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  /**
   * Quick check — does text likely contain sensitive data?
   * @param {string} text
   * @returns {boolean}
   */
  function quickCheck(text) {
    if (!text) return false;
    return /(?:sk-|pk_|AKIA|gh[ps]_|glpat-|password|passwd|secret|api_key|Bearer |-----BEGIN)/i.test(text);
  }

  return { scan, quickCheck };
})();
