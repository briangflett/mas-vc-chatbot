'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Message } from './message';
import { ChatMessage } from '@/lib/n8n/types';

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming?: boolean;
  streamingContent?: string;
}

export function MessageList({ messages, isStreaming, streamingContent }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages or streaming content changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  return (
    <ScrollArea className="flex-1 p-4">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}

      {isStreaming && (
        <div className="flex justify-start mb-4">
          {streamingContent ? (
            <div className="bg-muted rounded-lg px-4 py-3 max-w-[80%]">
              <div className="text-sm whitespace-pre-wrap">{streamingContent}</div>
              <div className="flex gap-1 mt-2">
                <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-pulse" />
                <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-pulse delay-100" />
                <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-pulse delay-200" />
              </div>
            </div>
          ) : (
            <div className="bg-muted rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-foreground/50 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-foreground/50 rounded-full animate-pulse delay-100" />
                <div className="w-2 h-2 bg-foreground/50 rounded-full animate-pulse delay-200" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invisible element to scroll to */}
      <div ref={bottomRef} />
    </ScrollArea>
  );
}
