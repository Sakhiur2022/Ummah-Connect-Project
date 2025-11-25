'use client';

// components/chatbot/ChatContainer.tsx
// Client component: Manages text selection detection, floating bubble, and analysis popup

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/hooks/useChat';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';

export default function ChatContainer() {
  const {
    selectedText,
    bubblePosition,
    showBubble,
    isPopupOpen,
    isEnabled,
    analysisResult,
    isLoading,
    error,
    handleSelectionChange,
    openPopup,
    closePopup,
    toggleEnabled,
    analyzeText,
  } = useChat();

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen for selection changes (debounced in hook)
    const handleSelection = () => {
      handleSelectionChange();
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);

    // Expose global function to re-enable popup
    (window as any).ucShowSafetyPopup = () => {
      if (!isEnabled) {
        toggleEnabled();
      }
      alert('Safety popup enabled!');
    };

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
    };
  }, [handleSelectionChange, isEnabled, toggleEnabled]);

  return (
    <div ref={containerRef} className="relative min-h-screen p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
          NoorBot
        </h1>
        <p className="text-gray-300">
          Select text anywhere on this page to analyze its emotional safety
        </p>
      </div>

      {/* Main content area */}
      <div className="max-w-4xl mx-auto space-y-6">
        <ChatInput onAnalyze={analyzeText} />

        {/* Sample text for testing */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-blue-300 mb-4">
            Sample Text (Try selecting this)
          </h2>
          <p className="text-gray-300 leading-relaxed select-text">
            This is a sample paragraph you can select to test the emotional safety
            analysis feature. The system will analyze the selected text for toxicity,
            harassment, and manipulation indicators. You can also paste your own text
            in the input box above.
          </p>
        </div>
      </div>

      {/* Floating bubble near selection */}
      <AnimatePresence>
        {showBubble && isEnabled && (
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
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2 text-sm font-medium"
          >
            Analyze Emotion 🔍
          </motion.button>
        )}
      </AnimatePresence>

      {/* Analysis popup modal */}
      <AnimatePresence>
        {isPopupOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePopup}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[1002] w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-xl rounded-2xl border border-blue-500/30 shadow-2xl p-6">
                {/* Header with toggle */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                    Safety Analysis
                  </h3>
                  <div className="flex items-center gap-4">
                    {/* Toggle */}
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={toggleEnabled}
                        className="w-4 h-4 rounded accent-blue-500"
                      />
                      Auto-detect
                    </label>
                    {/* Close button */}
                    <button
                      onClick={closePopup}
                      className="text-gray-400 hover:text-white transition-colors"
                      aria-label="Close"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Selected text preview */}
                <div className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-700">
                  <p className="text-sm text-gray-400 mb-1">Selected Text:</p>
                  <p className="text-gray-200 text-sm">
                    {selectedText.length > 240
                      ? `${selectedText.slice(0, 240)}...`
                      : selectedText}
                  </p>
                </div>

                {/* Results */}
                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
                    {error}
                  </div>
                )}

                {analysisResult && !isLoading && (
                  <ChatMessage result={analysisResult} />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Keyboard handler for Esc */}
      {isPopupOpen && (
        <div
          onKeyDown={(e) => {
            if (e.key === 'Escape') closePopup();
          }}
          tabIndex={-1}
          className="fixed inset-0 pointer-events-none"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
