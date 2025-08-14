const config = require('../config/config');
const logger = require('../utils/logger');
const { getSelectedChannelId } = require('./discordCommands');

// Function to format AI messages with cool symbols (no color codes to avoid server issues)
function formatAIMessage(response, username) {
    const prefixes = [
        '✦ AI',           // Star AI
        '⚡ AI',          // Lightning AI  
        '☆ AI',          // Star AI
        '◆ AI',          // Diamond AI
        '▲ AI',          // Triangle AI
        '♦ AI',          // Diamond AI
        '◈ AI',          // Lozenge AI
        '✨ AI',         // Sparkles AI
        '⭐ AI',         // Star AI
        '🔮 AI'          // Crystal ball AI
    ];
    
    // Pick a random prefix
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    
    // Split long messages if needed (Minecraft has ~100 char limit per message)
    if (response.length > 80) {
        const words = response.split(' ');
        let currentMessage = '';
        const messages = [];
        
        for (const word of words) {
            if ((currentMessage + word).length > 75) {
                if (currentMessage) {
                    messages.push(currentMessage.trim());
                    currentMessage = '';
                }
            }
            currentMessage += word + ' ';
        }
        if (currentMessage.trim()) {
            messages.push(currentMessage.trim());
        }
        
        // Return the first message formatted, store others for follow-up
        if (messages.length > 1) {
            // Store remaining messages for sequential sending
            global.pendingAIMessages = global.pendingAIMessages || new Map();
            global.pendingAIMessages.set(username, messages.slice(1));
        }
        
        return `${randomPrefix}: ${messages[0]}`;
    }
    
    // For shorter messages, add some aesthetic touches
    const decorations = ['✦', '⚡', '☆', '◆', '▲', '♦', '◈', '✨', '⭐', '🔮'];
    const randomDecor = decorations[Math.floor(Math.random() * decorations.length)];
    
    return `${randomPrefix}: ${response} ${randomDecor}`;
}

let lastChatTime = 0;
let deathCount = 0;

