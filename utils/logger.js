const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class Logger {
    constructor() {
        this.logLevel = this.getLogLevel(config.LOG_LEVEL);
        this.logFile = path.join(process.cwd(), 'bot.log');
        
        // Ensure log file exists
        if (!fs.existsSync(this.logFile)) {
            fs.writeFileSync(this.logFile, '');
        }
    }

    getLogLevel(level) {
        const levels = { error: 0, warn: 1, info: 2, debug: 3 };
        return levels[level.toLowerCase()] || 2;
    }

    formatMessage(level, message, extra = null) {
        const timestamp = new Date().toISOString();
        const formattedMsg = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        if (extra) {
            return `${formattedMsg}\n${JSON.stringify(extra, null, 2)}`;
        }
        
        return formattedMsg;
    }

    writeToFile(message) {
        try {
            fs.appendFileSync(this.logFile, message + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    log(level, message, extra = null) {
        const levelNum = this.getLogLevel(level);
        
        if (levelNum <= this.logLevel) {
            const formatted = this.formatMessage(level, message, extra);
            
            // Console output with colors
            const colors = {
                error: '\x1b[31m',   // Red
                warn: '\x1b[33m',    // Yellow
                info: '\x1b[36m',    // Cyan
                debug: '\x1b[90m'    // Gray
            };
            const reset = '\x1b[0m';
            
            console.log(`${colors[level] || ''}${formatted}${reset}`);
            
            // File output
            this.writeToFile(formatted);
        }
    }

    error(message, extra = null) {
        this.log('error', message, extra);
    }

    warn(message, extra = null) {
        this.log('warn', message, extra);
    }

    info(message, extra = null) {
        this.log('info', message, extra);
    }

    debug(message, extra = null) {
        this.log('debug', message, extra);
    }

    // Clean old logs (keep last 7 days)
    cleanOldLogs() {
        try {
            const stats = fs.statSync(this.logFile);
            const age = Date.now() - stats.mtime.getTime();
            const weekInMs = 7 * 24 * 60 * 60 * 1000;
            
            if (age > weekInMs) {
                fs.writeFileSync(this.logFile, ''); // Clear the file
                this.info('Log file cleaned (older than 7 days)');
            }
        } catch (error) {
            this.error('Error cleaning log file:', error);
        }
    }

    // Get recent logs for web interface
    getRecentLogs(lines = 100) {
        try {
            const content = fs.readFileSync(this.logFile, 'utf8');
            const logLines = content.split('\n').filter(line => line.trim());
            return logLines.slice(-lines);
        } catch (error) {
            this.error('Error reading log file:', error);
            return [];
        }
    }
}

module.exports = new Logger();
