const { users, chatMessages, serverEvents, commandHistory, botStats, aiFeedback } = require("../shared/schema");
const { db } = require("./db");
const { eq, desc, and, gte } = require("drizzle-orm");

class DatabaseStorage {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByDiscordId(discordId) {
    const [user] = await db.select().from(users).where(eq(users.discordId, discordId));
    return user || undefined;
  }

  async getUserByMinecraftUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.minecraftUsername, username));
    return user || undefined;
  }

  async createUser(insertUser) {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserLastSeen(id) {
    await db
      .update(users)
      .set({ lastSeen: new Date() })
      .where(eq(users.id, id));
  }

  async saveChatMessage(message) {
    await db.insert(chatMessages).values(message);
  }

  async getChatHistory(limit = 100) {
    return await db
      .select({
        id: chatMessages.id,
        content: chatMessages.content,
        source: chatMessages.source,
        timestamp: chatMessages.timestamp,
        isAiResponse: chatMessages.isAiResponse,
        username: users.minecraftUsername,
        discordId: users.discordId
      })
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.userId, users.id))
      .orderBy(desc(chatMessages.timestamp))
      .limit(limit);
  }

  async logServerEvent(event) {
    await db.insert(serverEvents).values(event);
  }

  async getRecentEvents(limit = 50) {
    return await db
      .select({
        id: serverEvents.id,
        eventType: serverEvents.eventType,
        description: serverEvents.description,
        metadata: serverEvents.metadata,
        timestamp: serverEvents.timestamp,
        playerUsername: users.minecraftUsername
      })
      .from(serverEvents)
      .leftJoin(users, eq(serverEvents.playerId, users.id))
      .orderBy(desc(serverEvents.timestamp))
      .limit(limit);
  }

  async logCommand(command) {
    await db.insert(commandHistory).values(command);
  }

  async getCommandHistory(userId, limit = 50) {
    let query = db
      .select({
        id: commandHistory.id,
        command: commandHistory.command,
        parameters: commandHistory.parameters,
        success: commandHistory.success,
        errorMessage: commandHistory.errorMessage,
        timestamp: commandHistory.timestamp,
        username: users.minecraftUsername,
        discordId: users.discordId
      })
      .from(commandHistory)
      .leftJoin(users, eq(commandHistory.userId, users.id))
      .orderBy(desc(commandHistory.timestamp))
      .limit(limit);

    if (userId) {
      query = query.where(eq(commandHistory.userId, userId));
    }

    return await query;
  }

  async updateBotStats(stats) {
    await db.insert(botStats).values(stats);
  }

  async getDailyStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayStats] = await db
      .select()
      .from(botStats)
      .where(gte(botStats.date, today))
      .orderBy(desc(botStats.date))
      .limit(1);

    return todayStats || null;
  }

  // AI Feedback methods
  async saveFeedback(feedback) {
    const [savedFeedback] = await db.insert(aiFeedback).values(feedback).returning();
    return savedFeedback;
  }

  async getFeedback(messageId) {
    return await db
      .select({
        id: aiFeedback.id,
        rating: aiFeedback.rating,
        feedbackType: aiFeedback.feedbackType,
        comment: aiFeedback.comment,
        source: aiFeedback.source,
        timestamp: aiFeedback.timestamp,
        username: users.minecraftUsername,
        discordId: users.discordId
      })
      .from(aiFeedback)
      .leftJoin(users, eq(aiFeedback.userId, users.id))
      .where(eq(aiFeedback.messageId, messageId));
  }

  async getFeedbackStats() {
    const stats = await db
      .select({
        rating: aiFeedback.rating,
        feedbackType: aiFeedback.feedbackType,
        source: aiFeedback.source
      })
      .from(aiFeedback);

    // Calculate averages and counts
    const totalFeedback = stats.length;
    const averageRating = totalFeedback > 0 ? 
      stats.reduce((sum, f) => sum + f.rating, 0) / totalFeedback : 0;
    
    const byType = stats.reduce((acc, f) => {
      acc[f.feedbackType] = (acc[f.feedbackType] || 0) + 1;
      return acc;
    }, {});

    const bySource = stats.reduce((acc, f) => {
      acc[f.source] = (acc[f.source] || 0) + 1;
      return acc;
    }, {});

    return {
      totalFeedback,
      averageRating: Math.round(averageRating * 100) / 100,
      byType,
      bySource
    };
  }

  async getRecentFeedback(limit = 50) {
    return await db
      .select({
        id: aiFeedback.id,
        rating: aiFeedback.rating,
        feedbackType: aiFeedback.feedbackType,
        comment: aiFeedback.comment,
        source: aiFeedback.source,
        timestamp: aiFeedback.timestamp,
        username: users.minecraftUsername,
        discordId: users.discordId,
        messageContent: chatMessages.content
      })
      .from(aiFeedback)
      .leftJoin(users, eq(aiFeedback.userId, users.id))
      .leftJoin(chatMessages, eq(aiFeedback.messageId, chatMessages.id))
      .orderBy(desc(aiFeedback.timestamp))
      .limit(limit);
  }
}

module.exports = { storage: new DatabaseStorage(), DatabaseStorage };