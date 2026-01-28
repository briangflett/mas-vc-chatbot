import { ChatMessage } from '@/lib/n8n/types';

interface MessageProps {
  message: ChatMessage;
}

export function Message({ message }: MessageProps) {
  return (
    <div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {/* Show tool calls if present */}
        {message.metadata?.toolCalls && message.metadata.toolCalls.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <p className="text-xs opacity-70">
              Used tools: {message.metadata.toolCalls.map(t => t.toolName).join(', ')}
            </p>
          </div>
        )}

        <p className="text-xs opacity-50 mt-1">
          {new Date(message.createdAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
