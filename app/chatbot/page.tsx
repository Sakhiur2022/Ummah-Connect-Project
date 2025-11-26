// app/chatbot/page.tsx
// Server component: Entry point for the chatbot page with emotional safety analysis

import { Metadata } from 'next';
import ChatContainer from '@/components/chatbot/ChatContainer';
import Header from '@/components/ui/header';
import { ProfileAnimatedBackground } from '@/components/background/profile-animated-background';

export const metadata: Metadata = {
  title: 'Emotional Safety Chat | Ummah Connect',
  description: 'Analyze text for emotional safety and wellbeing',
};

export default function ChatbotPage() {
  return (
    <>
    <Header/>
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <ChatContainer />
    </main>
    </>
  );
}