function registerEvents(bot, discordClient, aiService) {
    
    // Bot spawn event
    bot.on('spawn', () => {
        logger.info(`Bot spawned in Minecraft server: ${config.MINECRAFT_HOST}:${config.MINECRAFT_PORT}`);
        
        // Send notification to Discord
        const channelId = getSelectedChannelId();
        if (discordClient && discordClient.isReady() && channelId) {
            const channel = discordClient.channels.cache.get(channelId);
            if (channel) {
                channel.send('🟢 **[MC]** Bot connected to LifeSteal029 server!');
            }
        }

        // Enable auto-eat if available
        if (config.AUTO_EAT && bot.autoEat) {
            bot.autoEat.enable();
        }
    });

    // Chat events
    bot.on('chat', async (username, message) => {
        if (username === bot.username) return; // Ignore own messages

        logger.info(`[MC Chat] ${username}: ${message}`);

        // Send to Discord
        const channelId = getSelectedChannelId();
        if (discordClient && discordClient.isReady() && channelId) {
            const channel = discordClient.channels.cache.get(channelId);
            if (channel) {
                channel.send(`**[MC]** ${username}: ${message}`);
            }
        }

        // Simple bot commands
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('bot help') || lowerMessage === '!help') {
            bot.chat('✦ AI: I\'m an AI bot! Use Discord commands or just chat with me naturally. ✨');
            return;
        }
        
        if (lowerMessage.includes('bot status') || lowerMessage === '!status') {
            bot.chat(`⚡ AI: Health: ${bot.health.health}/20, Food: ${bot.food}/20, Players: ${Object.keys(bot.players).length} ⭐`);
            return;
        }
        
        if (lowerMessage.includes('bot follow me')) {
            const player = bot.players[username];
            if (player) {
                const GoalFollow = require('mineflayer-pathfinder').goals.GoalFollow;
                bot.pathfinder.setGoal(new GoalFollow(player.entity, 3));
                bot.chat(`Following ${username}!`);
            }
            return;
        }
        
        if (lowerMessage.includes('bot stop')) {
            bot.pathfinder.setGoal(null);
            bot.chat('Stopped!');
            return;
        }
        
        // AI Feedback commands
        if (lowerMessage.includes('bot rate') || lowerMessage.includes('bot feedback')) {
            bot.chat('To rate my response, say: "bot rate [1-5] [helpful/unhelpful/accurate/inaccurate]"');
            return;
        }
        
        // Parse rating command: "bot rate 5 helpful"
        const rateMatch = lowerMessage.match(/bot rate (\d) (helpful|unhelpful|accurate|inaccurate|appropriate|inappropriate)/);
        if (rateMatch) {
            const rating = parseInt(rateMatch[1]);
            const feedbackType = rateMatch[2];
            
            if (rating >= 1 && rating <= 5) {
                // Store temporary feedback for Minecraft
                if (!global.tempMinecraftFeedback) {
                    global.tempMinecraftFeedback = [];
                }
                
                global.tempMinecraftFeedback.push({
                    username: username,
                    rating: rating,
                    feedbackType: feedbackType,
                    source: 'minecraft',
                    timestamp: new Date()
                });
                
                // Also add to global feedback storage
                if (!global.tempFeedbackStorage) {
                    global.tempFeedbackStorage = [];
                }
                global.tempFeedbackStorage.push({
                    username: username,
                    rating: rating,
                    feedbackType: feedbackType,
                    source: 'minecraft',
                    timestamp: new Date()
                });
                
                const stars = '⭐'.repeat(rating);
                bot.chat(`Thanks ${username}! Feedback: ${stars} ${feedbackType}`);
                logger.info(`AI Feedback from Minecraft - ${username}: ${rating}/5 stars, Type: ${feedbackType}`);
            } else {
                bot.chat('Rating must be 1-5 stars!');
            }
            return;
        }

        // AI Response Logic (only for direct mentions)
        try {
            const shouldRespond = await aiService.shouldRespond(message, username);
            
            if (shouldRespond) {
                const currentTime = Date.now();
                if (currentTime - lastChatTime > config.CHAT_COOLDOWN) {
                    
                    const context = {
                        health: bot.health ? bot.health.health : null,
                        food: bot.food || null,
                        timeOfDay: bot.time ? (bot.time.timeOfDay < 6000 ? 'day' : 'night') : null,
                        playersCount: Object.keys(bot.players).length
                    };

                    const response = await aiService.generateResponse(username, message, context);
                    
                    if (response) {
                        // Small delay to make it feel more natural
                        setTimeout(() => {
                            // Format the AI response with cool colors and styling
                            const formattedResponse = formatAIMessage(response, username);
                            bot.chat(formattedResponse);
                            lastChatTime = Date.now();
                            
                            // Send any follow-up messages for long responses
                            const pendingMessages = global.pendingAIMessages?.get(username);
                            if (pendingMessages && pendingMessages.length > 0) {
                                pendingMessages.forEach((msg, index) => {
                                    setTimeout(() => {
                                        bot.chat(`» ${msg}`);
                                    }, (index + 1) * 2000); // 2 second delays between messages
                                });
                                global.pendingAIMessages.delete(username);
                            }
                        }, 1000 + Math.random() * 2000); // 1-3 second delay
                    }
                }
            }
        } catch (error) {
            logger.error('Error in AI chat response:', error);
        }
    });

    // Player join/leave events
    bot.on('playerJoined', (player) => {
        logger.info(`Player joined: ${player.username}`);
        
        if (discordClient && discordClient.isReady() && config.DISCORD_CHANNEL_ID) {
            const channel = discordClient.channels.cache.get(config.DISCORD_CHANNEL_ID);
            if (channel) {
                channel.send(`**[MC]** ➕ ${player.username} joined the server`);
            }
        }

        // Welcome message (occasionally)
        if (Math.random() < 0.3) { // 30% chance
            setTimeout(() => {
                bot.chat(`Welcome to LifeSteal029, ${player.username}! 👋`);
            }, 2000);
        }
    });

    bot.on('playerLeft', (player) => {
        logger.info(`Player left: ${player.username}`);
        
        if (discordClient && discordClient.isReady() && config.DISCORD_CHANNEL_ID) {
            const channel = discordClient.channels.cache.get(config.DISCORD_CHANNEL_ID);
            if (channel) {
                channel.send(`**[MC]** ➖ ${player.username} left the server`);
            }
        }
    });

    // Death event
    bot.on('death', () => {
        deathCount++;
        logger.info(`Bot died (death #${deathCount})`);
        
        if (discordClient && discordClient.isReady() && config.DISCORD_CHANNEL_ID) {
            const channel = discordClient.channels.cache.get(config.DISCORD_CHANNEL_ID);
            if (channel) {
                channel.send(`**[MC]** 💀 Bot died and will respawn (death #${deathCount})`);
            }
        }

        // Auto respawn
        if (config.AUTO_RESPAWN) {
            setTimeout(() => {
                bot.respawn();
                logger.info('Bot respawned automatically');
            }, 2000);
        }
    });

    // Health and food monitoring
    bot.on('health', () => {
        if (bot.health.health <= 5) {
            logger.warn(`Bot health critical: ${bot.health.health}/20`);
            
            // Try to eat if available
            if (config.AUTO_EAT && bot.autoEat) {
                bot.autoEat.enable();
            }
        }

        if (bot.food <= 5) {
            logger.warn(`Bot food critical: ${bot.food}/20`);
        }
    });

    // Kicked event
    bot.on('kicked', (reason) => {
        logger.warn(`Bot was kicked: ${reason}`);
        
        if (discordClient && discordClient.isReady() && config.DISCORD_CHANNEL_ID) {
            const channel = discordClient.channels.cache.get(config.DISCORD_CHANNEL_ID);
            if (channel) {
                channel.send(`**[MC]** ⚠️ Bot was kicked: ${reason}`);
            }
        }
    });

    // Error handling
    bot.on('error', (err) => {
        logger.error('Minecraft bot error:', err);
        
        if (discordClient && discordClient.isReady() && config.DISCORD_CHANNEL_ID) {
            const channel = discordClient.channels.cache.get(config.DISCORD_CHANNEL_ID);
            if (channel) {
                channel.send(`**[MC]** ❌ Bot error: ${err.message}`);
            }
        }
    });

    // End event (disconnect)
    bot.on('end', (reason) => {
        logger.info(`Bot disconnected: ${reason || 'Unknown reason'}`);
        
        if (discordClient && discordClient.isReady() && config.DISCORD_CHANNEL_ID) {
            const channel = discordClient.channels.cache.get(config.DISCORD_CHANNEL_ID);
            if (channel) {
                channel.send(`**[MC]** 🔴 Bot disconnected: ${reason || 'Unknown reason'}`);
            }
        }
    });

    // Message events for admin detection
    bot.on('message', (jsonMsg) => {
        const message = jsonMsg.toString();
        
        // Log server messages
        if (message.includes('Server') || message.includes('Console')) {
            logger.info(`[MC Server] ${message}`);
        }
        
        // Detect teleport or other admin actions
        if (message.includes('Teleported') || message.includes('teleport')) {
            logger.info(`[MC Action] ${message}`);
        }
    });

    // Simple bot commands (merged into main chat handler above)

    // Whisper (private message) handling
    bot.on('whisper', async (username, message) => {
        logger.info(`[MC Whisper] ${username}: ${message}`);
        
        // Always respond to whispers with AI
        try {
            const context = {
                health: bot.health ? bot.health.health : null,
                food: bot.food || null,
                timeOfDay: bot.time ? (bot.time.timeOfDay < 6000 ? 'day' : 'night') : null,
                playersCount: Object.keys(bot.players).length,
                isPrivate: true
            };

            const response = await aiService.generateResponse(username, message, context);
            
            if (response) {
                setTimeout(() => {
                    bot.whisper(username, response);
                }, 1000);
            }
        } catch (error) {
            logger.error('Error responding to whisper:', error);
        }
    });
}

module.exports = {
    registerEvents
};
