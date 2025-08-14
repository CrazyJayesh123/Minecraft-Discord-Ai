const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const autoeat = require('mineflayer-auto-eat');
const express = require('express');
const path = require('path');
const cron = require('node-cron');

const config = require('./config/config');
const aiService = require('./services/aiService');
const discordCommands = require('./handlers/discordCommands');
const minecraftEvents = require('./handlers/minecraftEvents');
const discordEvents = require('./handlers/discordEvents');
const logger = require('./utils/logger');
const reconnection = require('./utils/reconnection');
const { storage } = require('./server/storage');

// Global state
let discordClient = null;
let minecraftBot = null;
let isReconnecting = false;

// Web server for status monitoring
const app = express();
app.use(express.static('web'));

// Serve the status dashboard at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'status.html'));
});

// Health check endpoint for Railway deployment
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/status', (req, res) => {
    res.json({
        minecraft: {
            connected: minecraftBot && minecraftBot.player ? true : false,
            username: minecraftBot ? minecraftBot.username : null,
            health: minecraftBot && minecraftBot.health ? minecraftBot.health.health : null,
            food: minecraftBot && minecraftBot.food ? minecraftBot.food : null,
            position: minecraftBot && minecraftBot.entity ? {
                x: Math.round(minecraftBot.entity.position.x),
                y: Math.round(minecraftBot.entity.position.y),
                z: Math.round(minecraftBot.entity.position.z)
            } : null
        },
        discord: {
            connected: discordClient && discordClient.isReady() ? true : false,
            username: discordClient && discordClient.user ? discordClient.user.tag : null
        },
        uptime: process.uptime(),
        lastUpdate: new Date().toISOString()
    });
});

