import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';

export default async function Home() {
  // For now, always create a new chat
  // Later: show list of existing chats
  const newChatId = nanoid();
  redirect(`/chat/${newChatId}`);
}
