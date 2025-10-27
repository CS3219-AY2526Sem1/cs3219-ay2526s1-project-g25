"use client";

import { motion } from "framer-motion";
import React from "react";

interface PeerPrepLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  showTagline?: boolean;
  onClick?: () => void;
}

export default function PeerPrepLogo({
  size = "2xl",
  showTagline = false,
  onClick,
}: PeerPrepLogoProps) {
  const sizeMap: Record<string, string> = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
    "2xl": "text-4xl",
    "3xl": "text-5xl",
  };

  return (
    <div
      className="flex flex-col items-center justify-center select-none"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <motion.div
        className="flex items-center gap-1"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
      >
        {/* Left Bracket */}
        <motion.span
          className="font-mono text-purple-400 font-bold"
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {"<"}
        </motion.span>

        {/* Animated Gradient Text */}
        <motion.span
          className={`font-extrabold bg-gradient-to-r from-purple-400 via-purple-300 to-purple-400 bg-clip-text text-transparent ${sizeMap[size]}`}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ backgroundSize: "200% 200%" }}
        >
          PeerPrep
        </motion.span>

        {/* Right Bracket */}
        <motion.span
          className="font-mono text-purple-400 font-bold"
          animate={{ rotateY: [0, -360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {">"}
        </motion.span>
      </motion.div>

      {/* Tagline (Optional) */}
      {showTagline && (
        <motion.p
          className="text-purple-300 text-sm mt-1 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Practice. Match. Excel.
        </motion.p>
      )}
    </div>
  );
}
