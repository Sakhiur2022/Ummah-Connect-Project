"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { Volume2, VolumeX, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AudioVisualizerProps {
  audioSrc: string // Made audio source configurable
  onAudioData?: (data: { frequency: number; amplitude: number; beat: boolean }) => void
  className?: string // Added className for positioning flexibility
}

export function AudioVisualizer({
  audioSrc,
  onAudioData,
  className = "fixed bottom-6 right-6 z-50",
}: AudioVisualizerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.3)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const stableOnAudioData = useCallback(onAudioData || (() => {}), [onAudioData])

  const initializeAudio = useCallback(() => {
    const audio = audioRef.current
    if (!audio || isInitialized) return

    console.log("[v0] Initializing audio context")

    try {
      // Only create audio context and source if they don't exist
      if (!audioContextRef.current) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioContext
      }

      if (!analyserRef.current) {
        const analyser = audioContextRef.current.createAnalyser()
        analyser.fftSize = 256
        analyserRef.current = analyser
      }

      // Only create source node if it doesn't exist
      if (!sourceRef.current) {
        const source = audioContextRef.current.createMediaElementSource(audio)
        sourceRef.current = source

        // Connect the audio graph
        source.connect(analyserRef.current)
        analyserRef.current.connect(audioContextRef.current.destination)
      }

      if (!dataArrayRef.current) {
        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        dataArrayRef.current = dataArray
      }

      // Set initial volume and loop
      audio.volume = volume
      audio.loop = true

      setIsInitialized(true)
      console.log("[v0] Audio context initialized successfully")
    } catch (error) {
      console.error("[v0] Error initializing audio context:", error)
      setHasError(true)
      // Reset refs on error to allow retry
      audioContextRef.current = null
      sourceRef.current = null
      analyserRef.current = null
      dataArrayRef.current = null
    }
  }, []) // Empty dependency array to prevent infinite loop

  useEffect(() => {
    const audio = audioRef.current
    if (audio && isInitialized) {
      audio.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted, isInitialized])

  useEffect(() => {
    if (!isInitialized) return

    let lastBeatTime = 0
    const beatThreshold = 140

    const analyzeAudio = () => {
      if (!analyserRef.current || !dataArrayRef.current || !isPlaying) return

      analyserRef.current.getByteFrequencyData(dataArrayRef.current)

      // Calculate average frequency and amplitude
      let sum = 0
      let maxAmplitude = 0

      for (let i = 0; i < dataArrayRef.current.length; i++) {
        sum += dataArrayRef.current[i]
        maxAmplitude = Math.max(maxAmplitude, dataArrayRef.current[i])
      }

      const averageFrequency = sum / dataArrayRef.current.length
      const normalizedAmplitude = maxAmplitude / 255

      // Simple beat detection
      const currentTime = Date.now()
      const isBeat = maxAmplitude > beatThreshold && currentTime - lastBeatTime > 300

      if (isBeat) {
        lastBeatTime = currentTime
      }

      // Send data to parent component
      stableOnAudioData({
        frequency: averageFrequency,
        amplitude: normalizedAmplitude,
        beat: isBeat,
      })

      animationIdRef.current = requestAnimationFrame(analyzeAudio)
    }

    if (isPlaying) {
      analyzeAudio()
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [isPlaying, isInitialized, stableOnAudioData])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => {
      console.log("[v0] Audio play event")
      setIsPlaying(true)
      setIsLoading(false)
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume()
      }
    }

    const handlePause = () => {
      console.log("[v0] Audio pause event")
      setIsPlaying(false)
      setIsLoading(false)
    }

    const handleCanPlay = () => {
      console.log("[v0] Audio can play, initializing context")
      setIsLoading(false)
      if (!isInitialized) {
        initializeAudio()
      }
    }

    const handleLoadStart = () => {
      console.log("[v0] Audio loading started")
      setIsLoading(true)
      setHasError(false)
    }

    const handleError = (e: Event) => {
      console.error("[v0] Audio loading error:", e)
      setHasError(true)
      setIsLoading(false)
      setIsPlaying(false)
    }

    const handleLoadedData = () => {
      console.log("[v0] Audio data loaded successfully")
      setIsLoading(false)
      setHasError(false)
    }

    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("error", handleError)
    audio.addEventListener("loadeddata", handleLoadedData)

    return () => {
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("error", handleError)
      audio.removeEventListener("loadeddata", handleLoadedData)
    }
  }, []) // Empty dependency array, initializeAudio is stable now

  useEffect(() => {
    return () => {
      console.log("[v0] Cleaning up audio context")
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }

      // Disconnect source node before closing context
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect()
        } catch (error) {
          console.warn("[v0] Error disconnecting source:", error)
        }
        sourceRef.current = null
      }

      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close()
        audioContextRef.current = null
      }

      analyserRef.current = null
      dataArrayRef.current = null
    }
  }, [])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      try {
        setIsLoading(true)
        if (!isInitialized) {
          initializeAudio()
        }

        if (audioContextRef.current?.state === "suspended") {
          await audioContextRef.current.resume()
          console.log("[v0] Audio context resumed")
        }

        await audio.play()
        console.log("[v0] Audio started playing successfully")
      } catch (error) {
        console.error("[v0] Error playing audio:", error)
        setHasError(true)
        setIsLoading(false)
      }
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseFloat(e.target.value)
    setVolume(newVolume)
    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border/50 rounded-full px-4 py-2 shadow-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePlay}
          className="h-8 w-8 p-0 hover:bg-primary/10"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4 text-primary" />
          ) : (
            <Play className="h-4 w-4 text-primary" />
          )}
        </Button>

        <Button variant="ghost" size="sm" onClick={toggleMute} className="h-8 w-8 p-0 hover:bg-primary/10">
          {isMuted ? (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Volume2 className="h-4 w-4 text-primary" />
          )}
        </Button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-16 h-1 bg-border rounded-lg appearance-none cursor-pointer slider"
        />

        {hasError && <div className="text-xs text-red-400 ml-2">Error</div>}
      </div>

      <audio ref={audioRef} src={audioSrc} preload="auto" crossOrigin="anonymous" />
    </div>
  )
}
