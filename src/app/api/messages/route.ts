import { NextRequest, NextResponse } from 'next/server';
import { createMessage } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, chatId, role, content, metadata } = body;

    const message = await createMessage(id, chatId, role, content, metadata);

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Failed to save message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save message' },
      { status: 500 }
    );
  }
}
