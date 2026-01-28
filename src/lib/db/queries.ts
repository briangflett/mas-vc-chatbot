import { db } from './index';
import { user, chat, message } from './schema';
import { eq, desc } from 'drizzle-orm';

// User queries
export async function getUserByEmail(email: string) {
  const users = await db.select().from(user).where(eq(user.email, email));
  return users[0];
}

export async function createUser(id: string, email: string, name: string) {
  const users = await db.insert(user).values({ id, email, name }).returning();
  return users[0];
}

// Chat queries
export async function getChatsByUserId(userId: string) {
  return await db
    .select()
    .from(chat)
    .where(eq(chat.userId, userId))
    .orderBy(desc(chat.createdAt));
}

export async function getChatById(chatId: string) {
  const chats = await db.select().from(chat).where(eq(chat.id, chatId));
  return chats[0];
}

export async function createChat(id: string, userId: string, title: string) {
  const chats = await db.insert(chat).values({ id, userId, title }).returning();
  return chats[0];
}

// Message queries
export async function getMessagesByChatId(chatId: string) {
  return await db
    .select()
    .from(message)
    .where(eq(message.chatId, chatId))
    .orderBy(message.createdAt);
}

export async function createMessage(
  id: string,
  chatId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: any
) {
  const messages = await db
    .insert(message)
    .values({ id, chatId, role, content, metadata })
    .returning();
  return messages[0];
}
