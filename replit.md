# AI Minecraft Discord Bot

## Overview

This is a Node.js-based AI-powered Minecraft bot that bridges Discord and Minecraft servers. The bot can connect to a Minecraft server, interact with players through chat, respond to commands via Discord, and provide intelligent AI responses using OpenAI's API. It specifically targets the LifeSteal029 Aternos server and includes a web-based status monitoring interface.

## User Preferences

Preferred communication style: Simple, everyday language.
AI behavior preferences:
- AI should only respond when directly mentioned with "ai" or "bot" keywords
- AI should give direct answers without showing thinking process
- AI should answer all types of questions, not just Minecraft-related ones
- Prefers clean project structure without unnecessary deployment/GitHub files

## Recent Changes (August 2025)
- Removed unnecessary GitHub and deployment files (render.yaml, vercel.json, GitHub guides)  
- Cleaned up old screenshot attachments and duplicate documentation
- Fixed Discord interaction timeouts with optimized AI response handling
- Implemented animated robot emoji as author icon in AI response embeds
- Enhanced AI service with faster response times and timeout protection
- Configured Render deployment with PostgreSQL database integration
- Fixed Discord command registration with improved error handling and validation
- Successfully deployed to Render with full database support and all 27 commands working

## System Architecture

The application follows a modular event-driven architecture with clear separation of concerns:

### Core Components
- **Main Application (index.js)**: Entry point that orchestrates Discord and Minecraft connections
- **Configuration System**: Centralized environment-based configuration management
- **Event Handlers**: Separate modules for Discord and Minecraft event processing
- **AI Service**: OpenAI integration for intelligent chat responses
- **Utilities**: Logging, reconnection management, and helper functions
- **Web Interface**: Express-based status monitoring dashboard

### Technology Stack
- **Runtime**: Node.js
- **Discord Integration**: discord.js v14
- **Minecraft Integration**: mineflayer with pathfinder and auto-eat plugins
- **AI Integration**: OpenAI API
- **Web Server**: Express.js
- **Task Scheduling**: node-cron
- **Environment Management**: dotenv

## Key Components

### 1. Discord Bot Integration
- **Purpose**: Provides Discord slash commands for Minecraft server interaction
- **Features**: Chat bridging, status monitoring, bot control commands, dynamic channel selection
- **Architecture**: Event-driven with separate command and event handlers
- **Commands**: Comprehensive command set with 27 Discord slash commands including status monitoring, player tracking, movement control, inventory management, weather info, debug tools, system configuration, and the new `/setchannel` command for dynamic channel selection
- **Channel Management**: Users can now set any Discord channel to receive Minecraft chat messages using the `/setchannel` command, eliminating the need for manual environment variable configuration

### 2. Minecraft Bot Integration
- **Purpose**: Connects to Minecraft server as an automated player
- **Features**: Chat monitoring, AI responses, auto-eat, pathfinding capabilities
- **Plugins**: mineflayer-pathfinder for navigation, mineflayer-auto-eat for survival
- **Behavior**: Responds to chat messages with configurable AI probability

### 3. AI Service
- **Purpose**: Provides intelligent responses to Minecraft chat messages and Discord interactions
- **Implementation**: Together AI API integration with Qwen 2.5-7B-Instruct-Turbo model and conversation history
- **Features**: Context-aware responses, rate limiting, conversation memory, sophisticated embed styling
- **Discord Embeds**: Highly aesthetic Discord embed messages with:
  - Dynamic color coding based on response content (success=green, errors=red, help=amber, fun=purple, general=cyan)
  - Rich author information showing AI provider and model details
  - Multiple informational fields displaying requester, model specs, response metrics, and usage statistics
  - Professional error handling with beautiful system error embeds and unique error codes
  - Blockquote formatting for AI responses with enhanced readability
- **Message Styling**: AI responses feature colorful Minecraft formatting with randomized prefixes (✦, ⚡, ☆, ◆, ▲, ♦, ◈) and decorative elements
- **Multi-message Support**: Long AI responses are automatically split across multiple messages with consistent formatting
- **Configuration**: Configurable response probability and cooldown periods

