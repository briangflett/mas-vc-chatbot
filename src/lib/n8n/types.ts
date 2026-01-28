export interface N8NStreamChunk {
  type: 'content' | 'tool_use' | 'error' | 'done';
  content?: string;
  toolCall?: {
    name: string;
    input: any;
    output?: any;
  };
  error?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    toolCalls?: Array<{
      toolName: string;
      input: any;
      output: any;
    }>;
    sources?: string[];
  };
  createdAt: Date;
}
