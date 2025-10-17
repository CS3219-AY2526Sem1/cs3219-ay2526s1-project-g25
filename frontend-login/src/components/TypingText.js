import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function TypingText({ text, delay = 0 }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 100 + delay);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, delay]);

  return (
    <span>
      {displayedText}
      {currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{ 
            display: 'inline-block',
            width: '2px',
            height: '1em',
            background: '#667eea',
            marginLeft: '2px'
          }}
        />
      )}
    </span>
  );
}

export default TypingText;



