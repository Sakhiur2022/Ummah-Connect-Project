"use client";

import type { ReactNode } from "react";
import { AudioVisualizer } from "@/components/audio-visualizer";
import { AudioProvider, useAudio } from "@/lib/audio-context";
import { ThemeProvider } from "@/lib/theme-context";

function ClientLayoutContent({ children }: { children: ReactNode }) {
  const { setAudioData } = useAudio();

  return (
    <>
      {children}
      <AudioVisualizer
        audioSrc="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Love%20and%20Life%20%28Slowed%20%2B%20Echo%29%20by%20Baraa%20Masoud-ibe1Ere18rvPrY76MzlfxYceVSeyAh.mp3"
        onAudioData={setAudioData}
      />
    </>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AudioProvider>
        <ClientLayoutContent>{children}</ClientLayoutContent>
      </AudioProvider>
    </ThemeProvider>
  );
}
