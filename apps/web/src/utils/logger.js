/**
 * PERMANENT FIX FOR VERCEL DEPLOYMENT
 * This logger NEVER uses file system operations
 * It will NEVER crash on Vercel or any read-only environment
 */

// Use the universal logger that works everywhere
const universalLogger = require('./universalLogger');

// Export the universal logger
module.exports = universalLogger;

// Also export as console for absolute compatibility
if (process.env.VERCEL || process.env.NOW_REGION) {
    // On Vercel, use pure console to guarantee no issues
    module.exports = console;
}