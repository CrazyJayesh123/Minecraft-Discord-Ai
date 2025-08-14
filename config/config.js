require('dotenv').config();

const config = {
    // Discord Configuration
    DISCORD_TOKEN: process.env.DISCORD_TOKEN || '',
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || '',
    DISCORD_CHANNEL_ID: process.env.DISCORD_CHANNEL_ID || '',
    
    // Minecraft Configuration
    MINECRAFT_HOST: process.env.MINECRAFT_HOST || 'LifeSteal029.aternos.me',
    MINECRAFT_PORT: parseInt(process.env.MINECRAFT_PORT) || 48688,
    MINECRAFT_USERNAME: process.env.MINECRAFT_USERNAME || 'AIBot_LS029',
    
    // AI Configuration
    TOGETHER_API_KEY: process.env.TOGETHER_API_KEY || '',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '', // Backup for compatibility
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '', // Backup for compatibility
    
    // Bot Behavior Configuration
    AI_RESPONSE_CHANCE: parseFloat(process.env.AI_RESPONSE_CHANCE) || 0.3, // 30% chance to respond
    AUTO_RESPAWN: process.env.AUTO_RESPAWN !== 'false',
    AUTO_EAT: process.env.AUTO_EAT !== 'false',
    COMMAND_PREFIX: process.env.COMMAND_PREFIX || '!',
    
    // Reconnection Settings - Optimized for Aternos servers
    RECONNECT_DELAY: parseInt(process.env.RECONNECT_DELAY) || 15000, // Longer delay for Aternos
    MAX_RECONNECT_ATTEMPTS: parseInt(process.env.MAX_RECONNECT_ATTEMPTS) || 50, // More attempts
    
    // Rate Limiting
    CHAT_COOLDOWN: parseInt(process.env.CHAT_COOLDOWN) || 2000, // 2 seconds between messages
    
    // Development Settings
    DEBUG_MODE: process.env.DEBUG_MODE === 'true',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// Validation
const requiredFields = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'TOGETHER_API_KEY'];
const missingFields = requiredFields.filter(field => !config[field]);

if (missingFields.length > 0) {
    console.error('Missing required environment variables:', missingFields.join(', '));
    console.error('Please check your .env file or environment variables');
    process.exit(1);
}

module.exports = config;
