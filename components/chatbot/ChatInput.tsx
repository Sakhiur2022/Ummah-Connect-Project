'use client';

// components/chatbot/ChatInput.tsx
// Input component: Allows manual text paste and submission for analysis

import { useState } from 'react';
import { motion } from 'framer-motion';

interface ChatInputProps {
  onAnalyze: (text: string) => void;
}

export default function ChatInput({ onAnalyze }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length >= 6) {
      onAnalyze(text);
      setText('');
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
      <h2 className="text-xl font-semibold text-blue-300 mb-4">
        Or Paste Text to Analyze
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste text here (minimum 6 characters)..."
          className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={4}
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={text.trim().length < 6}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Analyze Text
        </motion.button>
      </form>
    </div>
  );
}
