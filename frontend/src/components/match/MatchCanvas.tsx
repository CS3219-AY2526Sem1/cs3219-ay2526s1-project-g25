"use client"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Stars } from "@react-three/drei"
import { useRef } from "react"
import type * as THREE from "three"

function RotatingTorus() {
  const mesh = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.3
      mesh.current.rotation.x += delta * 0.1
    }
  })
  return (
    <mesh ref={mesh} position={[0, 0, 0]} scale={1.2}>
      <torusGeometry args={[2.8, 0.3, 16, 100]} />
      <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.5} />
    </mesh>
  )
}

export default function MatchCanvas() {
  return (
    <div className="absolute inset-0 -z-10 opacity-40">
      <Canvas camera={{ position: [0, 0, 8] }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
        <RotatingTorus />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  )
}

