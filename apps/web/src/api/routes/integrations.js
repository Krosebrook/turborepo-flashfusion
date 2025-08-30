/**
 * Integration API Routes
 */

const express = require('express');
const router = express.Router();

// Simple integration routes
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Integration Routes',
        timestamp: new Date().toISOString()
    });
});

router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Integration routes are working',
        available_endpoints: ['GET /health', 'GET /', 'GET /status']
    });
});

module.exports = router;