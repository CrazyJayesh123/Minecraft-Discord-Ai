const config = require('../config/config');
const logger = require('../utils/logger');
const { getSelectedChannelId } = require('./discordCommands');
const { EmbedBuilder } = require('discord.js');

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
let lastHealth = 20;
let lastFood = 20;

// Discord notification helper function
function sendDiscordNotification(discordClient, embed, content = null) {
    const channelId = getSelectedChannelId();
    if (!discordClient || !discordClient.isReady() || !channelId) return;
    
    const channel = discordClient.channels.cache.get(channelId);
    if (channel) {
        const messageData = {};
        if (content) messageData.content = content;
        if (embed) messageData.embeds = [embed];
        
        channel.send(messageData).catch(err => {
            logger.error('Failed to send Discord notification:', err);
        });
    }
}

function registerEvents(bot, discordClient, aiService) {
    
    // Bot spawn event - Enhanced notification
    bot.on('spawn', () => {
        logger.info(`Bot spawned in Minecraft server: ${config.MINECRAFT_HOST}:${config.MINECRAFT_PORT}`);
        
        // Create rich embed for spawn notification
        const spawnEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🟢 Bot Connected')
            .setDescription('Successfully connected to LifeSteal029 server!')
            .addFields(
                { name: '🌍 Server', value: `${config.MINECRAFT_HOST}:${config.MINECRAFT_PORT}`, inline: true },
                { name: '👤 Username', value: bot.username || 'Unknown', inline: true },
                { name: '⚡ Health', value: `${bot.health?.health || 20}/20`, inline: true },
                { name: '🍖 Food', value: `${bot.food || 20}/20`, inline: true },
                { name: '🌙 Time', value: bot.time ? (bot.time.timeOfDay < 6000 ? '☀️ Day' : '🌙 Night') : 'Unknown', inline: true },
                { name: '👥 Players Online', value: `${Object.keys(bot.players).length}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'LifeSteal029 Bot Status' });
            
        sendDiscordNotification(discordClient, spawnEmbed);

        // Enable auto-eat if available
        if (config.AUTO_EAT && bot.autoEat) {
            bot.autoEat.enable();
        }
        
        // Initialize health/food tracking
        lastHealth = bot.health?.health || 20;
        lastFood = bot.food || 20;
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

                    // Remove the dot prefix before sending to AI
                    const cleanMessage = message.startsWith('.') ? message.substring(1).trim() : message;
                    const response = await aiService.generateResponse(username, cleanMessage, context);
                    
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

    // Player join event - Enhanced notification
    bot.on('playerJoined', (player) => {
        logger.info(`Player joined: ${player.username}`);
        
        const joinEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('👋 Player Joined')
            .setDescription(`**${player.username}** joined the server`)
            .addFields(
                { name: '👥 Players Online', value: `${Object.keys(bot.players).length}`, inline: true },
                { name: '🌙 Server Time', value: bot.time ? (bot.time.timeOfDay < 6000 ? '☀️ Day' : '🌙 Night') : 'Unknown', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'LifeSteal029 Activity' });
            
        sendDiscordNotification(discordClient, joinEmbed);

        // Welcome message (occasionally)
        if (Math.random() < 0.3) { // 30% chance
            setTimeout(() => {
                bot.chat(`Welcome to LifeSteal029, ${player.username}! 👋`);
            }, 2000);
        }
    });

    bot.on('playerLeft', (player) => {
        logger.info(`Player left: ${player.username}`);
        
        const leaveEmbed = new EmbedBuilder()
            .setColor('#ff6b6b')
            .setTitle('👋 Player Left')
            .setDescription(`**${player.username}** left the server`)
            .addFields(
                { name: '👥 Players Online', value: `${Object.keys(bot.players).length}`, inline: true },
                { name: '🌙 Server Time', value: bot.time ? (bot.time.timeOfDay < 6000 ? '☀️ Day' : '🌙 Night') : 'Unknown', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'LifeSteal029 Activity' });
            
        sendDiscordNotification(discordClient, leaveEmbed);
    });

    // Death event - Enhanced notification
    bot.on('death', () => {
        deathCount++;
        logger.info(`Bot died (death #${deathCount})`);
        
        const deathEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('💀 Bot Died')
            .setDescription('The bot has died and will respawn')
            .addFields(
                { name: '📊 Death Count', value: `${deathCount}`, inline: true },
                { name: '⚰️ Auto Respawn', value: config.AUTO_RESPAWN ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '🌍 Location', value: bot.entity ? `${Math.floor(bot.entity.position.x)}, ${Math.floor(bot.entity.position.y)}, ${Math.floor(bot.entity.position.z)}` : 'Unknown', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'LifeSteal029 Events' });
            
        sendDiscordNotification(discordClient, deathEmbed);

        // Auto respawn
        if (config.AUTO_RESPAWN) {
            setTimeout(() => {
                bot.respawn();
                logger.info('Bot respawned automatically');
                
                // Send respawn notification
                const respawnEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('♻️ Bot Respawned')
                    .setDescription('Successfully respawned after death')
                    .setTimestamp()
                    .setFooter({ text: 'LifeSteal029 Events' });
                    
                sendDiscordNotification(discordClient, respawnEmbed);
            }, 2000);
        }
    });

    // NEW COMPREHENSIVE EVENT NOTIFICATIONS
    
    // Weather change notifications
    bot.on('weather', (weather) => {
        logger.info(`Weather changed: ${weather}`);
        
        const weatherEmojis = {
            'clear': '☀️',
            'rain': '🌧️',
            'thunder': '⛈️'
        };
        
        const weatherEmbed = new EmbedBuilder()
            .setColor(weather === 'clear' ? '#ffff00' : weather === 'rain' ? '#0099ff' : '#800080')
            .setTitle(`${weatherEmojis[weather] || '🌤️'} Weather Changed`)
            .setDescription(`Weather is now **${weather}**`)
            .setTimestamp()
            .setFooter({ text: 'LifeSteal029 Weather' });
            
        sendDiscordNotification(discordClient, weatherEmbed);
    });

    // Time change notifications (Day/Night cycle)
    let lastTimeState = null;
    bot.on('time', () => {
        if (bot.time) {
            const isDay = bot.time.timeOfDay < 6000;
            const currentState = isDay ? 'day' : 'night';
            
            if (lastTimeState !== null && lastTimeState !== currentState) {
                const timeEmbed = new EmbedBuilder()
                    .setColor(isDay ? '#ffff00' : '#000080')
                    .setTitle(`${isDay ? '☀️ Sunrise' : '🌙 Sunset'}`)
                    .setDescription(`It's now ${currentState}time on the server`)
                    .addFields({
                        name: '🕐 Time',
                        value: `${Math.floor(bot.time.timeOfDay / 1000)} minecraft hours`,
                        inline: true
                    })
                    .setTimestamp()
                    .setFooter({ text: 'LifeSteal029 Time' });
                    
                sendDiscordNotification(discordClient, timeEmbed);
            }
            lastTimeState = currentState;
        }
    });

    // Block break/place notifications (for significant blocks)
    bot.on('diggingCompleted', (block) => {
        const significantBlocks = ['diamond_ore', 'emerald_ore', 'gold_ore', 'iron_ore', 'netherite_ancient_debris', 'spawner'];
        
        if (significantBlocks.some(b => block.name.includes(b.split('_')[0]))) {
            const blockEmbed = new EmbedBuilder()
                .setColor('#ff8800')
                .setTitle('⛏️ Block Mined')
                .setDescription(`Bot mined **${block.displayName || block.name}**`)
                .addFields(
                    { name: '🌍 Location', value: `${Math.floor(block.position.x)}, ${Math.floor(block.position.y)}, ${Math.floor(block.position.z)}`, inline: true },
                    { name: '🏷️ Block ID', value: block.name, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'LifeSteal029 Mining' });
                
            sendDiscordNotification(discordClient, blockEmbed);
        }
    });

    // Experience gain notifications
    bot.on('experience', () => {
        if (bot.experience && bot.experience.points > 0 && bot.experience.points % 50 === 0) {
            const expEmbed = new EmbedBuilder()
                .setColor('#00ff80')
                .setTitle('✨ Experience Gained')
                .setDescription('Bot gained experience points')
                .addFields(
                    { name: '⭐ Total XP', value: `${bot.experience.points}`, inline: true },
                    { name: '🎚️ Level', value: `${bot.experience.level}`, inline: true },
                    { name: '📊 Progress', value: `${Math.round(bot.experience.progress * 100)}%`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'LifeSteal029 Progress' });
                
            sendDiscordNotification(discordClient, expEmbed);
        }
    });

    // Entity spawn notifications (for rare mobs)
    bot.on('entitySpawn', (entity) => {
        const rareMobs = ['ender_dragon', 'wither', 'warden', 'elder_guardian', 'shulker'];
        const entityName = entity.displayName || entity.name || 'unknown';
        
        if (rareMobs.some(mob => entityName.toLowerCase().includes(mob))) {
            const entityEmbed = new EmbedBuilder()
                .setColor('#ff0080')
                .setTitle('👹 Rare Entity Spotted')
                .setDescription(`**${entityName}** spawned nearby!`)
                .addFields(
                    { name: '🌍 Location', value: `${Math.floor(entity.position.x)}, ${Math.floor(entity.position.y)}, ${Math.floor(entity.position.z)}`, inline: true },
                    { name: '📏 Distance', value: `${Math.floor(bot.entity.position.distanceTo(entity.position))} blocks`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'LifeSteal029 Entities' });
                
            sendDiscordNotification(discordClient, entityEmbed);
        }
    });

    // Achievement/advancement notifications  
    bot.on('message', (jsonMsg) => {
        try {
            const message = jsonMsg.toString();
            if (message.includes('has made the advancement') || message.includes('has completed the challenge')) {
                const achievementEmbed = new EmbedBuilder()
                    .setColor('#ffd700')
                    .setTitle('🏆 Achievement Unlocked')
                    .setDescription(message)
                    .setTimestamp()
                    .setFooter({ text: 'LifeSteal029 Achievements' });
                    
                sendDiscordNotification(discordClient, achievementEmbed);
            }
        } catch (error) {
            // Ignore parsing errors
        }
    });

    // Health and food monitoring - Enhanced
    bot.on('health', () => {
        const currentHealth = bot.health?.health || 20;
        const currentFood = bot.food || 20;
        
        // Critical health warning
        if (currentHealth <= 5 && lastHealth > 5) {
            logger.warn(`Bot health critical: ${currentHealth}/20`);
            
            const healthEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('⚠️ Critical Health')
                .setDescription('Bot health is critically low!')
                .addFields(
                    { name: '❤️ Health', value: `${currentHealth}/20`, inline: true },
                    { name: '🍖 Food', value: `${currentFood}/20`, inline: true },
                    { name: '🔧 Auto-Eat', value: config.AUTO_EAT ? '✅ Enabled' : '❌ Disabled', inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'LifeSteal029 Health Alert' });
                
            sendDiscordNotification(discordClient, healthEmbed);
            
            // Try to eat if available
            if (config.AUTO_EAT && bot.autoEat) {
                bot.autoEat.enable();
            }
        }

        // Critical food warning  
        if (currentFood <= 5 && lastFood > 5) {
            logger.warn(`Bot food critical: ${currentFood}/20`);
            
            const foodEmbed = new EmbedBuilder()
                .setColor('#ff8800')
                .setTitle('🍖 Low Food')
                .setDescription('Bot is getting hungry!')
                .addFields(
                    { name: '🍖 Food Level', value: `${currentFood}/20`, inline: true },
                    { name: '❤️ Health', value: `${currentHealth}/20`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'LifeSteal029 Food Alert' });
                
            sendDiscordNotification(discordClient, foodEmbed);
        }
        
        lastHealth = currentHealth;
        lastFood = currentFood;
    });

    // Enhanced kick event notification
    bot.on('kicked', (reason) => {
        logger.warn(`Bot was kicked: ${reason}`);
        
        const kickEmbed = new EmbedBuilder()
            .setColor('#ff8800')
            .setTitle('⚠️ Bot Kicked')
            .setDescription('The bot was kicked from the server')
            .addFields(
                { name: '📝 Reason', value: reason || 'No reason provided', inline: true },
                { name: '🔄 Auto-Reconnect', value: '✅ Will attempt to reconnect', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'LifeSteal029 Moderation' });
            
        sendDiscordNotification(discordClient, kickEmbed);
    });

    // Enhanced error handling notification
    bot.on('error', (err) => {
        logger.error('Minecraft bot error:', err);
        
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Bot Error')
            .setDescription('The bot encountered an error')
            .addFields(
                { name: '🐛 Error Type', value: err.code || 'Unknown', inline: true },
                { name: '📝 Message', value: err.message?.substring(0, 100) || 'No message', inline: true },
                { name: '🔄 Status', value: 'Will attempt to recover', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'LifeSteal029 Error Log' });
            
        sendDiscordNotification(discordClient, errorEmbed);
    });

    // Enhanced disconnect event notification
    bot.on('end', (reason) => {
        logger.info(`Bot disconnected: ${reason || 'Unknown reason'}`);
        
        const disconnectEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🔴 Bot Disconnected')
            .setDescription('The bot has disconnected from the server')
            .addFields(
                { name: '📝 Reason', value: reason || 'Unknown reason', inline: true },
                { name: '🔄 Auto-Reconnect', value: '✅ Will attempt to reconnect', inline: true },
                { name: '📊 Session Stats', value: `Deaths: ${deathCount}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'LifeSteal029 Connection' });
            
        sendDiscordNotification(discordClient, disconnectEmbed);
        
        // Reset session stats for next connection
        deathCount = 0;
    });

    // ADDITIONAL COMPREHENSIVE EVENT NOTIFICATIONS
    
    // Combat/damage notifications
    bot.on('attackedTarget', (entity) => {
        const entityName = entity.displayName || entity.name;
        if (entityName) {
            logger.info(`Bot attacked: ${entityName}`);
            
            const combatEmbed = new EmbedBuilder()
                .setColor('#ff4500')
                .setTitle('⚔️ Combat Action')
                .setDescription(`Bot attacked a **${entityName}**`)
                .addFields(
                    { name: '🎯 Target', value: entityName, inline: true },
                    { name: '❤️ Bot Health', value: `${bot.health?.health || 20}/20`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'LifeSteal029 Combat' });
                
            sendDiscordNotification(discordClient, combatEmbed);
        }
    });

    // Item pickup notifications (for valuable items)
    bot.on('playerCollect', (collector, collected) => {
        if (collector.username === bot.username) {
            const valuableItems = ['diamond', 'emerald', 'gold', 'iron', 'netherite', 'enchanted', 'totem'];
            const itemName = collected.name || 'item';
            
            if (valuableItems.some(v => itemName.toLowerCase().includes(v))) {
                const pickupEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('💎 Valuable Item Collected')
                    .setDescription(`Bot picked up **${itemName}**`)
                    .addFields(
                        { name: '📦 Item', value: itemName, inline: true },
                        { name: '🔢 Count', value: `${collected.count || 1}`, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'LifeSteal029 Inventory' });
                    
                sendDiscordNotification(discordClient, pickupEmbed);
            }
        }
    });

    // Bed/spawn point notifications
    bot.on('spawnReset', () => {
        const spawnEmbed = new EmbedBuilder()
            .setColor('#0080ff')
            .setTitle('🛏️ Spawn Point Set')
            .setDescription('Bot set a new spawn point')
            .addFields({
                name: '🌍 Location', 
                value: bot.entity ? `${Math.floor(bot.entity.position.x)}, ${Math.floor(bot.entity.position.y)}, ${Math.floor(bot.entity.position.z)}` : 'Unknown',
                inline: true
            })
            .setTimestamp()
            .setFooter({ text: 'LifeSteal029 Spawn' });
            
        sendDiscordNotification(discordClient, spawnEmbed);
    });

    // Inventory full notifications
    bot.on('windowOpen', (window) => {
        if (window.type === 'minecraft:generic_9x1' || window.type === 'minecraft:player') {
            let filledSlots = 0;
            let totalSlots = 0;
            
            for (const slot of window.slots) {
                totalSlots++;
                if (slot && slot.type !== -1) filledSlots++;
            }
            
            if (filledSlots / totalSlots > 0.9) { // 90% full
                const inventoryEmbed = new EmbedBuilder()
                    .setColor('#ff8800')
                    .setTitle('🎒 Inventory Nearly Full')
                    .setDescription('Bot inventory is getting full')
                    .addFields(
                        { name: '📊 Used Slots', value: `${filledSlots}/${totalSlots}`, inline: true },
                        { name: '📈 Usage', value: `${Math.round((filledSlots/totalSlots)*100)}%`, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'LifeSteal029 Inventory' });
                    
                sendDiscordNotification(discordClient, inventoryEmbed);
            }
        }
    });

    // Portal usage notifications  
    bot.on('message', (jsonMsg) => {
        try {
            const message = jsonMsg.toString();
            if (message.includes(bot.username) && (message.includes('portal') || message.includes('dimension'))) {
                const portalEmbed = new EmbedBuilder()
                    .setColor('#800080')
                    .setTitle('🌀 Portal Activity')
                    .setDescription(message)
                    .setTimestamp()
                    .setFooter({ text: 'LifeSteal029 Travel' });
                    
                sendDiscordNotification(discordClient, portalEmbed);
            }
        } catch (error) {
            // Ignore parsing errors
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
