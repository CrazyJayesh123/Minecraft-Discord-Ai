# 🚀 Deploy Discord Bot to Render

## Overview
This guide shows you how to deploy your AI Minecraft Discord Bot to Render with full database support and monitoring.

## Prerequisites
- GitHub repository with your bot code (already done)
- Render account (free tier available)
- Discord bot token and API keys

## Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended for easy repo access)
3. Verify your email address

## Step 2: Create PostgreSQL Database
1. In Render dashboard, click **"New +"** 
2. Select **"PostgreSQL"**
3. Configure:
   - **Name**: `minecraft-bot-db`
   - **Plan**: Free (or paid for better performance)
   - **Region**: Choose closest to you
4. Click **"Create Database"**
5. **Save the database details** - you'll need them for environment variables

## Step 3: Deploy Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `minecraft-discord-bot`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Plan**: Free (or paid for always-on)

⚠️ **CRITICAL NODE.JS VERSION FIX**: 
Add this environment variable to fix the mineflayer compatibility issue:
- **NODE_VERSION**: `22.11.0`

This ensures Render uses Node.js 22+ which is required for mineflayer 4.31.0+

## Step 4: Set Environment Variables
In your web service settings, add these environment variables:

### Required Variables:
```bash
# Discord Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here  
DISCORD_CHANNEL_ID=your_discord_channel_id_here

# AI Configuration
TOGETHER_API_KEY=your_together_api_key_here

# Minecraft Server
MINECRAFT_HOST=LifeSteal029.aternos.me
MINECRAFT_PORT=48688
MINECRAFT_USERNAME=AIBot_LS029

# Server Configuration
NODE_ENV=production
PORT=5000
```

### Database Variables (from your PostgreSQL service):
```bash
DATABASE_URL=postgres://username:password@host:port/database
```

**To get DATABASE_URL:**
1. Go to your PostgreSQL service in Render
2. Go to "Connect" tab
3. Copy the **External Database URL**
4. Add it as `DATABASE_URL` environment variable

## Step 5: Deploy
1. Click **"Create Web Service"**
2. Render will automatically:
   - Pull your code from GitHub
   - Install dependencies (`npm install`)
   - Start your bot (`node index.js`)
3. Watch the deploy logs for any errors

## Step 6: Verify Deployment
After deployment completes:

1. **Check service status**: Should show "Live" 
2. **Test web dashboard**: Visit your service URL to see the status page
3. **Test Discord commands**: Try `/status` or `/ai` commands
4. **Check logs**: Look for connection messages

## Step 7: Enable Always-On (Optional)
- **Free tier**: Service sleeps after 15 minutes of inactivity
- **Paid plans**: Start at $7/month for always-on service
- Upgrade in your service settings if you want 24/7 operation

## Troubleshooting

### Common Issues:

**Build fails with npm errors:**
- Check that all dependencies are in `package.json`
- Ensure Node.js version compatibility

**Bot doesn't start:**
- Verify all environment variables are set correctly
- Check that Discord token is valid
- Ensure database URL is correct

**Database connection fails:**
- Verify DATABASE_URL format
- Check that PostgreSQL service is running
- Ensure database tables are created (they auto-create on first run)

**Bot goes offline after 15 minutes:**
- This is normal on free tier
- Upgrade to paid plan for always-on service
- Bot will wake up when someone uses a Discord command

### Getting Help:
1. Check Render deployment logs
2. Monitor bot logs in Render dashboard
3. Test individual components (Discord, Minecraft, AI)

## Features That Work on Render:

✅ **Discord Bot** - All 27 slash commands  
✅ **Minecraft Connection** - Connects to LifeSteal029 server  
✅ **AI Responses** - Together AI integration  
✅ **Web Dashboard** - Status monitoring interface  
✅ **Database Storage** - PostgreSQL with full schema  
✅ **Auto-reconnection** - Handles network interruptions  
✅ **Health Monitoring** - Built-in health checks  

## Cost Breakdown:

**Free Tier:**
- Web Service: Free (sleeps after 15min inactivity)  
- PostgreSQL: Free (limited storage)
- Total: $0/month

**Always-On Setup:**
- Web Service: $7/month (always running)
- PostgreSQL: Free or $7/month for more storage
- Total: $7-14/month

Your bot will be production-ready with full functionality!