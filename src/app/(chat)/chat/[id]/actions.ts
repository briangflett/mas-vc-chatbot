'use server';

import { createMessage } from '@/lib/db/queries';

export async function saveMessage(
  id: string,
  chatId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: any
) {
  return await createMessage(id, chatId, role, content, metadata);
}
