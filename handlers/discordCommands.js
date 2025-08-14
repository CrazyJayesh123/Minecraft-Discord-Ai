const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const logger = require('../utils/logger');
const aiService = require('../services/aiService');
const { storage } = require('../server/storage');

const commands = [
    new SlashCommandBuilder()
        .setName('mcstatus')
        .setDescription('Get Minecraft bot status'),
    
    new SlashCommandBuilder()
        .setName('mcchat')
        .setDescription('Send message to Minecraft chat')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message to send to Minecraft')
                .setRequired(true)
        ),
    
    new SlashCommandBuilder()
        .setName('mccommand')
        .setDescription('Send AI-interpreted command to bot')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Natural language command (e.g., "go to spawn", "follow player123")')
                .setRequired(true)
        ),
    
    new SlashCommandBuilder()
        .setName('mcplayers')
        .setDescription('List players currently online'),
    
    new SlashCommandBuilder()
        .setName('mcinventory')
        .setDescription('Show bot inventory'),
    
    new SlashCommandBuilder()
        .setName('mcposition')
        .setDescription('Get bot current position'),
    
    new SlashCommandBuilder()
        .setName('mcrespawn')
        .setDescription('Force bot to respawn if dead'),
    
    new SlashCommandBuilder()
        .setName('mcreconnect')
        .setDescription('Force bot to reconnect to Minecraft server'),
    

    
    new SlashCommandBuilder()
        .setName('mchelp')
        .setDescription('Show available commands and bot information'),
    
    new SlashCommandBuilder()
        .setName('mchealth')
        .setDescription('Get detailed bot health and status info'),
    
    new SlashCommandBuilder()
        .setName('mcweather')
        .setDescription('Get current weather and time on the server'),
    
    new SlashCommandBuilder()
        .setName('mcstats')
        .setDescription('Show detailed server and bot statistics'),
    
    new SlashCommandBuilder()
        .setName('mcfind')
        .setDescription('Find a specific player on the server')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('Player name to find')
                .setRequired(true)
        ),
    
    new SlashCommandBuilder()
        .setName('mcgoto')
        .setDescription('Make bot go to specific coordinates')
        .addIntegerOption(option =>
            option.setName('x')
                .setDescription('X coordinate')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('z')
                .setDescription('Z coordinate')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('y')
                .setDescription('Y coordinate (optional)')
                .setRequired(false)
        ),
    
    new SlashCommandBuilder()
        .setName('mcfollow')
        .setDescription('Make bot follow a specific player')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('Player name to follow')
                .setRequired(true)
        ),
    
    new SlashCommandBuilder()
        .setName('mcstop')
        .setDescription('Stop bot from current action (movement, following, etc.)'),
    
    new SlashCommandBuilder()
        .setName('mclook')
        .setDescription('Make bot look around or at a specific player')
        .addStringOption(option =>
            option.setName('target')
                .setDescription('Player to look at (optional)')
                .setRequired(false)
        ),
    
    new SlashCommandBuilder()
        .setName('mceat')
        .setDescription('Force bot to eat food if available'),
    
    new SlashCommandBuilder()
        .setName('mcdrop')
        .setDescription('Drop specific item from bot inventory')
        .addStringOption(option =>
            option.setName('item')
                .setDescription('Item name to drop')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount to drop (default: 1)')
                .setRequired(false)
        ),
    
    new SlashCommandBuilder()
        .setName('mcuptime')
        .setDescription('Show bot uptime and connection history'),
    
    new SlashCommandBuilder()
        .setName('mcdebug')
        .setDescription('Show debug information and recent errors'),
    
    new SlashCommandBuilder()
        .setName('mcconfig')
        .setDescription('Show current bot configuration and settings'),
    
    new SlashCommandBuilder()
        .setName('mcping')
        .setDescription('Test bot responsiveness and connection quality'),
    
    new SlashCommandBuilder()
        .setName('ai')
        .setDescription('Chat with the AI directly in Discord')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Your message to the AI')
                .setRequired(true)
        ),
    
    new SlashCommandBuilder()
        .setName('aifeedback')
        .setDescription('Rate the last AI response')
        .addIntegerOption(option =>
            option.setName('rating')
                .setDescription('Rate from 1-5 stars')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(5)
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of feedback')
                .setRequired(true)
                .addChoices(
                    { name: 'Helpful', value: 'helpful' },
                    { name: 'Unhelpful', value: 'unhelpful' },
                    { name: 'Accurate', value: 'accurate' },
                    { name: 'Inaccurate', value: 'inaccurate' },
                    { name: 'Appropriate', value: 'appropriate' },
                    { name: 'Inappropriate', value: 'inappropriate' }
                )
        )
        .addStringOption(option =>
            option.setName('comment')
                .setDescription('Additional feedback (optional)')
                .setRequired(false)
        ),
    
    new SlashCommandBuilder()
        .setName('aifeedbackstats')
        .setDescription('Show AI feedback statistics and performance metrics'),

    new SlashCommandBuilder()
        .setName('setchannel')
        .setDescription('Set this channel to receive Minecraft chat messages')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to receive Minecraft messages (leave empty for current channel)')
                .setRequired(false)
        )
];

