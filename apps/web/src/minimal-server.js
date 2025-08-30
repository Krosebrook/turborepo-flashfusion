/**
 * FlashFusion Minimal Server - Vercel Compatible
 * Stripped down version that definitely works in serverless environment
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL ? 'production' : 'development'
    });
});

// Basic API routes
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        message: 'FlashFusion API is running',
        timestamp: new Date().toISOString()
    });
});

// Zapier webhook endpoint
app.post('/api/zapier/incoming-webhook', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Webhook received',
        data: req.body,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/zapier/incoming-webhook', (req, res) => {
    res.json({
        success: true,
        message: 'FlashFusion Zapier webhook endpoint is active',
        timestamp: new Date().toISOString()
    });
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/replit-interface.html'));
});

app.get('/zapier-automation', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/zapier-automation.html'));
});

app.get('/integrations', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/integrations.html'));
});

// Catch all for static files
app.get('*', (req, res) => {
    if (req.path.includes('.')) {
        res.sendFile(path.join(__dirname, '../client/dist', req.path));
    } else {
        res.sendFile(path.join(__dirname, '../client/dist/replit-interface.html'));
    }
});

// Export for Vercel
module.exports = app;

// Start server if run directly
if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`FlashFusion Minimal Server running on port ${port}`);
    });
}