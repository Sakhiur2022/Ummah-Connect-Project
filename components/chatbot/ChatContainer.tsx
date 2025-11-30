"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/hooks/useChat";
import { useThemeSafe } from "@/lib/use-theme-safe";

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
            className="bg-blue-600 text-white px-3 py-1 rounded-full shadow-lg"
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
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-xl z-[2001]"
            >
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold">Safety Analysis</h2>

                <button
                  onClick={closePopup}
                  className="text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              </div>

              {/* Selected text */}
              <div className="mt-4 bg-gray-100 dark:bg-slate-800 p-3 rounded-md text-sm">
                {selectedText || "No text selected"}
              </div>

              {/* Loading */}
              {isLoading && (
                <div className="mt-6 text-center text-blue-600">Analyzing…</div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-6 text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Result */}
              {analysisResult && (
                <pre className="mt-6 bg-gray-50 dark:bg-slate-800 p-4 rounded-md text-sm whitespace-pre-wrap">
                  {JSON.stringify(analysisResult, null, 2)}
                </pre>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
