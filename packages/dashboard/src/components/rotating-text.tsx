'use client';

import { useEffect, useState } from 'react';

interface RotatingTextProps {
  words: string[];
  className?: string;
  interval?: number;
}

export function RotatingText({ words, className = '', interval = 2500 }: RotatingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
      }, 200); // Half of transition duration
      
    }, interval);

    return () => clearInterval(timer);
  }, [words.length, interval]);

  return (
    <span className={`inline-block transition-all duration-400 ${className}`}>
      <span 
        className={`inline-block transition-all duration-400 ${
          isAnimating 
            ? 'opacity-0 transform -translate-y-2' 
            : 'opacity-100 transform translate-y-0'
        }`}
        key={currentIndex}
      >
        {words[currentIndex]}
      </span>
    </span>
  );
}