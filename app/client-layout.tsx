"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { AudioVisualizer } from "@/components/audio-visualizer"

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [audioData, setAudioData] = useState<{ frequency: number; amplitude: number; beat: boolean } | undefined>()

  return (
    <>
      {children}
      {/* Audio visualizer in client layout so music persists across pages */}
      <AudioVisualizer
        audioSrc="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Love%20and%20Life%20%28Slowed%20%2B%20Echo%29%20by%20Baraa%20Masoud-ibe1Ere18rvPrY76MzlfxYceVSeyAh.mp3"
        onAudioData={setAudioData}
      />
    </>
  )
}
