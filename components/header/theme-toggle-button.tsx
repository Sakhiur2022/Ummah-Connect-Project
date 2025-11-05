"use client";

import { useTheme } from "@/lib/theme-context";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-full px-4 py-2 text-left text-sm hover:bg-accent/50 transition-colors flex items-center space-x-2"
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-4 h-4 text-yellow-500" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-slate-600" />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  );
}
