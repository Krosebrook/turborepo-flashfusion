/**
 * Main FlashFusion Handler - Single Entry Point
 * Manages all routing with clear separation
 */

const dashboardHTML = require('./dashboard-template');
const webhookManager = require('./webhooks/webhook-manager');

module.exports = async (req, res) => {
    try {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        const url = req.url || '/';
        const method = req.method || 'GET';
        
        console.log('FlashFusion Request:', { url, method, timestamp: new Date().toISOString() });

        // Route to appropriate handler
        const route = getRoute(url);
        
        switch (route.type) {
            case 'dashboard':
                return serveDashboard(res);
            
            case 'api':
                return serveAPI(res, route.endpoint, req);
            
            case 'webhook':
                return webhookManager(req, res);
            
            case 'health':
                return serveHealth(res);
            
            case 'status':
                return serveStatus(res);
            
            default:
                return serveDashboard(res); // Default to dashboard
        }

    } catch (error) {
        console.error('Main handler error:', error);
        return res.status(500).json({
            error: 'Server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// Route determination logic
function getRoute(url) {
    // Health check
    if (url === '/health' || url === '/api/health') {
        return { type: 'health' };
    }
    
    // Status check
    if (url === '/api/status' || url === '/status') {
        return { type: 'status' };
    }
    
    // Webhooks
    if (url.startsWith('/api/webhooks/')) {
        return { type: 'webhook' };
    }
    
    // Other API endpoints
    if (url.startsWith('/api/') && !url.includes('bulletproof') && !url.includes('index')) {
        return { type: 'api', endpoint: url };
    }
    
    // Everything else gets the dashboard
    return { type: 'dashboard' };
}

// Serve the dashboard
function serveDashboard(res) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(dashboardHTML);
}

// Serve API responses
function serveAPI(res, endpoint, req) {
    return res.status(200).json({
        message: 'FlashFusion API',
        endpoint: endpoint,
        method: req.method,
        status: 'operational',
        timestamp: new Date().toISOString()
    });
}

// Serve health check
function serveHealth(res) {
    return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'FlashFusion operational',
        uptime: process.uptime()
    });
}

// Serve status
function serveStatus(res) {
    return res.status(200).json({
        success: true,
        platform: 'FlashFusion',
        version: '2.0.0',
        environment: process.env.VERCEL ? 'production' : 'development',
        timestamp: new Date().toISOString(),
        routes: {
            dashboard: '/',
            health: '/api/health',
            status: '/api/status',
            webhooks: '/api/webhooks/*'
        }
    });
}