const config = require('../config/config');
const logger = require('./logger');

class ReconnectionManager {
    constructor() {
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        this.reconnectTimer = null;
    }

    setupAutoReconnect(bot, createBotFunction) {
        bot.on('end', (reason) => {
            if (this.isReconnecting) return;
            
            logger.warn(`Bot disconnected: ${reason || 'Unknown reason'}`);
            this.startReconnection(createBotFunction);
        });

        bot.on('error', (error) => {
            logger.error('Bot error occurred:', error);
            
            // Don't reconnect on certain errors
            if (this.shouldNotReconnect(error)) {
                logger.error('Fatal error, not attempting reconnection');
                return;
            }
            
            if (!this.isReconnecting) {
                this.startReconnection(createBotFunction);
            }
        });

        bot.on('kicked', (reason) => {
            logger.warn(`Bot was kicked: ${reason}`);
            
            // Check if kicked for illegal characters (message formatting issue)
            const reasonStr = JSON.stringify(reason);
            if (reasonStr.includes('illegal_characters')) {
                logger.warn('Bot kicked for illegal characters - likely message formatting issue');
            }
            
            // Wait longer if kicked (might be temporary ban)
            const kickDelay = config.RECONNECT_DELAY * 3;
            setTimeout(() => {
                if (!this.isReconnecting) {
                    this.startReconnection(createBotFunction);
                }
            }, kickDelay);
        });

        // Reset reconnection counter on successful spawn
        bot.on('spawn', () => {
            this.reconnectAttempts = 0;
            this.isReconnecting = false;
            
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
        });
    }

    startReconnection(createBotFunction) {
        if (this.isReconnecting) return;
        
        this.isReconnecting = true;
        this.reconnectAttempts++;

        if (this.reconnectAttempts > config.MAX_RECONNECT_ATTEMPTS) {
            logger.error(`Max reconnection attempts (${config.MAX_RECONNECT_ATTEMPTS}) reached. Stopping.`);
            this.isReconnecting = false;
            return;
        }

        const delay = this.calculateReconnectDelay();
        logger.info(`Attempting reconnection ${this.reconnectAttempts}/${config.MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);

        this.reconnectTimer = setTimeout(async () => {
            try {
                logger.info('Attempting to reconnect to Minecraft server...');
                await createBotFunction();
                logger.info('Reconnection successful');
            } catch (error) {
                logger.error('Reconnection failed:', error);
                this.isReconnecting = false;
                
                // Try again with exponential backoff
                setTimeout(() => {
                    this.startReconnection(createBotFunction);
                }, config.RECONNECT_DELAY);
            }
        }, delay);
    }

    calculateReconnectDelay() {
        // Exponential backoff with jitter
        const baseDelay = config.RECONNECT_DELAY;
        const exponentialDelay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempts - 1), 60000); // Max 60 seconds
        const jitter = Math.random() * 1000; // Add up to 1 second of jitter
        
        return exponentialDelay + jitter;
    }

    shouldNotReconnect(error) {
        const fatalErrors = [
            'Invalid username',
            'Authentication failed',
            'Banned',
            'Whitelist'
        ];

        const errorMessage = error.message || error.toString();
        return fatalErrors.some(fatalError => 
            errorMessage.toLowerCase().includes(fatalError.toLowerCase())
        );
    }

    forceReconnect(createBotFunction) {
        logger.info('Manual reconnection requested');
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        
        this.startReconnection(createBotFunction);
    }

    getStatus() {
        return {
            isReconnecting: this.isReconnecting,
            attempts: this.reconnectAttempts,
            maxAttempts: config.MAX_RECONNECT_ATTEMPTS
        };
    }
}

module.exports = new ReconnectionManager();
