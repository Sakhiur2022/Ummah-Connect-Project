"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface AudioData {
  frequency: number
  amplitude: number
  beat: boolean
}

interface AudioContextType {
  audioData: AudioData | undefined
  setAudioData: (data: AudioData | undefined) => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [audioData, setAudioData] = useState<AudioData | undefined>()

  return <AudioContext.Provider value={{ audioData, setAudioData }}>{children}</AudioContext.Provider>
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider")
  }
  return context
}
