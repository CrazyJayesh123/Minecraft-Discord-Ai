# AI Minecraft Discord Bot

An advanced AI-powered Minecraft bot with Discord integration, designed to provide intelligent and interactive cross-platform experiences.

## Features

- 🎮 **Minecraft Integration**: Connects to Minecraft servers as an automated player
- 🤖 **AI Responses**: Intelligent chat responses using Together AI (Qwen 3 235B model)
- 🎯 **Discord Commands**: 27+ slash commands for server interaction and bot control
- 🔄 **Auto-Reconnection**: Robust reconnection system for both Discord and Minecraft
- 📊 **Status Dashboard**: Web-based monitoring interface
- 🍖 **Auto-Survival**: Auto-eat and pathfinding capabilities
- ⚡ **Real-time Bridging**: Chat bridging between Discord and Minecraft

## Quick Start

### Prerequisites

- Node.js 18+ 
- Discord Bot Token
- Together AI API Key
- Access to a Minecraft server

### Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in your API keys and configuration:

```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
TOGETHER_API_KEY=your_together_ai_key
DISCORD_CHANNEL_ID=your_discord_channel_id
```

### Installation & Running

```bash
npm install
npm start
```

Visit `http://localhost:5000` to see the status dashboard.

## Deployment

### Render (Recommended)

This bot is pre-configured for Render deployment with `render.yaml`:

1. Push code to GitHub
2. Connect GitHub to Render
3. Create new Web Service (auto-detects config)
4. Set environment variables
5. Deploy!

See `RENDER_DEPLOYMENT_GUIDE.md` for detailed instructions.

### Other Platforms

Compatible with Heroku, Railway, and other Node.js hosting platforms.

## Discord Commands

The bot includes 27+ slash commands:
- `/status` - Server and bot status
- `/players` - Online players list
- `/position` - Bot's current position
- `/move` - Movement controls
- `/inventory` - Inventory management
- `/weather` - Weather information
- `/setchannel` - Dynamic channel configuration
- And many more...

## Architecture

- **Event-driven**: Separate handlers for Discord and Minecraft events
- **Modular**: Clean separation of concerns
- **Resilient**: Automatic error recovery and reconnection
- **Scalable**: Designed for continuous operation

## Technology Stack

- **Runtime**: Node.js
- **Discord**: discord.js v14
- **Minecraft**: mineflayer with plugins
- **AI**: Together AI (Qwen 3 235B)
- **Web**: Express.js
- **Database**: PostgreSQL support (optional)

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, check the deployment guide or create an issue in this repository.