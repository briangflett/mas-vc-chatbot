import { ChatInterface } from '@/components/chat/chat-interface';
import { getMessagesByChatId } from '@/lib/db/queries';

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  // TODO: Get userId from session
  const userId = 'temp-user-id';

  // Fetch existing messages
  const dbMessages = await getMessagesByChatId(id);

  return <ChatInterface chatId={id} userId={userId} initialMessages={dbMessages} />;
}
