'use client';

export interface StreamChunk {
  type: 'content' | 'tool_use' | 'error' | 'done';
  content?: string;
  toolCall?: {
    name: string;
    input: any;
    output?: any;
  };
  error?: string;
}

// Mock streaming function for testing UI without n8n
export async function streamChatFromN8NMock(
  message: string,
  chatId: string,
  userId: string,
  onChunk: (chunk: StreamChunk) => void,
  onComplete: () => void,
  onError: (error: Error) => void
) {
  try {
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock response based on user message
    const mockResponse = getMockResponse(message);

    // Stream response word by word
    const words = mockResponse.split(' ');
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50)); // Delay between words
      onChunk({
        type: 'content',
        content: words[i] + (i < words.length - 1 ? ' ' : ''),
      });
    }

    // Simulate tool call if message asks about contacts or cases
    if (message.toLowerCase().includes('contact') || message.toLowerCase().includes('case')) {
      await new Promise(resolve => setTimeout(resolve, 300));
      onChunk({
        type: 'tool_use',
        toolCall: {
          name: message.toLowerCase().includes('contact') ? 'search_contacts' : 'search_cases',
          input: { query: message },
          output: { found: 3, results: ['Example 1', 'Example 2', 'Example 3'] },
        },
      });
    }

    await new Promise(resolve => setTimeout(resolve, 200));
    onChunk({ type: 'done' });
    onComplete();
  } catch (error) {
    onError(error as Error);
  }
}

function getMockResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('contact')) {
    return "I found 3 contacts matching your query. Here are the details: John Smith (john@example.com), Jane Doe (jane@example.com), and Bob Johnson (bob@example.com). Would you like more information about any of these contacts?";
  }

  if (lowerMessage.includes('case')) {
    return "I searched our CiviCRM database and found 2 active cases. The first case is 'Website Migration' assigned to Sarah Lee, started on Jan 10, 2026. The second case is 'Database Optimization' assigned to Mike Chen, started on Jan 15, 2026. Both cases are currently in progress.";
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('what can you')) {
    return "I'm your MAS volunteer consultant AI assistant! I can help you with: (1) Searching for contacts in CiviCRM, (2) Finding case information, (3) Accessing MAS knowledge base articles, and (4) Answering questions about MAS processes and procedures. What would you like to know?";
  }

  return `Thank you for your message: "${message}". I'm a mock AI assistant. In production, I'll be connected to n8n workflows that will search CiviCRM, retrieve knowledge base articles, and provide intelligent responses using Claude API. For now, I'm just simulating the streaming behavior to help you test the UI!`;
}

// Real n8n streaming function
export async function streamChatFromN8N(
  message: string,
  chatId: string,
  userId: string,
  onChunk: (chunk: StreamChunk) => void,
  onComplete: () => void,
  onError: (error: Error) => void
) {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_N8N_WEBHOOK_TOKEN}`,
      },
      body: JSON.stringify({
        message,
        chatId,
        userId,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onComplete();
        break;
      }

      const chunk = decoder.decode(value, { stream: true });

      // Parse SSE format: "data: {...}\n\n"
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            onChunk(data);
          } catch (e) {
            console.error('Failed to parse SSE data:', jsonStr);
          }
        }
      }
    }
  } catch (error) {
    onError(error as Error);
  }
}
