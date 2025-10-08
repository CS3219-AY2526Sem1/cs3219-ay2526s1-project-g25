"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { motion } from "framer-motion";
import { useRef } from "react";

function RotatingTorus() {
  const mesh = useRef<any>(null);
  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta * 0.5;
  });
  return (
    <motion.mesh ref={mesh} position={[0, 0, 0]} scale={1.2}>
      <torusGeometry args={[2.8, 0.3, 16, 100]} />
      <meshStandardMaterial color="#00FFCA" emissive="#00FFCA" emissiveIntensity={0.4} />
    </motion.mesh>
  );
}

export default function MatchCanvas() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 8] }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} />
        <Stars radius={80} depth={50} count={4000} factor={4} saturation={0} fade />
        <RotatingTorus />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
}
