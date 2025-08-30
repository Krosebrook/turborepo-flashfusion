// Ultra-simple Vercel function - no dependencies
module.exports = (req, res) => {
    if (req.url === '/health') {
        return res.json({ status: 'ok', timestamp: new Date().toISOString() });
    }
    
    if (req.url === '/api/status') {
        return res.json({ success: true, message: 'API working' });
    }
    
    if (req.url.includes('/api/zapier/incoming-webhook')) {
        return res.json({ success: true, webhook: 'active', timestamp: new Date().toISOString() });
    }
    
    // Default response
    res.setHeader('Content-Type', 'text/html');
    res.send(`
        <html>
        <head><title>FlashFusion - Online</title></head>
        <body style="font-family: Arial; background: #1a1a2e; color: white; padding: 2rem;">
            <h1>🚀 FlashFusion is Online!</h1>
            <p>Ultra-minimal server deployed successfully.</p>
            <ul>
                <li><a href="/health" style="color: #4ecdc4;">Health Check</a></li>
                <li><a href="/api/status" style="color: #4ecdc4;">API Status</a></li>
                <li><a href="/api/zapier/incoming-webhook" style="color: #4ecdc4;">Zapier Webhook</a></li>
            </ul>
            <p>No Winston logger, no file system operations, guaranteed to work!</p>
        </body>
        </html>
    `);
};// Force deployment Thu, Jul 24, 2025  2:42:00 PM
