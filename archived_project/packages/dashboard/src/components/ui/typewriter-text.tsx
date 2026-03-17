"use client";
import React, { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const TypewriterText = ({
  words,
  className,
  typeSpeed = 50,
  deleteSpeed = 30,
  pauseDuration = 200,
}: {
  words: string[];
  className?: string;
  typeSpeed?: number; // ms per character when typing
  deleteSpeed?: number; // ms per character when deleting
  pauseDuration?: number; // ms pause between delete and type
}) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentWord = words[currentWordIndex];

  useEffect(() => {
    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }, pauseDuration);
      return () => clearTimeout(pauseTimer);
    }

    const timer = setTimeout(() => {
      if (isDeleting) {
        // Deleting characters
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1));
        } else {
          // Finished deleting, pause before typing next word
          setIsPaused(true);
        }
      } else {
        // Typing characters
        if (currentText.length < currentWord.length) {
          setCurrentText(currentWord.slice(0, currentText.length + 1));
        } else {
          // Finished typing, start deleting after brief pause
          setTimeout(() => setIsDeleting(true), 300);
        }
      }
    }, isDeleting ? deleteSpeed : typeSpeed);

    return () => clearTimeout(timer);
  }, [
    currentText,
    currentWord,
    isDeleting,
    isPaused,
    typeSpeed,
    deleteSpeed,
    pauseDuration,
    words.length,
  ]);

  return (
    <span className={cn("inline-block", className)}>
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  );
};