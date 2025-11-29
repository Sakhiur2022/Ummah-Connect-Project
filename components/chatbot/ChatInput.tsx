'use client';

// components/chatbot/ChatInput.tsx
// Input component: Allows manual text paste and submission for analysis

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useThemeSafe } from '@/lib/use-theme-safe';

interface ChatInputProps {
  onAnalyze: (text: string) => void;
}

export default function ChatInput({ onAnalyze }: ChatInputProps) {
  const { theme } = useThemeSafe();
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length >= 6) {
      onAnalyze(text);
      setText('');
    }
  };

  return (
    <div className={`${theme === 'light' ? 'bg-white/70 border-amber-300' : 'bg-slate-800/50 border-slate-700'} backdrop-blur-md rounded-2xl p-6 border`}>
      <h2 className={`text-xl font-semibold ${theme === 'light' ? 'text-amber-700' : 'text-cyan-300'} mb-4`}>
        Or Paste Text to Analyze
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste text here (minimum 6 characters)..."
          className={`w-full ${theme === 'light' ? 'bg-white border-amber-200 text-amber-950 placeholder-amber-400 focus:ring-amber-500' : 'bg-slate-900/50 border-slate-600 text-slate-200 placeholder-slate-500 focus:ring-cyan-500'} border rounded-xl p-4 focus:outline-none focus:ring-2 focus:border-transparent resize-none`}
          rows={4}
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={text.trim().length < 6}
          className={`w-full ${theme === 'light' ? 'bg-gradient-to-r from-amber-600 to-amber-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'} text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Analyze Text
        </motion.button>
      </form>
    </div>
  );
}