// Add missing feedback API endpoint
app.get('/api/feedback', (req, res) => {
    res.json({
        totalFeedback: 0,
        averageRating: 0,
        mostCommonType: 'none'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Status web server running on http://0.0.0.0:${PORT}`);
});

// Initialize Discord bot
async function initializeDiscord() {
    try {
        discordClient = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        // Register Discord event handlers
        discordEvents.registerEvents(discordClient, () => minecraftBot, storage);

        // Register slash commands with error handling
        const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);
        
        try {
            logger.info('Registering Discord slash commands...');
            const commandData = discordCommands.commands.map(command => command.toJSON());
            
            await rest.put(
                Routes.applicationCommands(config.DISCORD_CLIENT_ID),
                { body: commandData }
            );
            
            logger.info(`Successfully registered ${commandData.length} Discord commands`);
        } catch (commandError) {
            logger.error('Failed to register Discord commands:', commandError);
            // Continue without commands rather than crashing
        }

        // Register command handlers
        discordCommands.registerHandlers(discordClient, () => minecraftBot, storage);

        await discordClient.login(config.DISCORD_TOKEN);
        logger.info('Discord bot logged in successfully');
        
        return discordClient;
    } catch (error) {
        logger.error('Failed to initialize Discord bot:', error);
        throw error;
    }
}

// Initialize Minecraft bot with proper cleanup
async function initializeMinecraft() {
    try {
        // Clean up existing connection if any
        if (minecraftBot && minecraftBot._client && !minecraftBot._client.socket.destroyed) {
            logger.info('Cleaning up existing connection...');
            minecraftBot._client.socket.destroy();
            minecraftBot = null;
            // Wait for cleanup to complete
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        logger.info(`Attempting to connect to Minecraft server: ${config.MINECRAFT_HOST}:${config.MINECRAFT_PORT}`);
        
        minecraftBot = mineflayer.createBot({
            host: config.MINECRAFT_HOST,
            port: config.MINECRAFT_PORT,
            username: config.MINECRAFT_USERNAME,
            auth: 'offline', // Aternos servers typically use offline mode
            version: '1.20.1', // Set specific version instead of auto-detect
            skipValidation: true, // Skip some validations for better compatibility
            hideErrors: true, // Hide protocol errors to prevent crashes
            checkTimeoutInterval: 60000, // Increase timeout to 60 seconds
            packetTimeout: 30000, // Increase packet timeout
            physicsEnabled: false, // Disable physics to reduce packet processing
            respawn: config.AUTO_RESPAWN // Auto respawn on death
        });

        // Add error handlers before other event handlers
        minecraftBot.on('error', (error) => {
            logger.warn('Minecraft bot error (non-fatal):', error.message || error);
            // Don't crash on protocol errors
        });

        minecraftBot.on('kicked', (reason) => {
            logger.warn('Bot was kicked from server:', JSON.stringify(reason));
            // Clear the bot reference to prevent duplicate connections
            if (minecraftBot) {
                minecraftBot.removeAllListeners();
                minecraftBot = null;
            }
        });

        minecraftBot.on('end', (reason) => {
            logger.info('Connection ended:', reason || 'Unknown reason');
            logger.info('Bot disconnected:', reason || 'Unknown reason');
        });

        // Load plugins after spawn with better error handling
        minecraftBot.once('spawn', () => {
            try {
                // Load pathfinder plugin
                if (!minecraftBot.pathfinder) {
                    minecraftBot.loadPlugin(pathfinder);
                    logger.info('Pathfinder plugin loaded successfully');
                }
                
                // Load auto-eat plugin
                if (!minecraftBot.autoEat) {
                    minecraftBot.loadPlugin(autoeat);
                    logger.info('Auto-eat plugin loaded successfully');
                }
                
                logger.info('All plugins loaded successfully');
            } catch (pluginError) {
                logger.warn('Plugin loading error:', {
                    message: pluginError.message,
                    code: pluginError.code,
                    actual: pluginError.actual,
                    expected: pluginError.expected
                });
                // Continue without plugins rather than crashing
            }
        });

        // Register Minecraft event handlers
        minecraftEvents.registerEvents(minecraftBot, discordClient, aiService, storage);

        // Auto-reconnection setup
        reconnection.setupAutoReconnect(minecraftBot, initializeMinecraft);

        logger.info('Minecraft bot connection initiated');
        return minecraftBot;
    } catch (error) {
        logger.error('Failed to initialize Minecraft bot:', error);
        
        // Clear the bot reference on failure
        minecraftBot = null;
        
        // Don't throw error immediately, let reconnection handle it
        if (discordClient && discordClient.isReady() && config.DISCORD_CHANNEL_ID) {
            const channel = discordClient.channels.cache.get(config.DISCORD_CHANNEL_ID);
            if (channel) {
                channel.send('⚠️ **[MC]** Failed to connect to server. Will retry automatically...');
            }
        }
        
        return null;
    }
}

// Health check and auto-eat schedule
cron.schedule('*/30 * * * * *', () => {
    if (minecraftBot && minecraftBot.food < 18) {
        try {
            minecraftBot.autoEat.enable();
        } catch (error) {
            logger.error('Auto-eat error:', error);
        }
    }
});

// Server status check every 5 minutes
cron.schedule('*/5 * * * *', async () => {
    if (discordClient && discordClient.isReady() && config.DISCORD_CHANNEL_ID) {
        try {
            const channel = discordClient.channels.cache.get(config.DISCORD_CHANNEL_ID);
            if (channel && minecraftBot && minecraftBot.player) {
                const players = Object.keys(minecraftBot.players);
                if (players.length > 1) { // More than just the bot
                    const status = `🟢 Server Active - ${players.length} players online`;
                    // Only send if different from last status to avoid spam
                    if (!minecraftBot.lastStatusMessage || minecraftBot.lastStatusMessage !== status) {
                        minecraftBot.lastStatusMessage = status;
                    }
                }
            }
        } catch (error) {
            logger.error('Status check error:', error);
        }
    }
});

// Main initialization
async function main() {
    try {
        logger.info('Starting AI Minecraft Bot...');
        
        // Initialize AI service
        await aiService.initialize();
        
        // Start Discord bot first
        await initializeDiscord();
        
        // Small delay to ensure Discord is ready, then try Minecraft
        setTimeout(async () => {
            try {
                await initializeMinecraft();
            } catch (error) {
                logger.warn('Initial Minecraft connection failed, will retry via reconnection system');
            }
        }, 2000);
        
        logger.info('Bot initialization complete!');
        
    } catch (error) {
        logger.error('Failed to start bot:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('Shutting down bot...');
    if (minecraftBot) {
        minecraftBot.quit();
    }
    if (discordClient) {
        discordClient.destroy();
    }
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    // Don't crash on protocol errors, just log them
    if (error.message && (
        error.message.includes('PartialReadError') || 
        error.message.includes('Read error') ||
        error.message.includes('Chunk size') ||
        error.message.includes('packet')
    )) {
        logger.warn('Protocol error (non-fatal):', error.message);
        return;
    }
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start the bot
main();
