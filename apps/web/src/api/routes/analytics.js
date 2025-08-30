/**
 * Analytics API Routes
 */

const express = require('express');
const router = express.Router();

// Simple analytics routes
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Analytics Routes',
        timestamp: new Date().toISOString()
    });
});

router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Analytics routes are working',
        available_endpoints: ['GET /health', 'GET /', 'GET /metrics']
    });
});

module.exports = router;