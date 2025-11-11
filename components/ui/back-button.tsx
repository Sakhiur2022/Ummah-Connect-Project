"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-cyan-300 group"
    >
      <ArrowLeft className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      <span className="text-sm font-medium">Back</span>
    </button>
  );
}
