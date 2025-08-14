const { pgTable, serial, text, timestamp, integer, boolean, jsonb } = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

// Users table - stores Discord and Minecraft players
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  discordId: text('discord_id').unique(),
  minecraftUsername: text('minecraft_username'),
  joinedAt: timestamp('joined_at').defaultNow(),
  lastSeen: timestamp('last_seen').defaultNow(),
  isActive: boolean('is_active').default(true)
});

// Chat messages table - stores all chat messages
const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  content: text('content').notNull(),
  source: text('source').notNull(), // 'discord' or 'minecraft'
  channelId: text('channel_id'), // Discord channel ID if from Discord
  timestamp: timestamp('timestamp').defaultNow(),
  isAiResponse: boolean('is_ai_response').default(false)
});

// Bot stats table - stores bot performance and usage stats
const botStats = pgTable('bot_stats', {
  id: serial('id').primaryKey(),
  date: timestamp('date').defaultNow(),
  messagesProcessed: integer('messages_processed').default(0),
  aiResponsesGenerated: integer('ai_responses_generated').default(0),
  minecraftConnections: integer('minecraft_connections').default(0),
  uptime: integer('uptime').default(0), // in seconds
  playerCount: integer('player_count').default(0)
});

// Server events table - logs important server events
const serverEvents = pgTable('server_events', {
  id: serial('id').primaryKey(),
  eventType: text('event_type').notNull(), // 'player_join', 'player_leave', 'death', 'chat', etc.
  playerId: integer('player_id').references(() => users.id),
  description: text('description'),
  metadata: jsonb('metadata'), // Additional event data
  timestamp: timestamp('timestamp').defaultNow()
});

// Command history table - stores executed Discord commands
const commandHistory = pgTable('command_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  command: text('command').notNull(),
  parameters: jsonb('parameters'),
  success: boolean('success').default(true),
  errorMessage: text('error_message'),
  timestamp: timestamp('timestamp').defaultNow()
});

// AI Feedback table - stores user feedback on AI responses
const aiFeedback = pgTable('ai_feedback', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  messageId: integer('message_id').references(() => chatMessages.id),
  rating: integer('rating').notNull(), // 1-5 star rating
  feedbackType: text('feedback_type').notNull(), // 'helpful', 'unhelpful', 'accurate', 'inaccurate', 'appropriate', 'inappropriate'
  comment: text('comment'), // Optional user comment
  source: text('source').notNull(), // 'discord' or 'minecraft'
  timestamp: timestamp('timestamp').defaultNow()
});

// Relations
const usersRelations = relations(users, ({ many }) => ({
  chatMessages: many(chatMessages),
  serverEvents: many(serverEvents),
  commandHistory: many(commandHistory)
}));

const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id]
  })
}));

const serverEventsRelations = relations(serverEvents, ({ one }) => ({
  player: one(users, {
    fields: [serverEvents.playerId],
    references: [users.id]
  })
}));

const commandHistoryRelations = relations(commandHistory, ({ one }) => ({
  user: one(users, {
    fields: [commandHistory.userId],
    references: [users.id]
  })
}));

const aiFeedbackRelations = relations(aiFeedback, ({ one }) => ({
  user: one(users, {
    fields: [aiFeedback.userId],
    references: [users.id]
  }),
  message: one(chatMessages, {
    fields: [aiFeedback.messageId],
    references: [chatMessages.id]
  })
}));

module.exports = {
  users,
  chatMessages,
  botStats,
  serverEvents,
  commandHistory,
  aiFeedback,
  usersRelations,
  chatMessagesRelations,
  serverEventsRelations,
  commandHistoryRelations,
  aiFeedbackRelations
};