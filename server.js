// LYRA Token Monitor Backend Server
// Connects to Clawnch MCP server and provides real token data
const http = require('http');
const fs = require('fs');
const path = require('path');

// Import the API and Service classes
const { ClawnchTokenAPI, TokenMonitorService } = require('./api.js');

class TokenMonitorBackend {
    constructor(port = 8080) {
        this.port = port;
        this.service = new TokenMonitorService();
        this.api = new ClawnchTokenAPI();
        this.server = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('Initializing Token Monitor Backend...');
            await this.api.initialize();
            await this.service.initialize();
            console.log('Token Monitor Backend initialized successfully');
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize Token Monitor Backend:', error);
            throw error;
        }
    }

    // Start the HTTP server
    start() {
        if (!this.isInitialized) {
            throw new Error('Backend not initialized. Call initialize() first.');
        }

        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        this.server.listen(this.port, () => {
            console.log(`Token Monitor Backend running on http://localhost:${this.port}`);
        });

        // Start monitoring
        this.service.startMonitoring(30000); // Update every 30 seconds
    }

    // Handle incoming HTTP requests
    handleRequest(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (pathname === '/api/status') {
            this.handleStatus(res);
        } else if (pathname === '/api/data') {
            this.handleData(res);
        } else if (pathname === '/api/token') {
            this.handleTokenData(url.searchParams, res);
        } else if (pathname === '/api/refresh') {
            this.handleRefresh(res);
        } else if (pathname === '/') {
            this.serveFile('index.html', res);
        } else {
            // Serve static files
            const filePath = path.join(__dirname, pathname.substring(1));
            this.serveFile(path.basename(filePath), res);
        }
    }

    // Handle status request
    handleStatus(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'running',
            timestamp: new Date().toISOString(),
            initialized: this.isInitialized,
            tokensTracked: Object.keys(this.service.getTokenData()).length
        }));
    }

    // Handle data request
    handleData(res) {
        try {
            const data = this.service.exportFrontendData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: data,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }

    // Handle specific token data request
    handleTokenData(params, res) {
        const tokenAddress = params.get('address');
        if (!tokenAddress) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: 'Token address required'
            }));
            return;
        }

        try {
            const tokenData = this.service.getTokenData(tokenAddress);
            if (!tokenData) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Token not found'
                }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: tokenData,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }

    // Handle refresh request
    async handleRefresh(res) {
        try {
            await this.service.updateAllData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Data refreshed successfully',
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: error.message
            }));
        }
    }

    // Serve static files
    serveFile(filename, res) {
        const filePath = path.join(__dirname, filename);
        
        // Security check - prevent directory traversal
        if (!filePath.startsWith(__dirname)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
            return;
        }

        fs.readFile(filePath, (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('File not found');
                } else {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal server error');
                }
            } else {
                const ext = path.extname(filename).toLowerCase();
                const contentType = this.getMimeType(ext);
                
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            }
        });
    }

    // Get MIME type for file extensions
    getMimeType(ext) {
        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
        };
        
        return mimeTypes[ext] || 'application/octet-stream';
    }

    // Stop the server
    stop() {
        if (this.server) {
            this.server.close(() => {
                console.log('Token Monitor Backend server stopped');
            });
        }
        this.service.stopMonitoring();
    }
}

// Create and start the backend
async function startBackend() {
    const backend = new TokenMonitorBackend(8080);

    try {
        await backend.initialize();
        backend.start();

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\nShutting down Token Monitor Backend...');
            backend.stop();
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('Received SIGTERM, shutting down...');
            backend.stop();
            process.exit(0);
        });
    } catch (error) {
        console.error('Failed to start Token Monitor Backend:', error);
        process.exit(1);
    }
}

// Only start the server if this file is run directly
if (require.main === module) {
    startBackend();
}

module.exports = TokenMonitorBackend;