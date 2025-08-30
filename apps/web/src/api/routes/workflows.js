/**
 * Workflow API Routes
 */

const express = require('express');
const router = express.Router();

// Simple workflow routes that don't require complex dependencies
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Workflow Routes',
        timestamp: new Date().toISOString()
    });
});

router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Workflow routes are working',
        available_endpoints: [
            'GET /health',
            'GET /',
            'POST /',
            'GET /:id',
            'POST /:id/start'
        ]
    });
});

module.exports = router;