"use client";

import { useContext } from "react";
import { ThemeContext } from "@/lib/theme-context";

/**
 * Safe wrapper around useTheme that returns defaults if not in provider
 * Safely handles being called outside ThemeProvider context (e.g., during prerendering)
 */
export function useThemeSafe() {
  const context = useContext(ThemeContext);

  // Return defaults if context is not available
  if (!context) {
    return {
      theme: "dark" as const,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }

  return context;
}
