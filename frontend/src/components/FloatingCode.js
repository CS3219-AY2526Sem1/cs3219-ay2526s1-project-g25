import React from 'react';
import { motion } from 'framer-motion';
import './FloatingCode.css';

const codeSnippets = [
  'const solve = (arr) => {...}',
  'function twoSum(nums, target)',
  'class TreeNode {',
  'return dp[n]',
  'while (left < right) {',
  'arr.sort((a, b) => a - b)',
  'if (node === null) return',
  'let result = []',
  'for (let i = 0; i < n; i++)',
  'map.set(key, value)',
  'graph[u].push(v)',
  'queue.enqueue(node)'
];

function FloatingCode() {
  return (
    <div className="floating-code-container">
      {codeSnippets.map((code, index) => (
        <motion.div
          key={index}
          className="code-snippet"
          initial={{ 
            opacity: 0,
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 100
          }}
          animate={{
            opacity: [0, 0.6, 0.6, 0],
            x: Math.random() * window.innerWidth,
            y: -100,
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            delay: index * 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <span className="code-text">{code}</span>
        </motion.div>
      ))}
    </div>
  );
}

export default FloatingCode;

