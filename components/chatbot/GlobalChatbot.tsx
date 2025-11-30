"use client";

import React, { useState, useEffect, useRef } from "react";
import ChatContainer from "@/components/chat/ChatContainer";

export default function GlobalChatBot() {
  const [showPopup, setShowPopup] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  const chatRef = useRef<HTMLDivElement>(null);

  // Detect text selection
  useEffect(() => {
    const handleMouseUp = () => {
      const text = window.getSelection()?.toString().trim();

      if (text && text.length > 0) {
        const selection = window.getSelection();
        if (!selection) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setSelectedText(text);
        setPopupPos({
          x: rect.left + rect.width / 2,
          y: rect.top - 40,
        });
        setShowPopup(true);
      } else {
        setShowPopup(false);
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  // Click outside to close chat
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (chatRef.current && !chatRef.current.contains(e.target as Node)) {
        setShowChat(false);
      }
    }

    if (showChat) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showChat]);

  return (
    <>
      {/* 🔹 Popup for "Analyze Emotion" */}
      {showPopup && !showChat && (
        <div
          className="fixed px-3 py-2 text-sm bg-black text-white rounded shadow-lg z-[9999] cursor-pointer"
          style={{ top: popupPos.y, left: popupPos.x }}
          onClick={() => {
            setShowChat(true);
            setShowPopup(false);
          }}
        >
          Analyze Emotion
        </div>
      )}

      {/* 🔹 Dim Background Overlay */}
      {showChat && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]"></div>
      )}

      {/* 🔹 Chat Container */}
      {showChat && (
        <div
          ref={chatRef}
          className="fixed bottom-6 right-6 z-[9999] w-[380px] max-h-[70vh]"
        >
          <ChatContainer initialMessage={selectedText} />
        </div>
      )}
    </>
  );
}
