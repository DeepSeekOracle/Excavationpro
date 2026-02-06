#!/usr/bin/env node

/**
 * Cron Job Setup Script for LYRA Token Monitor
 * Sets up and manages the token monitoring service
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CronJobSetup {
    constructor() {
        this.cronJobId = 'lyra-token-monitor';
        this.monitorDir = __dirname;
        this.serviceName = 'lyra-token-monitor-service';
        this.pidFile = path.join(this.monitorDir, 'monitor.pid');
        this.logFile = path.join(this.monitorDir, 'monitor.log');
        this.errorLogFile = path.join(this.monitorDir, 'monitor-error.log');
    }

    // Check if we're on Windows or Unix-like system
    isWindows() {
        return process.platform === 'win32';
    }

    // Install the cron job/service
    async install() {
        console.log('Installing LYRA Token Monitor service...');
        
        if (this.isWindows()) {
            await this.installWindowsService();
        } else {
            await this.installUnixCron();
        }
        
        console.log('LYRA Token Monitor service installed successfully!');
        console.log('Use "npm run start" to manually start the monitor');
        console.log('Use "node control-service.js stop" to stop the monitor');
    }

    // Install on Unix/Linux/macOS using cron
    async installUnixCron() {
        try {
            // First, make sure the script is executable
            const startScript = path.join(this.monitorDir, 'start-monitor.sh');
            const stopScript = path.join(this.monitorDir, 'stop-monitor.sh');
            
            // Create start script
            const startScriptContent = `#!/bin/bash
cd ${this.monitorDir}
export NODE_ENV=production
nohup npm run monitor >> ${this.logFile} 2>> ${this.errorLogFile} &
echo $! > ${this.pidFile}
`;
            
            // Create stop script
            const stopScriptContent = `#!/bin/bash
if [ -f ${this.pidFile} ]; then
    PID=$(cat ${this.pidFile})
    kill $PID
    rm ${this.pidFile}
    echo "LYRA Token Monitor stopped (PID: $PID)"
else
    echo "No PID file found. Service may not be running."
fi
`;

            fs.writeFileSync(startScript, startScriptContent);
            fs.writeFileSync(stopScript, stopScriptContent);
            
            // Make scripts executable
            fs.chmodSync(startScript, '755');
            fs.chmodSync(stopScript, '755');
            
            // Add to crontab (run on startup)
            const cronEntry = `@reboot cd ${this.monitorDir} && npm run monitor >> ${this.logFile} 2>> ${this.errorLogFile} & echo $! > ${this.pidFile}`;
            
            try {
                // Get current crontab
                let currentCrontab = '';
                try {
                    currentCrontab = execSync('crontab -l', { encoding: 'utf8' });
                } catch (error) {
                    // If crontab is empty, this is expected
                    if (!error.stderr.includes('no crontab')) {
                        throw error;
                    }
                }
                
                // Remove existing entry if it exists
                const lines = currentCrontab.split('\n');
                const filteredLines = lines.filter(line => !line.includes(this.cronJobId));
                
                // Add new entry
                filteredLines.push(cronEntry);
                
                // Write back to crontab
                const newCrontab = filteredLines.join('\n');
                const tempCrontabFile = path.join(this.monitorDir, 'temp_crontab');
                fs.writeFileSync(tempCrontabFile, newCrontab);
                execSync(`crontab ${tempCrontabFile}`);
                fs.unlinkSync(tempCrontabFile);
                
                console.log('Cron job added successfully');
            } catch (error) {
                console.error('Failed to add cron job:', error.message);
                throw error;
            }
        } catch (error) {
            console.error('Failed to install Unix cron job:', error.message);
            throw error;
        }
    }

    // Install on Windows using Task Scheduler
    async installWindowsService() {
        try {
            const scheduleCmd = `schtasks /create /tn "${this.serviceName}" /tr "cmd /c cd ${this.monitorDir} && npm run monitor" /sc onstart /ru "SYSTEM" /rl HIGHEST`;
            
            execSync(scheduleCmd, { stdio: 'inherit' });
            console.log('Windows Task Scheduler entry created');
        } catch (error) {
            console.error('Failed to install Windows service:', error.message);
            // On Windows, we'll create a simpler solution
            console.log('Creating Windows startup script...');
            
            const startupDir = path.join(process.env.USERPROFILE, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
            const startupScript = path.join(startupDir, 'lyra-token-monitor.bat');
            
            const startupScriptContent = `@echo off
cd /d "${this.monitorDir}"
npm run monitor
`;
            
            fs.writeFileSync(startupScript, startupScriptContent);
            console.log('Windows startup script created');
        }
    }

    // Uninstall the cron job/service
    async uninstall() {
        console.log('Uninstalling LYRA Token Monitor service...');
        
        if (this.isWindows()) {
            await this.uninstallWindowsService();
        } else {
            await this.uninstallUnixCron();
        }
        
        // Clean up files
        if (fs.existsSync(this.pidFile)) {
            fs.unlinkSync(this.pidFile);
        }
        
        console.log('LYRA Token Monitor service uninstalled successfully!');
    }

    // Uninstall Unix cron job
    async uninstallUnixCron() {
        try {
            // Get current crontab
            let currentCrontab = '';
            try {
                currentCrontab = execSync('crontab -l', { encoding: 'utf8' });
            } catch (error) {
                // If crontab is empty, this is expected
                if (!error.stderr.includes('no crontab')) {
                    throw error;
                }
                return; // Nothing to remove
            }
            
            // Remove our entry
            const lines = currentCrontab.split('\n');
            const filteredLines = lines.filter(line => !line.includes(this.cronJobId));
            
            // Write back to crontab
            const newCrontab = filteredLines.join('\n');
            const tempCrontabFile = path.join(this.monitorDir, 'temp_crontab');
            fs.writeFileSync(tempCrontabFile, newCrontab);
            execSync(`crontab ${tempCrontabFile}`);
            fs.unlinkSync(tempCrontabFile);
            
            // Remove script files
            const startScript = path.join(this.monitorDir, 'start-monitor.sh');
            const stopScript = path.join(this.monitorDir, 'stop-monitor.sh');
            
            if (fs.existsSync(startScript)) {
                fs.unlinkSync(startScript);
            }
            if (fs.existsSync(stopScript)) {
                fs.unlinkSync(stopScript);
            }
            
            console.log('Cron job removed successfully');
        } catch (error) {
            console.error('Failed to remove cron job:', error.message);
            throw error;
        }
    }

    // Uninstall Windows service
    async uninstallWindowsService() {
        try {
            const deleteCmd = `schtasks /delete /tn "${this.serviceName}" /f`;
            execSync(deleteCmd, { stdio: 'inherit' });
            console.log('Windows Task Scheduler entry removed');
            
            // Remove startup script if it exists
            const startupDir = path.join(process.env.USERPROFILE, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
            const startupScript = path.join(startupDir, 'lyra-token-monitor.bat');
            
            if (fs.existsSync(startupScript)) {
                fs.unlinkSync(startupScript);
                console.log('Windows startup script removed');
            }
        } catch (error) {
            console.error('Failed to remove Windows service:', error.message);
            // Try to remove startup script anyway
            const startupDir = path.join(process.env.USERPROFILE, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
            const startupScript = path.join(startupDir, 'lyra-token-monitor.bat');
            
            if (fs.existsSync(startupScript)) {
                fs.unlinkSync(startupScript);
                console.log('Windows startup script removed');
            }
        }
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
        return false;
    }

    // Start the service manually
    async startService() {
        if (this.isRunning()) {
            console.log('Service is already running');
            return;
        }

        try {
            const cmd = `cd ${this.monitorDir} && npm run monitor >> ${this.logFile} 2>> ${this.errorLogFile} & echo $! > ${this.pidFile}`;
            execSync(cmd, { stdio: 'inherit', shell: this.isWindows() ? 'cmd' : undefined });
            console.log('Service started successfully');
        } catch (error) {
            console.error('Failed to start service:', error.message);
            throw error;
        }
    }

    // Stop the service manually
    async stopService() {
        if (!this.isRunning()) {
            console.log('Service is not running');
            return;
        }

        try {
            if (this.isWindows()) {
                // On Windows, we'll use taskkill
                const pid = fs.readFileSync(this.pidFile, 'utf8').trim();
                execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
            } else {
                // On Unix, we'll use kill
                const pid = fs.readFileSync(this.pidFile, 'utf8').trim();
                execSync(`kill ${pid}`, { stdio: 'inherit' });
            }
            
            if (fs.existsSync(this.pidFile)) {
                fs.unlinkSync(this.pidFile);
            }
            
            console.log('Service stopped successfully');
        } catch (error) {
            console.error('Failed to stop service:', error.message);
            // Try to remove PID file anyway
            if (fs.existsSync(this.pidFile)) {
                fs.unlinkSync(this.pidFile);
            }
            throw error;
        }
    }
}

// Command line interface
async function main() {
    const setup = new CronJobSetup();
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node setup-cron.js [install|uninstall|start|stop|status]');
        console.log('  install - Install the monitoring service');
        console.log('  uninstall - Remove the monitoring service');
        console.log('  start - Start the service manually');
        console.log('  stop - Stop the service manually');
        console.log('  status - Check if the service is running');
        process.exit(1);
    }
    
    const command = args[0].toLowerCase();
    
    try {
        switch (command) {
            case 'install':
                await setup.install();
                break;
            case 'uninstall':
                await setup.uninstall();
                break;
            case 'start':
                await setup.startService();
                break;
            case 'stop':
                await setup.stopService();
                break;
            case 'status':
                const running = setup.isRunning();
                console.log(`Service is ${running ? 'RUNNING' : 'STOPPED'}`);
                break;
            default:
                console.log(`Unknown command: ${command}`);
                console.log('Available commands: install, uninstall, start, stop, status');
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

module.exports = CronJobSetup;