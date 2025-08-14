const Together = require('together-ai');
const config = require('../config/config');
const logger = require('../utils/logger');

class AIService {
    constructor() {
        this.together = null;
        this.conversationHistory = new Map(); // Store conversation history by user
        this.lastResponseTime = 0;
        this.minecraftContext = {
            serverName: 'LifeSteal029',
            gameMode: 'LifeSteal',
            botPersonality: 'helpful and friendly Minecraft companion'
        };
    }

    async initialize() {
        try {
            if (!config.TOGETHER_API_KEY) {
                throw new Error('Together API key not configured');
            }
            
            this.together = new Together({ apiKey: config.TOGETHER_API_KEY });
            logger.info('AI Service (Together AI/Qwen) initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize AI service:', error);
            throw error;
        }
    }

    async generateResponse(username, message, context = {}) {
        try {
            // Rate limiting
            const now = Date.now();
            if (now - this.lastResponseTime < config.CHAT_COOLDOWN) {
                return null;
            }

            // Get or create conversation history for user
            if (!this.conversationHistory.has(username)) {
                this.conversationHistory.set(username, []);
            }
            
            const history = this.conversationHistory.get(username);
            
            // Keep only last 10 messages to avoid token limits
            if (history.length > 10) {
                history.splice(0, history.length - 10);
            }

            // Build context-aware prompt
            const systemPrompt = this.buildSystemPrompt(context);
            const userMessage = `${username}: ${message}`;
            
            history.push({ role: 'user', content: userMessage });

            // Build messages for Together AI
            const messages = [
                { role: 'system', content: systemPrompt },
                ...history
            ];

            // Using Together AI with Qwen model (non-thinking version) - faster response
            const response = await Promise.race([
                this.together.chat.completions.create({
                    messages: messages,
                    model: 'Qwen/Qwen2.5-7B-Instruct-Turbo',
                    max_tokens: 100, // Reduced for faster response
                    temperature: 0.7
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('AI response timeout')), 8000) // 8 second timeout
                )
            ]);

            let aiResponse = response.choices?.[0]?.message?.content?.trim() || null;
            
            // Remove any thinking tags if they appear
            if (aiResponse) {
                aiResponse = aiResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
                aiResponse = aiResponse.replace(/^<think>[\s\S]*$/g, '').trim();
            }
            
            // Add AI response to history
            history.push({ role: 'assistant', content: aiResponse });
            
            this.lastResponseTime = now;
            
            logger.info(`AI responded to ${username}: ${aiResponse}`);
            return aiResponse;
            
        } catch (error) {
            logger.error('Error generating AI response:', error.message || error);
            logger.error('Full error details:', JSON.stringify(error, null, 2));
            return `Sorry ${username}, I'm having trouble thinking right now.`;
        }
    }

    buildSystemPrompt(context) {
        const basePrompt = `You are an AI assistant that helps players on the ${this.minecraftContext.serverName} Minecraft server. You can answer any questions and have conversations about any topic, not just Minecraft.

Your personality: You are helpful, friendly, and knowledgeable. You can discuss anything from general knowledge to Minecraft gameplay.

Current context (when relevant):
- Server: ${this.minecraftContext.serverName} (LifeSteal server where players can gain/lose hearts)
- Your current health: ${context.health || 'unknown'}/20
- Your current food: ${context.food || 'unknown'}/20
- Current time: ${context.timeOfDay || 'unknown'}
- Players online: ${context.playersCount || 'unknown'}

Guidelines:
- Keep responses conversational and helpful (1-3 sentences)
- Answer any questions honestly and accurately
- Use casual, friendly language
- You can discuss any topic: general knowledge, current events, science, gaming, etc.
- When discussing Minecraft, mention LifeSteal mechanics when relevant
- Be engaging and show interest in conversations
- Don't mention being an AI unless directly asked

Remember: You're a helpful AI that happens to be connected to a Minecraft server, not limited to just Minecraft topics.`;

        return basePrompt;
    }

    async shouldRespond(message, username) {
        // Only respond if directly mentioned with "ai" or "bot"
        const botMentions = ['bot', 'ai'];
        const lowerMessage = message.toLowerCase();
        
        if (botMentions.some(mention => lowerMessage.includes(mention))) {
            return true;
        }

        // Don't respond to anything else automatically
        return false;
    }

    async analyzeCommand(command) {
        try {
            const systemPrompt = `You are a Minecraft command interpreter. Analyze the given command and respond with JSON containing:
            {
                "action": "move" | "chat" | "build" | "mine" | "follow" | "stop" | "unknown",
                "parameters": {
                    "target": "player_name or coordinates",
                    "message": "text to say",
                    "direction": "north/south/east/west",
                    "distance": number
                },
                "confidence": 0.0-1.0
            }`;

            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nCommand to analyze: ${command}\n\nRespond only with valid JSON.` }] }],
                generationConfig: {
                    maxOutputTokens: 200,
                    temperature: 0.3
                }
            });

            const responseText = result.response.text() || '{}';
            
            // Clean the response text to ensure it's valid JSON
            const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            
            return JSON.parse(cleanedText);
        } catch (error) {
            logger.error('Error analyzing command:', error.message || error);
            logger.error('Full command analysis error:', JSON.stringify(error, null, 2));
            return { action: 'chat', parameters: { message: command }, confidence: 0.8 };
        }
    }

    clearHistory(username) {
        this.conversationHistory.delete(username);
    }

    getStats() {
        return {
            conversationsActive: this.conversationHistory.size,
            totalResponses: this.lastResponseTime > 0 ? 1 : 0,
            initialized: this.genAI !== null
        };
    }
}

module.exports = new AIService();