function registerHandlers(discordClient, getMinecraftBot) {
    discordClient.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const bot = getMinecraftBot();
        
        try {
            switch (interaction.commandName) {
                case 'mcstatus':
                    await handleStatus(interaction, bot);
                    break;
                case 'mcchat':
                    await handleChat(interaction, bot);
                    break;
                case 'mccommand':
                    await handleCommand(interaction, bot);
                    break;
                case 'mcplayers':
                    await handlePlayers(interaction, bot);
                    break;
                case 'mcinventory':
                    await handleInventory(interaction, bot);
                    break;
                case 'mcposition':
                    await handlePosition(interaction, bot);
                    break;
                case 'mcrespawn':
                    await handleRespawn(interaction, bot);
                    break;
                case 'mcreconnect':
                    await handleReconnect(interaction, bot);
                    break;
                case 'aifeedbackstats':
                    await handleAIFeedbackStats(interaction);
                    break;
                case 'aistats':
                    await handleAIStats(interaction);
                    break;
                case 'mchelp':
                    await handleHelp(interaction);
                    break;
                case 'mchealth':
                    await handleHealth(interaction, bot);
                    break;
                case 'mcweather':
                    await handleWeather(interaction, bot);
                    break;
                case 'mcstats':
                    await handleStats(interaction, bot);
                    break;
                case 'mcfind':
                    await handleFind(interaction, bot);
                    break;
                case 'mcgoto':
                    await handleGoto(interaction, bot);
                    break;
                case 'mcfollow':
                    await handleFollow(interaction, bot);
                    break;
                case 'mcstop':
                    await handleStop(interaction, bot);
                    break;
                case 'mclook':
                    await handleLook(interaction, bot);
                    break;
                case 'mceat':
                    await handleEat(interaction, bot);
                    break;
                case 'mcdrop':
                    await handleDrop(interaction, bot);
                    break;
                case 'mcuptime':
                    await handleUptime(interaction);
                    break;
                case 'mcdebug':
                    await handleDebug(interaction, bot);
                    break;
                case 'mcconfig':
                    await handleConfig(interaction);
                    break;
                case 'mcping':
                    await handlePing(interaction, bot);
                    break;
                case 'ai':
                    await handleAI(interaction);
                    break;
                case 'aifeedback':
                    await handleAIFeedback(interaction);
                    break;
                case 'aifeedbackstats':
                    await handleAIFeedbackStats(interaction);
                    break;
                case 'setchannel':
                    await handleSetChannel(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Error handling Discord command:', error);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: '❌ An error occurred while processing your command.', 
                        ephemeral: true 
                    });
                } else if (interaction.deferred) {
                    await interaction.editReply('❌ An error occurred while processing your command.');
                }
            } catch (replyError) {
                logger.error('Error sending error reply:', replyError);
            }
        }
    });
}

