'use client';

// components/chatbot/GlobalChatbot.tsx
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatContainer from './ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useThemeSafe } from '@/lib/use-theme-safe';
import { createPortal } from "react-dom";


export default function GlobalChatbot() {
  const { theme } = useThemeSafe();
  const {
    selectedText,
    bubblePosition,
    showBubble,
    isPopupOpen,
    isEnabled,
    handleSelectionChange,
    openPopup,
    closePopup,
    toggleEnabled,
  } = useChat();

  const containerRef = useRef<HTMLDivElement>(null);

  // Listen for text selection anywhere on the page
  useEffect(() => {
    const handleSelection = () => handleSelectionChange();

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
    };
  }, [handleSelectionChange]);


  
return createPortal(
  <>
    {showBubble && (
      <div 
        className="fixed z-[99999] bg-black text-white px-3 py-1 rounded-full text-sm shadow-lg"
        style={{ left: bubblePosition.x, top: bubblePosition.y }}
        onClick={openPopup}
      >
        Analyze Emotion
      </div>
    )}

    {isPopupOpen && (
      <ChatContainer
        selectedText={selectedText}
        onClose={closePopup}
        result={analysisResult}
        error={error}
        isLoading={isLoading}
      />
    )}
  </>,
  document.body
);


  
  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        isPopupOpen
      ) {
        closePopup();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPopupOpen, closePopup]);

  return (
    <>
      {/* Floating bubble */}
      <AnimatePresence>
        {showBubble && isEnabled && !isPopupOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={openPopup}
            style={{
              position: 'fixed',
              left: bubblePosition.x,
              top: bubblePosition.y,
              zIndex: 1000,
            }}
            className={`${
              theme === 'light'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500'
            } text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2 text-sm font-medium`}
          >
            Analyze Emotion 🔍
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat popup container */}
      <div ref={containerRef}>
        <AnimatePresence>
          {isPopupOpen && <ChatContainer />}
        </AnimatePresence>
      </div>
    </>
  );
}
