import React from "react";
import { motion } from "framer-motion";
import "./PeerPrepLogo.css";

export default function PeerPrepLogo({ size = "2xl", showTagline = false }) {
  return (
    <div className="peerprep-logo">
      <motion.div
        className="logo"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <motion.span
          className="logo-bracket"
          animate={{ rotateY: [0, 360] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {"<"}
        </motion.span>

        <motion.span
          className={`logo-text text-${size}`}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          PeerPrep
        </motion.span>

        <motion.span
          className="logo-bracket"
          animate={{ rotateY: [0, -360] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {">"}
        </motion.span>
      </motion.div>

      {showTagline && (
        <p className="tagline">Practice. Match. Excel.</p>
      )}
    </div>
  );
}
