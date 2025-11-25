'use client';

// hooks/useChat.ts
// Custom hook: Manages text selection detection, popup state, and API communication

import { useState, useCallback, useRef } from 'react';

interface AnalysisResult {
  emotion?: { [emotionName: string]: number };
  sentiment?: 'positive' | 'neutral' | 'negative';
  toxicity: number;
  harassment: number;
  manipulation: number;
  distress_level: 'low' | 'medium' | 'high';
  recommendations: string[];
  resources: { title: string; url?: string; phone?: string }[];
}

const STORAGE_KEY = 'uc_safety_popup_enabled';
const DEBOUNCE_MS = 250;

export function useChat() {
  const [selectedText, setSelectedText] = useState('');
  const [bubblePosition, setBubblePosition] = useState({ x: 0, y: 0 });
  const [showBubble, setShowBubble] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? true : stored === 'true';
    }
    return true;
  });
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Handle text selection with debounce
  const handleSelectionChange = useCallback(() => {
    if (!isEnabled) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || '';

      if (text.length >= 6) {
        setSelectedText(text);

        // Calculate bubble position
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();

        if (rect) {
          setBubblePosition({
            x: rect.left + rect.width / 2 - 75, // Center bubble (approx width 150px)
            y: rect.bottom + 10, // 10px below selection
          });
          setShowBubble(true);
        }
      } else {
        setShowBubble(false);
      }
    }, DEBOUNCE_MS);
  }, [isEnabled]);

  // Open popup and trigger analysis
  const openPopup = useCallback(() => {
    setShowBubble(false);
    setIsPopupOpen(true);
    setError(null);
    
    if (selectedText.length >= 6) {
      analyzeText(selectedText);
    } else {
      setError('Select more text to analyze (minimum 6 characters).');
    }
  }, [selectedText]);

  // Close popup
  const closePopup = useCallback(() => {
setIsPopupOpen(false);
setAnalysisResult(null);
setError(null);
}, []);
// Toggle enabled state
const toggleEnabled = useCallback(() => {
setIsEnabled((prev) => {
const newValue = !prev;
localStorage.setItem(STORAGE_KEY, String(newValue));
if (!newValue) {
setShowBubble(false);
}
return newValue;
});
}, []);
// Analyze text via API
const analyzeText = useCallback(async (text: string) => {
if (text.length < 6) {
setError('Text must be at least 6 characters long.');
return;
}
setIsLoading(true);
setError(null);
setAnalysisResult(null);

// Open popup if not already open
if (!isPopupOpen) {
  setSelectedText(text);
  setIsPopupOpen(true);
}

try {
  const response = await fetch('/chatbot/api/perspective', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Analysis failed');
  }

  const result: AnalysisResult = await response.json();
  setAnalysisResult(result);
} catch (err: any) {
  console.error('Analysis error:', err);
  setError(
    err.message || "Couldn't analyze text right now. Try again."
  );
} finally {
  setIsLoading(false);
}
}, [isPopupOpen]);
return {
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
};
}