### 4. Reconnection Management
- **Purpose**: Handles automatic reconnection for both Discord and Minecraft connections
- **Features**: Exponential backoff, maximum retry limits, error categorization
- **Reliability**: Distinguishes between recoverable and fatal errors

### 5. Status Monitoring
- **Purpose**: Provides real-time status monitoring via web interface
- **Implementation**: Express server with REST API and HTML dashboard
- **Features**: Connection status, bot health metrics, position tracking, AI feedback analytics

### 6. AI Feedback System
- **Purpose**: Allows users to rate and provide feedback on AI responses
- **Implementation**: Discord commands and Minecraft chat commands for rating
- **Features**: 1-5 star ratings, feedback categories, analytics dashboard
- **Storage**: Temporary memory storage (upgradeable to database when enabled)

## Data Flow

### Message Processing Flow
1. **Minecraft Chat** → AI Service (probability-based) → Response to Minecraft
2. **Minecraft Chat** → Discord Channel (bridge)
3. **Discord Message** → Minecraft Chat (bridge)
4. **Discord Commands** → Minecraft Bot Actions → Response

### Status Monitoring Flow
1. **Bot State Changes** → Global State Variables
2. **Web Dashboard** → Status API → Real-time Display
3. **Periodic Updates** → Status Refresh (5-second intervals)

### AI Response Flow
1. **Chat Message** → Response Probability Check
2. **Context Building** → Together API Call (Qwen 3 235B)
3. **Response Generation** → Rate Limiting → Minecraft Chat

## External Dependencies

### Required Services
- **Together API**: For AI-powered chat responses via Qwen 3 235B Thinking model
- **Discord Application**: Bot token and application credentials required
- **Minecraft Server**: Target server connection (LifeSteal029.aternos.me)

### Optional Features
- **Web Dashboard**: Built-in monitoring interface on port 5000
- **Database Storage**: PostgreSQL for conversation history and stats

### Environment Variables
- `DISCORD_TOKEN`: Discord bot authentication
- `DISCORD_CLIENT_ID`: Discord application ID
- `DISCORD_CHANNEL_ID`: Target channel for message bridging
- `TOGETHER_API_KEY`: Together API key for AI responses
- `MINECRAFT_HOST`: Minecraft server hostname (default: LifeSteal029.aternos.me)
- `MINECRAFT_PORT`: Minecraft server port (default: 48688)
- `MINECRAFT_USERNAME`: Bot's Minecraft username (default: AIBot_LS029)

## Deployment Strategy

### Development Setup
1. **Environment Configuration**: Set up `.env` file with required credentials
2. **Dependency Installation**: npm install for all required packages
3. **Service Registration**: Register Discord application and obtain tokens
4. **Server Access**: Ensure Minecraft server accessibility

### Production Deployment Options

#### Replit (Current)
- Native Replit environment with automatic package installation
- Built-in secrets management
- Always-on service with Replit Core plan

#### Render (Cloud Platform)
- **Configuration Files**: `render.yaml`, `Procfile`, `.env.example` provided
- **Database**: Uses Render's managed PostgreSQL
- **Port Configuration**: Dynamic port assignment compatible (PORT environment variable)
- **Deployment Guide**: Complete step-by-step guide in `RENDER_DEPLOYMENT.md`
- **Cost**: Free tier available (sleeps after 15min), $7/month for always-on

### Production Considerations
- **Process Management**: Designed for continuous operation with auto-reconnection
- **Monitoring**: Built-in web dashboard on configurable port (default 5000)
- **Logging**: File-based logging with configurable levels
- **Error Recovery**: Automatic reconnection for network failures
- **Resource Management**: Conversation history limits to prevent memory leaks
- **Platform Flexibility**: Compatible with Replit, Render, Heroku, and other Node.js platforms

### Scalability Notes
- **Single Server**: Designed for single Minecraft server connection
- **Stateful Operations**: Maintains conversation history and connection state
- **Resource Usage**: Moderate memory usage for chat history and bot state
- **API Limits**: Rate limiting implemented for AI service calls

The architecture prioritizes reliability and maintainability, with clear separation between Discord, Minecraft, and AI components. The modular design allows for easy extension and modification of individual features without affecting the overall system stability.