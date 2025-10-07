"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

interface AnimatedBackgroundProps {
  backgroundImage?: string
  audioData?: { frequency: number; amplitude: number; beat: boolean }
  theme?: "islamic" | "modern" | "space"
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
  const backgroundStarsRef = useRef<THREE.Points | null>(null)
  const orbsRef = useRef<THREE.Group | null>(null)
  const particlesRef = useRef<THREE.Points | null>(null)
  const beatIntensityRef = useRef(0)
  const audioDataRef = useRef(audioData)
  const timeRef = useRef(0)

  useEffect(() => {
    audioDataRef.current = audioData
  }, [audioData])

  useEffect(() => {
    if (!mountRef.current) return

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
        particleColor: 0xffcc66,
        starCount: 1500,
        particleCount: 15,
      },
      modern: {
        starColor: 0x00ffff,
        particleColor: 0x00ffaa,
        starCount: 800,
        particleCount: 30,
      },
      space: {
        starColor: 0xffffff,
        particleColor: 0xaaaaff,
        starCount: 1500,
        particleCount: 10,
      },
    }

    const config = themeConfig[theme]

    const backgroundStarsGeometry = new THREE.BufferGeometry()
    const backgroundStarsMaterial = new THREE.PointsMaterial({
      color: config.starColor,
      size: 1,
      transparent: true,
      opacity: 0.3,
    })

    const backgroundStarsVertices = []
    for (let i = 0; i < config.starCount * 2; i++) {
      const x = (Math.random() - 0.5) * 3000
      const y = (Math.random() - 0.5) * 3000
      const z = (Math.random() - 0.5) * 3000 - 500
      backgroundStarsVertices.push(x, y, z)
    }

    backgroundStarsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(backgroundStarsVertices, 3))
    const backgroundStars = new THREE.Points(backgroundStarsGeometry, backgroundStarsMaterial)
    backgroundStarsRef.current = backgroundStars
    scene.add(backgroundStars)

    const starsGeometry = new THREE.BufferGeometry()
    const starsMaterial = new THREE.PointsMaterial({
      color: config.starColor,
      size: 2,
      transparent: true,
      opacity: 0.6,
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

   

    const particlesGeometry = new THREE.BufferGeometry()
    const particlesMaterial = new THREE.PointsMaterial({
      color: config.particleColor,
      size: 4,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    })

    const particlesVertices = []
    const particleVelocities = []
    for (let i = 0; i < config.particleCount; i++) {
      const x = (Math.random() - 0.5) * 500
      const y = (Math.random() - 0.5) * 500
      const z = (Math.random() - 0.5) * 500
      particlesVertices.push(x, y, z)

      particleVelocities.push((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5)
    }

    particlesGeometry.setAttribute("position", new THREE.Float32BufferAttribute(particlesVertices, 3))
    particlesGeometry.setAttribute("velocity", new THREE.Float32BufferAttribute(particleVelocities, 3))
    const particles = new THREE.Points(particlesGeometry, particlesMaterial)
    particlesRef.current = particles
    scene.add(particles)

    camera.position.z = 100

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)

      const currentAudioData = audioDataRef.current
      const amplitude = currentAudioData?.amplitude || 0
      const frequency = currentAudioData?.frequency || 0
      const beat = currentAudioData?.beat || false

      timeRef.current += 0.01

      if (beat) {
        beatIntensityRef.current = 1
      } else {
        beatIntensityRef.current = Math.max(0, beatIntensityRef.current - 0.05)
      }

      if (backgroundStarsRef.current) {
        backgroundStarsRef.current.rotation.y += 0.0002
        backgroundStarsRef.current.rotation.x += 0.0001
      }

      if (starsRef.current) {
        starsRef.current.rotation.y += 0.0005 + amplitude * 0.002
        starsRef.current.rotation.z += 0.0003
        starsRef.current.material.opacity = 0.5 + amplitude * 0.4 + Math.sin(timeRef.current * 2) * 0.1
      }

      if (orbsRef.current) {
        orbsRef.current.children.forEach((orb, index) => {
          const mesh = orb as THREE.Mesh
          const userData = mesh.userData

          const floatX = Math.sin(timeRef.current * userData.speed + userData.offset) * 30
          const floatY = Math.cos(timeRef.current * userData.speed * 0.7 + userData.offset) * 40
          const floatZ = Math.sin(timeRef.current * userData.speed * 0.5 + userData.offset) * 20

          mesh.position.x = userData.initialX + floatX + amplitude * 20
          mesh.position.y = userData.initialY + floatY + amplitude * 15
          mesh.position.z = userData.initialZ + floatZ

          const baseScale = 1 + Math.sin(timeRef.current * 2 + index) * 0.2
          mesh.scale.setScalar(baseScale + beatIntensityRef.current * 0.4 + amplitude * 0.3)

          const material = mesh.material as THREE.MeshBasicMaterial
          material.opacity = 0.4 + amplitude * 0.4 + beatIntensityRef.current * 0.2

          mesh.rotation.x += 0.005
          mesh.rotation.y += 0.003
        })

        orbsRef.current.rotation.y += 0.0003 + frequency * 0.0001
      }

      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
        const velocities = particlesRef.current.geometry.attributes.velocity.array as Float32Array

        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i] * (1 + amplitude * 2)
          positions[i + 1] += velocities[i + 1] * (1 + amplitude * 2)
          positions[i + 2] += velocities[i + 2] * (1 + amplitude * 2)

          if (Math.abs(positions[i]) > 250) positions[i] *= -0.9
          if (Math.abs(positions[i + 1]) > 250) positions[i + 1] *= -0.9
          if (Math.abs(positions[i + 2]) > 250) positions[i + 2] *= -0.9
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true
        particlesRef.current.rotation.y += 0.001 + frequency * 0.0002
        particlesRef.current.material.opacity = 0.5 + amplitude * 0.4
        particlesRef.current.material.size = 4 + beatIntensityRef.current * 3 + amplitude * 2
      }

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      if (!camera || !renderer) return
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", handleResize)

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
  }, [theme])

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
