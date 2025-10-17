"use client"
import { useEffect, useRef } from "react"

export default function CodeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Code snippets to display
    const codeLines = [
      "const match = await findPeer();",
      "function solve(arr) {",
      "  return arr.sort();",
      "}",
      "if (difficulty === 'hard') {",
      "  challenge.accept();",
      "}",
      "class Solution {",
      "  public int[] twoSum() {",
      "    // your code here",
      "  }",
      "}",
      "for (let i = 0; i < n; i++) {",
      "  process(data[i]);",
      "}",
      "async function match() {",
      "  await queue.join();",
      "}",
    ]

    interface CodeParticle {
      x: number
      y: number
      text: string
      speed: number
      opacity: number
      fontSize: number
    }

    const particles: CodeParticle[] = []

    // Create particles
    for (let i = 0; i < 25; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        text: codeLines[Math.floor(Math.random() * codeLines.length)],
        speed: 0.2 + Math.random() * 0.5,
        opacity: 0.1 + Math.random() * 0.15,
        fontSize: 12 + Math.random() * 6,
      })
    }

    // Animation loop
    const animate = () => {
      ctx.fillStyle = "rgba(15, 23, 42, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        ctx.font = `${particle.fontSize}px 'Geist Mono', monospace`
        ctx.fillStyle = `rgba(168, 85, 247, ${particle.opacity})`
        ctx.fillText(particle.text, particle.x, particle.y)

        particle.y += particle.speed

        // Reset particle when it goes off screen
        if (particle.y > canvas.height + 20) {
          particle.y = -20
          particle.x = Math.random() * canvas.width
          particle.text = codeLines[Math.floor(Math.random() * codeLines.length)]
        }
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 bg-slate-950"
      style={{ background: "linear-gradient(to bottom, #0f172a, #1e1b4b)" }}
    />
  )
}