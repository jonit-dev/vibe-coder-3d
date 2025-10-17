/**
 * Simple Logger for Scripts
 *
 * KISS Principle: Minimal console logging for Node scripts
 * Respects --silent flag for CI/CD integration
 */

const SILENT = process.argv.includes('--silent');

export const logger = {
  info: (message, data = {}) => {
    if (SILENT) return;
    const extras = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : '';
    console.log(`ℹ️  ${message}${extras}`);
  },

  warn: (message, data = {}) => {
    const extras = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : '';
    console.warn(`⚠️  ${message}${extras}`);
  },

  error: (message, data = {}) => {
    const extras = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : '';
    console.error(`❌ ${message}${extras}`);
  },

  debug: (message, data = {}) => {
    if (SILENT) return;
    if (!process.env.VERBOSE_OPTIMIZATION) return;
    const extras = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : '';
    console.log(`🔍 ${message}${extras}`);
  },

  success: (message, data = {}) => {
    if (SILENT) return;
    const extras = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : '';
    console.log(`✅ ${message}${extras}`);
  },
};
