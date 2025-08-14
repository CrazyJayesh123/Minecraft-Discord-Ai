const config = require('../config/config');
const logger = require('../utils/logger');
const { getSelectedChannelId } = require('./discordCommands');

function registerEvents(discordClient, getMinecraftBot) {
    
    // Discord ready event
    discordClient.on('ready', () => {
        logger.info(`Discord bot logged in as ${discordClient.user.tag}`);
        discordClient.user.setActivity('LifeSteal029 Server', { type: 'WATCHING' });
    });

    // Discord message handling (for chat bridge and commands)
    discordClient.on('messageCreate', async (message) => {
        // Ignore bot messages
        if (message.author.bot) return;
        
        // Only process messages from the configured channel
        const channelId = getSelectedChannelId();
        if (!channelId || message.channel.id !== channelId) return;

        const bot = getMinecraftBot();
        
        // If message starts with command prefix, ignore (handled by slash commands)
        if (message.content.startsWith(config.COMMAND_PREFIX)) return;
        
        // Bridge Discord messages to Minecraft
        if (bot && bot.player) {
            try {
                // Format the message for Minecraft
                const mcMessage = `[D] ${message.author.username}: ${message.content}`;
                
                // Send to Minecraft (with length limit)
                if (mcMessage.length <= 256) {
                    bot.chat(mcMessage);
                    
                    // React to show message was sent
                    await message.react('✅');
                } else {
                    await message.reply('❌ Message too long for Minecraft chat (max 256 characters)');
                }
                
            } catch (error) {
                logger.error('Error bridging Discord message to Minecraft:', error);
                await message.react('❌');
            }
        } else {
            // Bot not connected
            if (message.content.toLowerCase().includes('bot') || message.content.toLowerCase().includes('minecraft')) {
                await message.reply('⚠️ Minecraft bot is currently offline');
            }
        }
    });

    // Handle message reactions for additional functionality
    discordClient.on('messageReactionAdd', async (reaction, user) => {
        if (user.bot) return;
        
        const bot = getMinecraftBot();
        
        // Allow users to react with specific emojis for quick actions
        if (reaction.emoji.name === '🔄' && bot) {
            // Restart bot action
            if (user.id === config.DISCORD_ADMIN_ID) { // If admin ID is configured
                try {
                    await reaction.message.channel.send('🔄 Admin requested bot restart...');
                    bot.quit();
                } catch (error) {
                    logger.error('Error during admin restart:', error);
                }
            }
        }
        
        if (reaction.emoji.name === '📊' && bot && bot.player) {
            // Quick status
            const status = `🤖 Health: ${bot.health.health}/20 | Food: ${bot.food}/20 | Players: ${Object.keys(bot.players).length}`;
            await reaction.message.channel.send(status);
        }
    });

    // Handle Discord errors
    discordClient.on('error', (error) => {
        logger.error('Discord client error:', error);
    });

    // Handle Discord warnings
    discordClient.on('warn', (warning) => {
        logger.warn('Discord warning:', warning);
    });

    // Handle Discord reconnection
    discordClient.on('reconnecting', () => {
        logger.info('Discord bot reconnecting...');
    });

    discordClient.on('resume', () => {
        logger.info('Discord bot resumed connection');
    });

    // Guild member events (if bot is in a server)
    discordClient.on('guildMemberAdd', (member) => {
        const bot = getMinecraftBot();
        
        if (config.DISCORD_CHANNEL_ID) {
            const channel = discordClient.channels.cache.get(config.DISCORD_CHANNEL_ID);
            if (channel) {
                channel.send(`👋 Welcome to the server, ${member.user.username}! The Minecraft bot is ${bot && bot.player ? 'online' : 'offline'}.`);
            }
        }
    });

    // Handle slash command errors
    discordClient.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        
        // Global error handler for slash commands
        try {
            // Commands are handled in discordCommands.js
            // This is just for logging interaction attempts
            logger.info(`Discord command used: /${interaction.commandName} by ${interaction.user.username}`);
        } catch (error) {
            logger.error('Error in Discord interaction:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: '❌ An error occurred while processing your command.', 
                    ephemeral: true 
                });
            }
        }
    });

    // Handle Discord rate limiting
    discordClient.on('rateLimit', (rateLimitData) => {
        logger.warn('Discord rate limit hit:', rateLimitData);
    });

    // Log Discord debug information if in debug mode
    if (config.DEBUG_MODE) {
        discordClient.on('debug', (info) => {
            if (info.includes('heartbeat') || info.includes('Preparing to connect')) {
                // Skip noisy debug messages
                return;
            }
            logger.debug('Discord debug:', info);
        });
    }
}

module.exports = {
    registerEvents
};
