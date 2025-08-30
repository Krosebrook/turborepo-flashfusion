/**
 * Agent API Routes
 */

const express = require('express');
const router = express.Router();

// Simple agent routes
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Agent Routes',
        timestamp: new Date().toISOString()
    });
});

router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Agent routes are working',
        available_endpoints: ['GET /health', 'GET /', 'GET /:id', 'POST /chat']
    });
});

module.exports = router;