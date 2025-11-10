"use client";

import { useThemeSafe } from "@/lib/use-theme-safe";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggleButton() {
  const { theme, toggleTheme } = useThemeSafe();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

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
