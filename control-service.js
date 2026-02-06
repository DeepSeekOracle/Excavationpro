#!/usr/bin/env node

/**
 * Service Control Script for LYRA Token Monitor
 * Provides easy commands to manage the monitoring service
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ServiceController {
    constructor() {
        this.monitorDir = __dirname;
        this.pidFile = path.join(this.monitorDir, 'monitor.pid');
        this.logFile = path.join(this.monitorDir, 'monitor.log');
        this.errorLogFile = path.join(this.monitorDir, 'monitor-error.log');
        this.serverPort = 8080;
    }

    // Check if service is running
    isRunning() {
        if (fs.existsSync(this.pidFile)) {
            const pid = fs.readFileSync(this.pidFile, 'utf8').trim();
            try {
                process.kill(pid, 0); // Check if process exists
                return true;
            } catch (error) {
                // Process doesn't exist, remove stale PID file
                fs.unlinkSync(this.pidFile);
                return false;
            }
        }
        
        // Alternative check: try to connect to the server port
        try {
            const net = require('net');
            const client = new net.Socket();
            
            return new Promise((resolve) => {
                client.setTimeout(2000); // 2 second timeout
                
                client.connect(this.serverPort, 'localhost', () => {
                    client.destroy();
                    resolve(true);
                });
                
                client.on('error', () => {
                    client.destroy();
                    resolve(false);
                });
                
                client.on('timeout', () => {
                    client.destroy();
                    resolve(false);
                });
            });
        } catch (error) {
            return false;
        }
    }

    // Start the service
    async start() {
        const running = await this.isRunning();
        if (running) {
            console.log('LYRA Token Monitor is already running');
            return;
        }

        console.log('Starting LYRA Token Monitor...');
        
        try {
            // Change to the monitor directory
            process.chdir(this.monitorDir);
            
            // Start the server in the background
            const command = `node server.js >> "${this.logFile}" 2>> "${this.errorLogFile}" & echo $! > "${this.pidFile}"`;
            
            // Execute the command
            const child = execSync(command, { 
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true
            });
            
            // Wait a moment for the server to start
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verify it started
            const started = await this.isRunning();
            if (started) {
                console.log('LYRA Token Monitor started successfully!');
                console.log(`Dashboard available at: http://localhost:${this.serverPort}`);
                console.log(`API available at: http://localhost:${this.serverPort}/api/status`);
            } else {
                console.error('Failed to start LYRA Token Monitor. Check logs for details.');
                console.error(`Logs: ${this.logFile}`);
                console.error(`Errors: ${this.errorLogFile}`);
            }
        } catch (error) {
            console.error('Error starting LYRA Token Monitor:', error.message);
        }
    }

    // Stop the service
    async stop() {
        const running = await this.isRunning();
        if (!running) {
            console.log('LYRA Token Monitor is not running');
            return;
        }

        console.log('Stopping LYRA Token Monitor...');
        
        try {
            if (fs.existsSync(this.pidFile)) {
                const pid = fs.readFileSync(this.pidFile, 'utf8').trim();
                
                if (process.platform === 'win32') {
                    execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
                } else {
                    execSync(`kill ${pid}`, { stdio: 'ignore' });
                }
                
                // Wait for process to terminate
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Remove PID file
            if (fs.existsSync(this.pidFile)) {
                fs.unlinkSync(this.pidFile);
            }
            
            console.log('LYRA Token Monitor stopped successfully');
        } catch (error) {
            console.error('Error stopping LYRA Token Monitor:', error.message);
            
            // Still try to clean up
            if (fs.existsSync(this.pidFile)) {
                fs.unlinkSync(this.pidFile);
            }
        }
    }

    // Restart the service
    async restart() {
        console.log('Restarting LYRA Token Monitor...');
        await this.stop();
        
        // Wait a moment before starting again
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.start();
    }

    // View logs
    viewLogs(lines = 20) {
        if (fs.existsSync(this.logFile)) {
            try {
                const logContent = fs.readFileSync(this.logFile, 'utf8');
                const logLines = logContent.split('\n');
                const recentLines = logLines.slice(-lines-1, -1);
                
                console.log('=== LYRA Token Monitor Logs ===');
                recentLines.forEach(line => {
                    if (line.trim()) {
                        console.log(line);
                    }
                });
            } catch (error) {
                console.error('Error reading logs:', error.message);
            }
        } else {
            console.log('Log file does not exist yet. Start the service first.');
        }
    }

    // View error logs
    viewErrorLogs(lines = 20) {
        if (fs.existsSync(this.errorLogFile)) {
            try {
                const logContent = fs.readFileSync(this.errorLogFile, 'utf8');
                const logLines = logContent.split('\n');
                const recentLines = logLines.slice(-lines-1, -1);
                
                console.log('=== LYRA Token Monitor Error Logs ===');
                recentLines.forEach(line => {
                    if (line.trim()) {
                        console.log(line);
                    }
                });
            } catch (error) {
                console.error('Error reading error logs:', error.message);
            }
        } else {
            console.log('Error log file does not exist yet.');
        }
    }

    // Status of the service
    async status() {
        const running = await this.isRunning();
        
        console.log('=== LYRA Token Monitor Status ===');
        console.log(`Status: ${running ? 'RUNNING' : 'STOPPED'}`);
        console.log(`Port: ${this.serverPort}`);
        console.log(`Dashboard: http://localhost:${this.serverPort}`);
        console.log(`API Endpoint: http://localhost:${this.serverPort}/api/status`);
        console.log(`PID File: ${this.pidFile}`);
        console.log(`Log File: ${this.logFile}`);
        console.log(`Error Log: ${this.errorLogFile}`);
        
        if (running && fs.existsSync(this.pidFile)) {
            const pid = fs.readFileSync(this.pidFile, 'utf8').trim();
            console.log(`Process ID: ${pid}`);
        }
    }

    // Test the API connection
    async testApi() {
        const running = await this.isRunning();
        
        if (!running) {
            console.log('LYRA Token Monitor is not running. Cannot test API.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:${this.serverPort}/api/status`);
            const data = await response.json();
            
            console.log('=== API Test Result ===');
            console.log('API Status:', data.status);
            console.log('Timestamp:', data.timestamp);
            console.log('Initialized:', data.initialized);
            console.log('Tokens Tracked:', data.tokensTracked);
        } catch (error) {
            console.error('API Test Failed:', error.message);
        }
    }
}

// Command line interface
async function main() {
    const controller = new ServiceController();
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('LYRA Token Monitor Service Controller');
        console.log('');
        console.log('Usage: node control-service.js [command] [options]');
        console.log('');
        console.log('Commands:');
        console.log('  start          Start the monitoring service');
        console.log('  stop           Stop the monitoring service');
        console.log('  restart        Restart the monitoring service');
        console.log('  status         Show service status');
        console.log('  logs [n]       View last n log lines (default 20)');
        console.log('  errors [n]     View last n error log lines (default 20)');
        console.log('  test-api       Test the API connection');
        console.log('');
        console.log('Examples:');
        console.log('  node control-service.js start');
        console.log('  node control-service.js status');
        console.log('  node control-service.js logs 50');
        process.exit(1);
    }
    
    const command = args[0].toLowerCase();
    const option = args[1] ? parseInt(args[1]) : 20;
    
    try {
        switch (command) {
            case 'start':
                await controller.start();
                break;
            case 'stop':
                await controller.stop();
                break;
            case 'restart':
                await controller.restart();
                break;
            case 'status':
                await controller.status();
                break;
            case 'logs':
                controller.viewLogs(option);
                break;
            case 'errors':
            case 'error':
                controller.viewErrorLogs(option);
                break;
            case 'test-api':
            case 'test':
                await controller.testApi();
                break;
            default:
                console.log(`Unknown command: ${command}`);
                console.log('Use "node control-service.js" to see available commands');
                process.exit(1);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Only run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = ServiceController;