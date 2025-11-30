"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/hooks/useChat";
import { useThemeSafe } from "@/lib/use-theme-safe";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";

export default function ChatContainer() {
  const { theme } = useThemeSafe();

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

  // Listen globally for text selection
  useEffect(() => {
    const handler = () => handleSelectionChange();
    document.addEventListener("mouseup", handler);
    document.addEventListener("touchend", handler);

    return () => {
      document.removeEventListener("mouseup", handler);
      document.removeEventListener("touchend", handler);
    };
  }, [handleSelectionChange]);

  return (
    <>
      {/* Floating bubble */}
      <AnimatePresence>
        {showBubble && isEnabled && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={openPopup}
            style={{
              position: "fixed",
              left: bubblePosition.x,
              top: bubblePosition.y,
              zIndex: 2000,
            }}
            className={`${
              theme === "light"
                ? "bg-gradient-to-r from-amber-600 to-amber-500"
                : "bg-gradient-to-r from-cyan-500 to-blue-500"
            } text-white px-3 py-1 rounded-full shadow-lg hover:shadow-xl transition-shadow text-sm font-medium`}
          >
            Analyze Emotion 🔍
          </motion.button>
        )}
      </AnimatePresence>

      {/* Popup modal */}
      <AnimatePresence>
        {isPopupOpen && (
          <>
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePopup}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1999]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                ${theme === "light" ? "bg-white border-amber-300" : "bg-slate-900 border-slate-700"} 
                p-6 rounded-2xl w-full max-w-xl z-[2001] shadow-2xl
                max-h-[85vh] flex flex-col`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-2 flex-shrink-0">
                <h2
                  className={`text-xl font-bold ${
                    theme === "light" ? "text-amber-950" : "text-cyan-300"
                  }`}
                >
                  Safety Analysis
                </h2>

                <button
                  onClick={closePopup}
                  className={`${
                    theme === "light"
                      ? "text-amber-900 hover:text-amber-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  ✕
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 space-y-4 mt-2">
                {/* Selected text preview */}
                <div
                  className={`p-3 rounded-md text-sm ${
                    theme === "light" ? "bg-amber-50 text-amber-950" : "bg-slate-800 text-slate-200"
                  }`}
                >
                  {selectedText || "No text selected"}
                </div>

                {/* Chat input */}
                <div>
                  <ChatInput
                    initialMessage={selectedText}
                    onAnalyze={(text) => analyzeText(text)}
                  />
                </div>

                {/* Loading */}
                {isLoading && (
                  <div
                    className={`mt-2 text-center ${
                      theme === "light" ? "text-amber-600" : "text-cyan-400"
                    }`}
                  >
                    Analyzing…
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div
                    className={`p-3 rounded-md ${
                      theme === "light"
                        ? "bg-red-50 text-red-900 border border-red-200"
                        : "bg-red-500/20 text-red-200 border border-red-500/50"
                    }`}
                  >
                    {error}
                  </div>
                )}

                {/* Result */}
                {analysisResult && !isLoading && (
                  <div className="space-y-4">
                    <ChatMessage result={analysisResult} />
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
