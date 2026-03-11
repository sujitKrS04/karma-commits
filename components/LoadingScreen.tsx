"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

const LOADING_MESSAGES = [
  "Fetching contribution history...",
  "Analyzing 847 pull request reviews...",
  "Calculating mentor score...",
  "Assigning badges...",
  "Building your passport...",
];

interface LoadingScreenProps {
  /** Override the cycling messages with a specific one */
  message?: string;
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (message) return; // static message, no cycling

    const cycle = () => {
      setVisible(false);
      setTimeout(() => {
        setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
        setVisible(true);
      }, 400); // short fade-out gap
    };

    const interval = setInterval(cycle, 2200);
    return () => clearInterval(interval);
  }, [message]);

  const displayMessage = message ?? LOADING_MESSAGES[messageIndex];

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gh-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Amber spinner — top right */}
      <div className="absolute top-6 right-6">
        <Loader2
          size={20}
          className="text-amber animate-spin"
          strokeWidth={2.5}
        />
      </div>

      {/* Logo */}
      <div className="mb-12">
        <span className="font-mono font-bold text-xl text-amber tracking-tight">
          karma<span className="text-gh-text">commits</span>
        </span>
      </div>

      {/* Terminal window */}
      <div className="w-full max-w-lg mx-4">
        {/* Terminal chrome */}
        <div className="flex items-center gap-2 bg-gh-surface border border-gh-border px-4 py-2.5 border-b-0">
          <span className="w-3 h-3 rounded-full bg-rose opacity-70" />
          <span className="w-3 h-3 rounded-full bg-amber opacity-70" />
          <span className="w-3 h-3 rounded-full bg-emerald opacity-70" />
          <span className="ml-3 font-mono text-xs text-gh-muted">
            karma-engine ~ analysis
          </span>
        </div>

        {/* Terminal body */}
        <div className="bg-gh-bg border border-gh-border p-6 min-h-[140px] flex flex-col justify-center">
          {/* Previous messages — shown as faded history */}
          <div className="space-y-1.5 mb-3">
            {LOADING_MESSAGES.slice(0, messageIndex).map((msg, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2 font-mono text-sm text-gh-border"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-emerald flex-shrink-0">✓</span>
                <span>{msg}</span>
              </motion.div>
            ))}
          </div>

          {/* Active message */}
          <AnimatePresence mode="wait">
            {visible && (
              <motion.div
                key={displayMessage}
                className="flex items-center gap-2 font-mono text-sm text-gh-text"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <span className="text-amber flex-shrink-0">›</span>
                <span>{displayMessage}</span>
                {/* Blinking cursor */}
                <motion.span
                  className="inline-block w-2 h-4 bg-amber ml-0.5 flex-shrink-0"
                  animate={{ opacity: [1, 1, 0, 0] }}
                  transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-lg mx-4 mt-0 h-px bg-gh-border relative overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-amber"
          animate={{ width: ["0%", "100%"] }}
          transition={{
            duration: LOADING_MESSAGES.length * 2.2,
            ease: "linear",
            repeat: Infinity,
          }}
        />
      </div>

      {/* Bottom hint */}
      <p className="mt-8 font-mono text-xs text-gh-muted">
        analyzing your open source footprint
      </p>
    </motion.div>
  );
}
