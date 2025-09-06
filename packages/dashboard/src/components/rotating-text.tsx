'use client';

import { useEffect, useState } from 'react';

interface RotatingTextProps {
  words: string[];
  className?: string;
  interval?: number;
}

export function RotatingText({ words, className = '', interval = 3000 }: RotatingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[currentIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting) {
      // Typing effect
      if (displayText.length < currentWord.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        }, 80); // Typing speed
      } else {
        // Pause before deleting
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, interval);
      }
    } else {
      // Deleting effect
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 50); // Deleting speed
      } else {
        // Move to next word
        setIsDeleting(false);
        setCurrentIndex((prev) => (prev + 1) % words.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentIndex, words, interval]);

  // Calculate the width needed for the longest word to prevent layout shift
  const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, '');
  
  return (
    <span className={`inline-block ${className}`} style={{ minWidth: `${longestWord.length * 0.6}em` }}>
      <span className="text-primary dark:text-amber-400 font-bold">
        {displayText}
        <span className="animate-pulse text-primary dark:text-amber-400">|</span>
      </span>
    </span>
  );
}