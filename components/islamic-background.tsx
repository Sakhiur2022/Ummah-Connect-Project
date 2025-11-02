"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

interface IslamicBackgroundProps {
  audioData?: { frequency: number; amplitude: number; beat: boolean }
}

export function IslamicBackground({ audioData }: IslamicBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const starsRef = useRef<THREE.Points | null>(null)
  const moonRef = useRef<THREE.Mesh | null>(null)
  const particlesRef = useRef<THREE.Points | null>(null)
  const [beatIntensity, setBeatIntensity] = useState(0)

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

    // Create starfield
    const starsGeometry = new THREE.BufferGeometry()
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 2,
      transparent: true,
      opacity: 0.8,
    })
    const starsVertices = []
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 2000
      const y = (Math.random() - 0.5) * 2000
      const z = (Math.random() - 0.5) * 2000
      starsVertices.push(x, y, z)
    }

    starsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starsVertices, 3))
    const stars = new THREE.Points(starsGeometry, starsMaterial)
    starsRef.current = stars
    scene.add(stars)

    // Create crescent moon
    const moonGeometry = new THREE.RingGeometry(15, 25, 0, Math.PI * 1.5)
    const moonMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    })
    const moon = new THREE.Mesh(moonGeometry, moonMaterial)
    moon.position.set(-100, 100, -200)
    moonRef.current = moon
    scene.add(moon)

    // Create floating particles (representing lantern light)
    const particlesGeometry = new THREE.BufferGeometry()
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xffa500,
      size: 3,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    })

    const particlesVertices = []
    for (let i = 0; i < 50; i++) {
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

      const amplitude = audioData?.amplitude || 0
      const frequency = audioData?.frequency || 0
      const beat = audioData?.beat || false

      // Beat-responsive effects
      if (beat) {
        setBeatIntensity(1)
      } else {
        setBeatIntensity((prev) => Math.max(0, prev - 0.05))
      }

      // Audio-reactive star rotation
      if (starsRef.current) {
        starsRef.current.rotation.y += 0.0005 + amplitude * 0.002
        ;(starsRef.current.material as THREE.PointsMaterial).opacity = 0.6 + amplitude * 0.4
      }

      // Audio-reactive moon glow
      if (moonRef.current) {
        const baseOpacity = 0.8 + Math.sin(Date.now() * 0.001) * 0.2
        ;(moonRef.current.material as THREE.MeshBasicMaterial).opacity = baseOpacity + amplitude * 0.3
        moonRef.current.scale.setScalar(1 + beatIntensity * 0.2)
      }

      // Audio-reactive particles
      if (particlesRef.current) {
        particlesRef.current.rotation.y += 0.001 + frequency * 0.0001
        particlesRef.current.rotation.x += 0.0005 + amplitude * 0.001
        ;(particlesRef.current.material as THREE.PointsMaterial).opacity = 0.6 + amplitude * 0.4
        ;(particlesRef.current.material as THREE.PointsMaterial).size = 3 + beatIntensity * 2
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
  }, [audioData, beatIntensity])

  return (
    <div className="fixed inset-0 -z-10">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage: "url('/images/islamic-night-scene.png')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/80" />
      <div ref={mountRef} className="relative z-10" />
    </div>
  )
}