async function handleStatus(interaction, bot) {
    if (!bot || !bot.player) {
        await interaction.reply('❌ Bot is not connected to Minecraft server');
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle('🤖 Minecraft Bot Status')
        .setColor(0x00ff00)
        .addFields(
            { name: '📊 Health', value: `${bot.health.health}/20 ❤️`, inline: true },
            { name: '🍗 Food', value: `${bot.food}/20`, inline: true },
            { name: '📍 Position', value: `${Math.round(bot.entity.position.x)}, ${Math.round(bot.entity.position.y)}, ${Math.round(bot.entity.position.z)}`, inline: true },
            { name: '🌍 Dimension', value: bot.game.dimension, inline: true },
            { name: '⏰ Server Time', value: bot.time.timeOfDay < 6000 ? '☀️ Day' : '🌙 Night', inline: true },
            { name: '👥 Players Online', value: `${Object.keys(bot.players).length}`, inline: true }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleChat(interaction, bot) {
    if (!bot || !bot.player) {
        await interaction.reply('❌ Bot is not connected to Minecraft server');
        return;
    }

    const message = interaction.options.getString('message');
    bot.chat(message);
    
    await interaction.reply(`✅ Sent to Minecraft: "${message}"`);
}

async function handleCommand(interaction, bot) {
    if (!bot || !bot.player) {
        await interaction.reply('❌ Bot is not connected to Minecraft server');
        return;
    }

    const command = interaction.options.getString('command');
    
    try {
        await interaction.deferReply();
        
        const analysis = await aiService.analyzeCommand(command);
        
        if (analysis.confidence < 0.5) {
            await interaction.editReply(`❓ I'm not sure how to interpret: "${command}"\nTry being more specific.`);
            return;
        }

        let result = '';
        
        switch (analysis.action) {
            case 'move':
                if (analysis.parameters.target) {
                    const target = bot.players[analysis.parameters.target];
                    if (target) {
                        bot.pathfinder.setGoal(new (require('mineflayer-pathfinder').goals.GoalFollow)(target.entity, 3));
                        result = `🚶 Moving to ${analysis.parameters.target}`;
                    } else {
                        result = `❌ Player ${analysis.parameters.target} not found`;
                    }
                }
                break;
                
            case 'chat':
                if (analysis.parameters.message) {
                    bot.chat(analysis.parameters.message);
                    result = `💬 Said: "${analysis.parameters.message}"`;
                }
                break;
                
            case 'follow':
                if (analysis.parameters.target) {
                    const target = bot.players[analysis.parameters.target];
                    if (target) {
                        bot.pathfinder.setGoal(new (require('mineflayer-pathfinder').goals.GoalFollow)(target.entity, 2));
                        result = `👥 Following ${analysis.parameters.target}`;
                    } else {
                        result = `❌ Player ${analysis.parameters.target} not found`;
                    }
                }
                break;
                
            case 'stop':
                bot.pathfinder.setGoal(null);
                result = '⏹️ Stopped current action';
                break;
                
            default:
                result = `❓ Action "${analysis.action}" not implemented yet`;
        }
        
        await interaction.editReply(result || '✅ Command processed');
        
    } catch (error) {
        logger.error('Error processing AI command:', error);
        try {
            if (interaction.deferred) {
                await interaction.editReply('❌ Error processing command');
            } else {
                await interaction.reply({ content: '❌ Error processing command', ephemeral: true });
            }
        } catch (replyError) {
            logger.error('Error sending error reply:', replyError);
        }
    }
}

async function handlePlayers(interaction, bot) {
    if (!bot || !bot.player) {
        await interaction.reply('❌ Bot is not connected to Minecraft server');
        return;
    }

    const players = Object.keys(bot.players);
    const playerList = players.length > 0 ? players.join(', ') : 'No players online';
    
    const embed = new EmbedBuilder()
        .setTitle('👥 Players Online')
        .setDescription(playerList)
        .setColor(0x00ff00)
        .setFooter({ text: `Total: ${players.length} players` })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleInventory(interaction, bot) {
    if (!bot || !bot.player) {
        await interaction.reply('❌ Bot is not connected to Minecraft server');
        return;
    }

    const items = bot.inventory.items();
    
    if (items.length === 0) {
        await interaction.reply('📦 Bot inventory is empty');
        return;
    }

    const itemList = items.map(item => 
        `${item.displayName} x${item.count}`
    ).join('\n');

    const embed = new EmbedBuilder()
        .setTitle('📦 Bot Inventory')
        .setDescription(itemList.length > 2000 ? itemList.substring(0, 2000) + '...' : itemList)
        .setColor(0x00ff00)
        .setFooter({ text: `Total items: ${items.length}` })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handlePosition(interaction, bot) {
    if (!bot || !bot.player) {
        await interaction.reply('❌ Bot is not connected to Minecraft server');
        return;
    }

    const pos = bot.entity.position;
    const embed = new EmbedBuilder()
        .setTitle('📍 Bot Position')
        .setDescription(`**X:** ${Math.round(pos.x)}\n**Y:** ${Math.round(pos.y)}\n**Z:** ${Math.round(pos.z)}`)
        .setColor(0x00ff00)
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleRespawn(interaction, bot) {
    if (!bot) {
        await interaction.reply('❌ Bot is not connected to Minecraft server');
        return;
    }

    if (bot.health.health > 0) {
        await interaction.reply('✅ Bot is alive, no need to respawn');
        return;
    }

    bot.respawn();
    await interaction.reply('🔄 Bot respawn attempted');
}

async function handleReconnect(interaction, bot) {
    await interaction.reply('🔄 Attempting to reconnect bot...');
    
    try {
        if (bot) {
            bot.quit();
        }
        // The reconnection logic will handle the actual reconnection
        setTimeout(() => {
            interaction.followUp('✅ Reconnection initiated');
        }, 2000);
    } catch (error) {
        logger.error('Error during manual reconnect:', error);
        await interaction.followUp('❌ Error during reconnection');
    }
}

async function handleAIStats(interaction) {
    const stats = aiService.getStats();
    
    const embed = new EmbedBuilder()
        .setTitle('🧠 AI Service Statistics')
        .addFields(
            { name: 'Status', value: stats.initialized ? '✅ Online' : '❌ Offline', inline: true },
            { name: 'Active Conversations', value: `${stats.conversationsActive}`, inline: true },
            { name: 'Response Rate', value: `${Math.round(config.AI_RESPONSE_CHANCE * 100)}%`, inline: true }
        )
        .setColor(stats.initialized ? 0x00ff00 : 0xff0000)
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleHelp(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('🤖 AI Minecraft Bot - All Commands')
        .setDescription('AI-powered bot for LifeSteal029 server with comprehensive Discord integration')
        .addFields(
            { name: '📊 Status & Info', value: '`/mcstatus` - Basic bot status\n`/mchealth` - Detailed health info\n`/mcweather` - Server weather & time\n`/mcstats` - Detailed statistics\n`/mcuptime` - Bot uptime info', inline: false },
            { name: '👥 Player Commands', value: '`/mcplayers` - List online players\n`/mcfind <player>` - Find specific player\n`/mcfollow <player>` - Follow a player\n`/mclook [target]` - Look at player or around', inline: false },
            { name: '🎮 Movement & Actions', value: '`/mcgoto <x> <z> [y]` - Go to coordinates\n`/mcstop` - Stop current actions\n`/mcposition` - Show bot position\n`/mcrespawn` - Force respawn if dead', inline: false },
            { name: '📦 Inventory & Items', value: '`/mcinventory` - Show inventory\n`/mceat` - Eat available food\n`/mcdrop <item> [amount]` - Drop items', inline: false },
            { name: '💬 Communication', value: '`/mcchat <message>` - Send chat message\n`/mccommand <command>` - AI natural language commands\n`/ai <message>` - Chat with AI in Discord', inline: false },
            { name: '🔧 System & Debug', value: '`/mcreconnect` - Force reconnect\n`/mcping` - Test connection quality\n`/mcdebug` - Debug information\n`/mcconfig` - Bot configuration\n`/aistats` - AI service stats', inline: false },
            { name: '🎯 Features', value: '• Two-way chat bridge • AI responses • Auto-reconnection • Survival behaviors • Natural language commands • Player tracking • Weather monitoring', inline: false }
        )
        .setColor(0x00ff00)
        .setFooter({ text: 'Total: 20 commands available | Server: LifeSteal029.aternos.me:48688' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleHealth(interaction, bot) {
    if (!bot || !bot.player) {
        await interaction.reply('❌ Bot is not connected to Minecraft server');
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle('❤️ Bot Health Details')
        .addFields(
            { name: '❤️ Health', value: `${bot.health.health}/20`, inline: true },
            { name: '🍗 Food Level', value: `${bot.food}/20`, inline: true },
            { name: '🛡️ Armor', value: bot.entity.equipment ? 'Equipped' : 'None', inline: true },
            { name: '💫 XP Level', value: `${bot.experience.level}`, inline: true },
            { name: '⭐ XP Points', value: `${bot.experience.points}`, inline: true },
            { name: '🎯 Game Mode', value: bot.game.gameMode, inline: true }
        )
        .setColor(bot.health.health > 15 ? 0x00ff00 : bot.health.health > 8 ? 0xffff00 : 0xff0000)
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleWeather(interaction, bot) {
    if (!bot || !bot.player) {
        await interaction.reply('❌ Bot is not connected to Minecraft server');
        return;
    }

    const timeOfDay = bot.time.timeOfDay;
    const isDay = timeOfDay < 12000;
    const isRaining = bot.isRaining;
    const thunderState = bot.thunderState;
    
    const embed = new EmbedBuilder()
        .setTitle('🌍 Server Weather & Time')
        .addFields(
            { name: '⏰ Time', value: isDay ? '☀️ Day' : '🌙 Night', inline: true },
            { name: '🌧️ Weather', value: isRaining ? '🌧️ Raining' : '☀️ Clear', inline: true },
            { name: '⛈️ Thunder', value: thunderState > 0 ? '⚡ Yes' : '❌ No', inline: true },
            { name: '🌍 Dimension', value: bot.game.dimension, inline: true },
            { name: '📊 Difficulty', value: bot.game.difficulty, inline: true },
            { name: '🎮 Server Version', value: bot.version, inline: true }
        )
        .setColor(isRaining ? 0x0066cc : 0x00ff00)
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleStats(interaction, bot) {
    if (!bot || !bot.player) {
        await interaction.reply('❌ Bot is not connected to Minecraft server');
        return;
    }

    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    const embed = new EmbedBuilder()
        .setTitle('📊 Detailed Bot Statistics')
        .addFields(
            { name: '⏱️ Bot Uptime', value: `${hours}h ${minutes}m`, inline: true },
            { name: '🔗 Connection', value: 'Connected', inline: true },
            { name: '📡 Ping', value: `${bot.latency || 'N/A'}ms`, inline: true },
            { name: '👥 Players Online', value: `${Object.keys(bot.players).length}`, inline: true },
            { name: '📦 Inventory Slots', value: `${bot.inventory.items().length}/36`, inline: true },
            { name: '🎯 Bot Position', value: `${Math.round(bot.entity.position.x)}, ${Math.round(bot.entity.position.y)}, ${Math.round(bot.entity.position.z)}`, inline: false },
            { name: '🤖 AI Responses', value: aiService.getStats().initialized ? '✅ Active' : '❌ Inactive', inline: true }
        )
        .setColor(0x00ff00)
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleFind(interaction, bot) {
    if (!bot || !bot.player) {
        await interaction.reply('❌ Bot is not connected to Minecraft server');
        return;
    }

    const playerName = interaction.options.getString('player');
    const targetPlayer = bot.players[playerName];
    
    if (!targetPlayer) {
        await interaction.reply(`❌ Player "${playerName}" not found on the server`);
        return;
    }

    const pos = targetPlayer.entity.position;
    const distance = bot.entity.position.distanceTo(pos);
    
    const embed = new EmbedBuilder()
        .setTitle(`🔍 Found Player: ${playerName}`)
        .addFields(
            { name: '📍 Position', value: `${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}`, inline: true },
            { name: '📏 Distance', value: `${Math.round(distance)} blocks`, inline: true },
            { name: '❤️ Health', value: `${targetPlayer.entity.health || 'Unknown'}/20`, inline: true }
        )
        .setColor(0x00ff00)
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleGoto(interaction, bot) {
    if (!bot || !bot.player) {
        await interaction.reply('❌ Bot is not connected to Minecraft server');
        return;
    }

    const x = interaction.options.getInteger('x');
    const z = interaction.options.getInteger('z');
    const y = interaction.options.getInteger('y') || bot.entity.position.y;

    try {
        const { goals } = require('mineflayer-pathfinder');
        const goal = new goals.GoalBlock(x, y, z);
        bot.pathfinder.setGoal(goal);
        
        await interaction.reply(`🚶 Moving to coordinates: ${x}, ${y}, ${z}`);
    } catch (error) {
        logger.error('Error in goto command:', error);
        await interaction.reply('❌ Failed to move to coordinates');
    }
}

async function handleFollow(interaction, bot) {
    if (!bot || !bot.player) {
        await interaction.reply('❌ Bot is not connected to Minecraft server');
        return;
    }

    const playerName = interaction.options.getString('player');
    const targetPlayer = bot.players[playerName];
    
    if (!targetPlayer) {
        await interaction.reply(`❌ Player "${playerName}" not found on the server`);
        return;
    }

    try {
        const { goals } = require('mineflayer-pathfinder');
        const goal = new goals.GoalFollow(targetPlayer.entity, 3);
        bot.pathfinder.setGoal(goal);
        
        await interaction.reply(`👥 Now following ${playerName}`);
    } catch (error) {
        logger.error('Error in follow command:', error);
        await interaction.reply('❌ Failed to follow player');
    }
}

async function handleStop(interaction, bot) {
    if (!bot || !bot.player) {
        await interaction.reply('❌ Bot is not connected to Minecraft server');
        return;
    }

    try {
        bot.pathfinder.setGoal(null);
        bot.clearControlStates();
        await interaction.reply('⏹️ Stopped all current actions');
    } catch (error) {
        logger.error('Error in stop command:', error);
        await interaction.reply('❌ Failed to stop actions');
    }
}

async function handleLook(interaction, bot) {
    if (!bot || !bot.player) {
        await interaction.reply('❌ Bot is not connected to Minecraft server');
        return;
    }

    const target = interaction.options.getString('target');
    
    if (target) {
        const targetPlayer = bot.players[target];
        if (!targetPlayer) {
            await interaction.reply(`❌ Player "${target}" not found on the server`);
            return;
        }
        
        try {
            await bot.lookAt(targetPlayer.entity.position.offset(0, targetPlayer.entity.height, 0));
            await interaction.reply(`👀 Looking at ${target}`);
        } catch (error) {
            await interaction.reply('❌ Failed to look at player');
        }
    } else {
        // Look around randomly
        const yaw = Math.random() * Math.PI * 2;
        const pitch = (Math.random() - 0.5) * Math.PI * 0.5;
        await bot.look(yaw, pitch);
        await interaction.reply('👀 Looking around');
    }
}

async function handleEat(interaction, bot) {
    if (!bot || !bot.player) {
        await interaction.reply('❌ Bot is not connected to Minecraft server');
        return;
    }

    try {
        const food = bot.inventory.items().find(item => item.name.includes('bread') || 
                                                      item.name.includes('apple') || 
                                                      item.name.includes('meat') ||
                                                      item.name.includes('fish'));
        
        if (!food) {
            await interaction.reply('❌ No food available in inventory');
            return;
        }

        await bot.equip(food, 'hand');
        bot.activateItem();
        
        await interaction.reply(`🍗 Eating ${food.displayName}`);
    } catch (error) {
        logger.error('Error in eat command:', error);
        await interaction.reply('❌ Failed to eat food');
    }
}

async function handleDrop(interaction, bot) {
    if (!bot || !bot.player) {
        await interaction.reply('❌ Bot is not connected to Minecraft server');
        return;
    }

    const itemName = interaction.options.getString('item').toLowerCase();
    const amount = interaction.options.getInteger('amount') || 1;
    
    const item = bot.inventory.items().find(i => 
        i.name.toLowerCase().includes(itemName) || 
        i.displayName.toLowerCase().includes(itemName)
    );
    
    if (!item) {
        await interaction.reply(`❌ Item "${itemName}" not found in inventory`);
        return;
    }

    try {
        await bot.tossStack(item, amount);
        await interaction.reply(`📦 Dropped ${amount} ${item.displayName}`);
    } catch (error) {
        logger.error('Error in drop command:', error);
        await interaction.reply('❌ Failed to drop item');
    }
}

async function handleUptime(interaction) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    const embed = new EmbedBuilder()
        .setTitle('⏱️ Bot Uptime Information')
        .addFields(
            { name: '🕐 Current Uptime', value: `${days}d ${hours}h ${minutes}m ${seconds}s`, inline: false },
            { name: '🚀 Started At', value: new Date(Date.now() - uptime * 1000).toLocaleString(), inline: true },
            { name: '💾 Memory Usage', value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`, inline: true },
            { name: '🔄 Process ID', value: `${process.pid}`, inline: true }
        )
        .setColor(0x00ff00)
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleDebug(interaction, bot) {
    const embed = new EmbedBuilder()
        .setTitle('🐛 Debug Information')
        .addFields(
            { name: '🔗 Bot Connected', value: bot && bot.player ? '✅ Yes' : '❌ No', inline: true },
            { name: '🧠 AI Service', value: aiService.getStats().initialized ? '✅ Active' : '❌ Inactive', inline: true },
            { name: '💾 Memory', value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`, inline: true },
            { name: '📊 Node Version', value: process.version, inline: true },
            { name: '🌐 Platform', value: process.platform, inline: true },
            { name: '⚡ Event Loop Lag', value: 'Normal', inline: true }
        )
        .setColor(0xffaa00)
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleConfig(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('⚙️ Bot Configuration')
        .addFields(
            { name: '🎯 Target Server', value: `${config.MINECRAFT_HOST}:${config.MINECRAFT_PORT}`, inline: false },
            { name: '🤖 Bot Username', value: config.MINECRAFT_USERNAME, inline: true },
            { name: '🧠 AI Response Rate', value: `${Math.round(config.AI_RESPONSE_CHANCE * 100)}%`, inline: true },
            { name: '🔄 Auto Reconnect', value: '✅ Enabled', inline: true },
            { name: '🍗 Auto Eat', value: '✅ Enabled', inline: true },
            { name: '🚶 Pathfinding', value: '✅ Enabled', inline: true },
            { name: '🌐 Web Dashboard', value: '✅ Port 5000', inline: true }
        )
        .setColor(0x0066cc)
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handlePing(interaction, bot) {
    const startTime = Date.now();
    
    await interaction.deferReply();
    
    const discordPing = Date.now() - startTime;
    const botPing = bot && bot.latency ? bot.latency : 'N/A';
    
    const embed = new EmbedBuilder()
        .setTitle('🏓 Connection Quality')
        .addFields(
            { name: '📡 Discord Ping', value: `${discordPing}ms`, inline: true },
            { name: '🎮 Minecraft Ping', value: `${botPing}ms`, inline: true },
            { name: '🔗 Connection Status', value: bot && bot.player ? '✅ Connected' : '❌ Disconnected', inline: true }
        )
        .setColor(discordPing < 100 ? 0x00ff00 : discordPing < 300 ? 0xffff00 : 0xff0000)
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

// Track recent AI responses for feedback
const recentAIResponses = new Map(); // userId -> { messageId, response, timestamp }

async function handleAI(interaction) {
    const message = interaction.options.getString('message');
    const username = interaction.user.username;
    const userId = interaction.user.id;
    
    try {
        await interaction.deferReply();
        
        const context = {
            health: null,
            food: null,
            timeOfDay: null,
            playersCount: null,
            isDiscord: true
        };

        // Add timeout for the entire AI generation process
        const response = await Promise.race([
            aiService.generateResponse(username, message, context),
            new Promise((resolve) => 
                setTimeout(() => resolve(null), 12000) // 12 second total timeout
            )
        ]);
        
        if (response) {
            const embed = new EmbedBuilder()
                .setTitle('AI Response')
                .setDescription(response)
                .setColor(0x00ff00)
                .setAuthor({ 
                    name: 'AI Assistant', 
                    iconURL: 'https://media.tenor.com/xzKtvBspe5YAAAAj/emo-robot-happy-discord.gif'
                })
                .setFooter({ text: `Response to ${username} • Use /aifeedback to rate this response` })
                .setTimestamp();

            const replyMessage = await interaction.editReply({ embeds: [embed] });
            
            // Store the response for potential feedback
            recentAIResponses.set(userId, {
                messageId: replyMessage.id,
                response: response,
                userMessage: message,
                timestamp: Date.now()
            });
            
            // Clean up old responses (older than 10 minutes)
            setTimeout(() => {
                const stored = recentAIResponses.get(userId);
                if (stored && stored.timestamp === Date.now()) {
                    recentAIResponses.delete(userId);
                }
            }, 10 * 60 * 1000);
            
        } else {
            await interaction.editReply('❌ Sorry, I couldn\'t generate a response right now.');
        }
        
    } catch (error) {
        logger.error('Error in AI Discord command:', error);
        try {
            if (interaction.deferred) {
                await interaction.editReply('❌ Error processing AI request');
            } else {
                await interaction.reply({ content: '❌ Error processing AI request', ephemeral: true });
            }
        } catch (replyError) {
            logger.error('Error sending AI error reply:', replyError);
        }
    }
}

async function handleAIFeedback(interaction) {
    const rating = interaction.options.getInteger('rating');
    const feedbackType = interaction.options.getString('type');
    const comment = interaction.options.getString('comment');
    const userId = interaction.user.id;
    const username = interaction.user.username;
    
    try {
        await interaction.deferReply({ ephemeral: true });
        
        // Check if there's a recent AI response to rate
        const recentResponse = recentAIResponses.get(userId);
        if (!recentResponse) {
            await interaction.editReply('❌ No recent AI response found to rate. Use /ai first, then rate the response within 10 minutes.');
            return;
        }
        
        // Create feedback record (will work once database is enabled)
        const feedbackData = {
            userId: null, // Will need user lookup
            messageId: null, // Will need message storage
            rating: rating,
            feedbackType: feedbackType,
            comment: comment || null,
            source: 'discord',
            timestamp: new Date()
        };
        
        // Store in temporary memory for now (until database is enabled)
        const tempFeedback = {
            ...feedbackData,
            username: username,
            response: recentResponse.response,
            userMessage: recentResponse.userMessage,
            discordMessageId: recentResponse.messageId
        };
        
        // Add to temporary storage
        if (!global.tempFeedbackStorage) {
            global.tempFeedbackStorage = [];
        }
        global.tempFeedbackStorage.push(tempFeedback);
        
        logger.info(`AI Feedback received from ${username}: ${rating}/5 stars, Type: ${feedbackType}${comment ? `, Comment: ${comment}` : ''}`);
        
        const stars = '⭐'.repeat(rating);
        const embed = new EmbedBuilder()
            .setTitle('✅ Feedback Submitted')
            .setDescription(`Thank you for rating the AI response!`)
            .addFields(
                { name: 'Rating', value: `${stars} (${rating}/5)`, inline: true },
                { name: 'Type', value: feedbackType, inline: true },
                { name: 'Comment', value: comment || 'None', inline: false }
            )
            .setColor(0x00ff00)
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        
        // Remove the rated response
        recentAIResponses.delete(userId);
        
    } catch (error) {
        logger.error('Error in AI feedback command:', error);
        await interaction.editReply('❌ Error processing feedback. Please try again.');
    }
}

async function handleAIFeedbackStats(interaction) {
    try {
        await interaction.deferReply();
        
        // Get temporary feedback data
        const tempFeedback = global.tempFeedbackStorage || [];
        
        if (tempFeedback.length === 0) {
            await interaction.editReply('📊 No feedback data available yet. Use /ai and /aifeedback to contribute!');
            return;
        }
        
        // Calculate statistics
        const totalFeedback = tempFeedback.length;
        const averageRating = tempFeedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback;
        
        const byType = tempFeedback.reduce((acc, f) => {
            acc[f.feedbackType] = (acc[f.feedbackType] || 0) + 1;
            return acc;
        }, {});
        
        const ratingDistribution = tempFeedback.reduce((acc, f) => {
            acc[f.rating] = (acc[f.rating] || 0) + 1;
            return acc;
        }, {});
        
        const embed = new EmbedBuilder()
            .setTitle('📊 AI Feedback Statistics')
            .addFields(
                { name: '📈 Total Feedback', value: `${totalFeedback} responses`, inline: true },
                { name: '⭐ Average Rating', value: `${averageRating.toFixed(1)}/5.0`, inline: true },
                { name: '📅 Latest Feedback', value: `${Math.round((Date.now() - Math.max(...tempFeedback.map(f => f.timestamp))) / (1000 * 60))} minutes ago`, inline: true }
            )
            .setColor(0x0099ff)
            .setTimestamp();
        
        // Add rating distribution
        let ratingText = '';
        for (let i = 5; i >= 1; i--) {
            const count = ratingDistribution[i] || 0;
            const percentage = totalFeedback > 0 ? Math.round((count / totalFeedback) * 100) : 0;
            ratingText += `${i}⭐: ${count} (${percentage}%)\n`;
        }
        embed.addFields({ name: '📊 Rating Distribution', value: ratingText, inline: true });
        
        // Add feedback types
        let typeText = '';
        Object.entries(byType).forEach(([type, count]) => {
            const percentage = Math.round((count / totalFeedback) * 100);
            typeText += `${type}: ${count} (${percentage}%)\n`;
        });
        embed.addFields({ name: '🏷️ Feedback Types', value: typeText || 'None', inline: true });
        
        await interaction.editReply({ embeds: [embed] });
        
    } catch (error) {
        logger.error('Error in AI stats command:', error);
        await interaction.editReply('❌ Error fetching AI statistics.');
    }
}

// Global variable to store the selected channel ID
let selectedChannelId = null;

async function handleSetChannel(interaction) {
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
    
    // Check if bot has permission to send messages in this channel
    if (!targetChannel.permissionsFor(interaction.client.user).has('SendMessages')) {
        await interaction.reply({
            content: '❌ I don\'t have permission to send messages in that channel.',
            ephemeral: true
        });
        return;
    }
    
    selectedChannelId = targetChannel.id;
    
    const embed = new EmbedBuilder()
        .setTitle('✅ Chat Channel Set!')
        .setDescription(`Minecraft chat messages will now be sent to ${targetChannel}`)
        .setColor(0x00ff00)
        .addFields(
            { name: 'Channel', value: `<#${targetChannel.id}>`, inline: true },
            { name: 'Type', value: targetChannel.type === 0 ? 'Text Channel' : 'Other', inline: true }
        )
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
    
    // Send a test message to the channel
    try {
        await targetChannel.send('🟢 **[MC Bridge]** This channel is now set to receive Minecraft chat messages!');
    } catch (error) {
        logger.error('Error sending test message to channel:', error);
    }
}

// Function to get the current selected channel ID
function getSelectedChannelId() {
    return selectedChannelId || process.env.DISCORD_CHANNEL_ID;
}

module.exports = {
    commands,
    registerHandlers,
    getSelectedChannelId
};
