'use client';

import dynamic from 'next/dynamic';

// Import ChatbotWidget with client-side only rendering
const ChatbotWidget = dynamic(() => import('@/components/chatbot-widget'), {
  ssr: false,
});

export default function ChatbotWrapper() {
  return <ChatbotWidget />;
}
