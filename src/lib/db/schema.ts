import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
} from 'drizzle-orm/pg-core';

// User table (simplified - will integrate with VC portal auth later)
export const user = pgTable('User', {
  id: varchar('id', { length: 64 }).primaryKey().notNull(),
  email: varchar('email', { length: 64 }).notNull(),
  name: varchar('name', { length: 128 }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type User = InferSelectModel<typeof user>;

// Chat table
export const chat = pgTable('Chat', {
  id: varchar('id', { length: 64 }).primaryKey().notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  title: text('title').notNull(),
  userId: varchar('userId', { length: 64 })
    .notNull()
    .references(() => user.id),
});

export type Chat = InferSelectModel<typeof chat>;

// Message table
export const message = pgTable('Message', {
  id: varchar('id', { length: 64 }).primaryKey().notNull(),
  chatId: varchar('chatId', { length: 64 })
    .notNull()
    .references(() => chat.id),
  role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  // Store metadata like tool calls, citations, etc. from n8n
  metadata: json('metadata').$type<{
    toolCalls?: Array<{
      toolName: string;
      input: any;
      output: any;
    }>;
    sources?: string[];
  }>(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type Message = InferSelectModel<typeof message>;
