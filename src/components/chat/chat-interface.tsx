'use client';

import { useState, useRef } from 'react';
import { MessageList } from './message-list';
import { MessageInput, MessageInputRef } from './message-input';
// TOGGLE BETWEEN MOCK AND REAL n8n:
// - For testing UI: import { streamChatFromN8NMock as streamChatFromN8N }
// - For real n8n: import { streamChatFromN8N }
import { streamChatFromN8NMock as streamChatFromN8N } from '@/lib/n8n/streaming-client';
import { ChatMessage } from '@/lib/n8n/types';
import { nanoid } from 'nanoid';

interface ChatInterfaceProps {
  chatId: string;
  userId: string;
  initialMessages: ChatMessage[];
}

export function ChatInterface({ chatId, userId, initialMessages }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const inputRef = useRef<MessageInputRef>(null);

  const handleSendMessage = async (content: string) => {
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: nanoid(),
      chatId,
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    setStreamingContent('');

    // Save user message to database (server action)
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userMessage.id, chatId, role: 'user', content }),
    });

    // Accumulate streaming content in a variable outside the closure
    let accumulatedContent = '';

    // Stream response from n8n
    await streamChatFromN8N(
      content,
      chatId,
      userId,
      (chunk) => {
        if (chunk.type === 'content' && chunk.content) {
          accumulatedContent += chunk.content;
          setStreamingContent(accumulatedContent);
        }
      },
      async () => {
        // Streaming complete - save assistant message
        const assistantMessage: ChatMessage = {
          id: nanoid(),
          chatId,
          role: 'assistant',
          content: accumulatedContent,
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setIsStreaming(false);
        setStreamingContent('');

        // Save to database
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: assistantMessage.id,
            chatId,
            role: 'assistant',
            content: accumulatedContent,
          }),
        });

        // Focus input for next message
        inputRef.current?.focus();
      },
      (error) => {
        console.error('Streaming error:', error);
        setIsStreaming(false);
        setStreamingContent('');
        // Show error message
        const errorMessage: ChatMessage = {
          id: nanoid(),
          chatId,
          role: 'assistant',
          content: 'Sorry, there was an error processing your request.',
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);

        // Focus input for retry
        inputRef.current?.focus();
      }
    );
  };

  return (
    <div className="flex flex-col h-screen">
      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
      />
      <MessageInput ref={inputRef} onSend={handleSendMessage} disabled={isStreaming} />
    </div>
  );
}
