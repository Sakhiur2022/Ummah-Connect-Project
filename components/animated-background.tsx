"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

interface AnimatedBackgroundProps {
  backgroundImage?: string // Made background image configurable
  audioData?: { frequency: number; amplitude: number; beat: boolean }
  theme?: "islamic" | "modern" | "space" // Added theme support for different styles
  className?: string
}

export function AnimatedBackground({
  backgroundImage,
  audioData,
  theme = "islamic",
  className = "fixed inset-0 -z-10",
}: AnimatedBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const starsRef = useRef<THREE.Points | null>(null)
  const moonRef = useRef<THREE.Mesh | null>(null)
  const particlesRef = useRef<THREE.Points | null>(null)
  const beatIntensityRef = useRef(0) // Use ref instead of state to prevent re-renders
  const audioDataRef = useRef(audioData)

  useEffect(() => {
    audioDataRef.current = audioData
  }, [audioData])

  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    rendererRef.current = renderer

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    mountRef.current.appendChild(renderer.domElement)

    const themeConfig = {
      islamic: {
        starColor: 0xffd700,
        moonColor: 0xffd700,
        particleColor: 0xffa500,
        starCount: 1000,
        particleCount: 50,
      },
      modern: {
        starColor: 0x00ffff,
        moonColor: 0x0080ff,
        particleColor: 0x00ff80,
        starCount: 800,
        particleCount: 30,
      },
      space: {
        starColor: 0xffffff,
        moonColor: 0xcccccc,
        particleColor: 0x8080ff,
        starCount: 1500,
        particleCount: 100,
      },
    }

    const config = themeConfig[theme]

    // Create starfield
    const starsGeometry = new THREE.BufferGeometry()
    const starsMaterial = new THREE.PointsMaterial({
      color: config.starColor,
      size: 2,
      transparent: true,
      opacity: 0.8,
    })

    const starsVertices = []
    for (let i = 0; i < config.starCount; i++) {
      const x = (Math.random() - 0.5) * 2000
      const y = (Math.random() - 0.5) * 2000
      const z = (Math.random() - 0.5) * 2000
      starsVertices.push(x, y, z)
    }

    starsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starsVertices, 3))
    const stars = new THREE.Points(starsGeometry, starsMaterial)
    starsRef.current = stars
    scene.add(stars)

    // Create moon/focal element
    const moonGeometry =
      theme === "islamic"
        ? new THREE.RingGeometry(15, 25, 0, Math.PI * 1.5) // Crescent for Islamic theme
        : new THREE.SphereGeometry(20, 32, 32) // Sphere for other themes
    const moonMaterial = new THREE.MeshBasicMaterial({
      color: config.moonColor,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    })
    const moon = new THREE.Mesh(moonGeometry, moonMaterial)
    moon.position.set(-100, 100, -200)
    moonRef.current = moon
    scene.add(moon)

    // Create floating particles
    const particlesGeometry = new THREE.BufferGeometry()
    const particlesMaterial = new THREE.PointsMaterial({
      color: config.particleColor,
      size: 3,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    })

    const particlesVertices = []
    for (let i = 0; i < config.particleCount; i++) {
      const x = (Math.random() - 0.5) * 400
      const y = (Math.random() - 0.5) * 400
      const z = (Math.random() - 0.5) * 400
      particlesVertices.push(x, y, z)
    }

    particlesGeometry.setAttribute("position", new THREE.Float32BufferAttribute(particlesVertices, 3))
    const particles = new THREE.Points(particlesGeometry, particlesMaterial)
    particlesRef.current = particles
    scene.add(particles)

    camera.position.z = 100

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)

      const currentAudioData = audioDataRef.current
      const amplitude = currentAudioData?.amplitude || 0
      const frequency = currentAudioData?.frequency || 0
      const beat = currentAudioData?.beat || false

      // Beat-responsive effects using ref to prevent re-renders
      if (beat) {
        beatIntensityRef.current = 1
      } else {
        beatIntensityRef.current = Math.max(0, beatIntensityRef.current - 0.05)
      }

      // Audio-reactive star rotation
      if (starsRef.current) {
        starsRef.current.rotation.y += 0.0005 + amplitude * 0.002
        starsRef.current.material.opacity = 0.6 + amplitude * 0.4
      }

      // Audio-reactive moon glow
      if (moonRef.current) {
        const baseOpacity = 0.8 + Math.sin(Date.now() * 0.001) * 0.2
        moonRef.current.material.opacity = baseOpacity + amplitude * 0.3
        moonRef.current.scale.setScalar(1 + beatIntensityRef.current * 0.2)
      }

      // Audio-reactive particles
      if (particlesRef.current) {
        particlesRef.current.rotation.y += 0.001 + frequency * 0.0001
        particlesRef.current.rotation.x += 0.0005 + amplitude * 0.001
        particlesRef.current.material.opacity = 0.6 + amplitude * 0.4
        particlesRef.current.material.size = 3 + beatIntensityRef.current * 2
      }

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      if (!camera || !renderer) return
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [theme]) // Only depend on theme, not audioData to prevent re-renders

  return (
    <div className={className}>
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/80" />
      <div ref={mountRef} className="relative z-10" />
    </div>
  )
}
