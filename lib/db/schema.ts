import { pgTable, text, timestamp, uuid, boolean, decimal, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const invoiceStatusEnum = pgEnum('invoice_status', ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['ACTIVE', 'CANCELLED', 'PAST_DUE', 'TRIALING']);
export const channelTypeEnum = pgEnum('channel_type', ['WHATSAPP', 'TELEGRAM', 'WEB_CHAT', 'SMS', 'EMAIL']);
export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'document', 'audio']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(),
  whatsappNumber: text('whatsapp_number').unique(),
  telegramId: text('telegram_id').unique(),
  name: text('name'),
  businessName: text('business_name'),
  avatar: text('avatar'),
  timezone: text('timezone').default('Africa/Johannesburg'),
  currency: text('currency').default('ZAR'),
  vatNumber: text('vat_number'),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('TRIALING'),
  subscriptionId: text('subscription_id'),
  trialEndsAt: timestamp('trial_ends_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Clients table
export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: jsonb('address'), // { street, city, postalCode, country }
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Invoices table
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  invoiceNumber: text('invoice_number').unique(),
  currency: text('currency').default('ZAR'),
  vatIncluded: boolean('vat_included').default(true),
  vatRate: decimal('vat_rate', { precision: 5, scale: 4 }).default('0.15'),
  status: invoiceStatusEnum('status').default('DRAFT'),
  dueDate: timestamp('due_date'),
  sentAt: timestamp('sent_at'),
  paidAt: timestamp('paid_at'),
  notes: text('notes'),
  metadata: jsonb('metadata'), // Additional data like payment terms, etc.
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Invoice items table
export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  quantity: integer('quantity').default(1),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  lineTotal: decimal('line_total', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Payments table
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  method: text('method').notNull(), // manual, EFT, PayShap, card, etc.
  reference: text('reference'),
  paidAt: timestamp('paid_at').defaultNow(),
  metadata: jsonb('metadata'), // Additional payment data
  createdAt: timestamp('created_at').defaultNow(),
});

// Expenses table
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('ZAR'),
  category: text('category'), // transport, office, marketing, etc.
  date: timestamp('date').notNull(),
  receipt: text('receipt'), // URL to receipt image
  vatAmount: decimal('vat_amount', { precision: 12, scale: 2 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Messages table (for conversation history)
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  channel: channelTypeEnum('channel').notNull(),
  from: text('from').notNull(),
  to: text('to').notNull(),
  content: text('content').notNull(),
  messageType: messageTypeEnum('message_type').default('text'),
  metadata: jsonb('metadata'),
  processed: boolean('processed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// AI conversations table (for context management)
export const aiConversations = pgTable('ai_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  threadId: text('thread_id').unique(), // OpenAI thread ID
  channel: channelTypeEnum('channel').notNull(),
  context: jsonb('context'), // Conversation context and state
  lastMessageAt: timestamp('last_message_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Data imports table (for tracking data imports)
export const dataImports = pgTable('data_imports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // csv, xlsx, quickbooks, etc.
  status: text('status').default('PENDING'), // PENDING, PROCESSING, COMPLETED, FAILED
  fileName: text('file_name'),
  recordsProcessed: integer('records_processed').default(0),
  recordsTotal: integer('records_total').default(0),
  errors: jsonb('errors'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

// Audit logs table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: text('resource_id'),
  details: jsonb('details'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  invoices: many(invoices),
  expenses: many(expenses),
  messages: many(messages),
  aiConversations: many(aiConversations),
  dataImports: many(dataImports),
  auditLogs: many(auditLogs),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

export const aiConversationsRelations = relations(aiConversations, ({ one }) => ({
  user: one(users, {
    fields: [aiConversations.userId],
    references: [users.id],
  }),
}));

export const dataImportsRelations = relations(dataImports, ({ one }) => ({
  user: one(users, {
    fields: [dataImports.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
