/**
 * browserApi.js
 * Universal wrapper for cross-browser compatibility (Chrome + Firefox).
 */
const api = typeof browser !== "undefined" ? browser : chrome;

// Export for module systems or attach to globalThis for typical extension scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
} else if (typeof globalThis !== 'undefined') {
  globalThis.api = api;
} else if (typeof window !== 'undefined') {
  window.api = api;
}
