"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Twitter, Linkedin } from "lucide-react";
import PassportCard from "@/components/PassportCard";
import { type KarmaPassport } from "@/lib/types";
import { toPng } from "html-to-image";

interface ScorecardPopupProps {
  isOpen: boolean;
  onClose: () => void;
  passport: KarmaPassport;
  aiScore?: { score: number; grade: string };
}

export default function ScorecardPopup({ isOpen, onClose, passport, aiScore }: ScorecardPopupProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: "#0d1117", // gh-bg
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `${passport.user.login}-scorecard.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate PNG", err);
    } finally {
      setDownloading(false);
    }
  };

  const tweetText = encodeURIComponent(
    `My open-source Karma Score: ${passport.score.total}/1000 via @KarmaCommits — https://karma-commits.vercel.app`
  );

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://karma-commits.vercel.app")}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              className="bg-gh-surface border border-gh-border p-4 sm:p-6 w-full max-w-4xl relative pointer-events-auto shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <button
                onClick={onClose}
                className="absolute -top-3 -right-3 bg-gh-surface border border-gh-border text-gh-muted hover:text-amber p-1.5 rounded-full z-10 transition-colors"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>

              <div className="mb-4 text-center">
                <h3 className="font-mono text-amber font-bold tracking-widest uppercase">
                  Your Full Scorecard
                </h3>
              </div>
              
              {/* Wrapping ref around PassportCard for html-to-image */}
              <div 
                className="overflow-x-auto sm:overflow-visible flex justify-center py-2"
              >
                <div ref={cardRef} className="bg-gh-bg p-2 rounded shrink-0">
                  <PassportCard passport={passport} aiScore={aiScore} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-2 font-mono text-xs px-5 py-2.5 bg-amber text-gh-bg font-bold hover:bg-amber/90 transition-colors disabled:opacity-50"
                >
                  <Download size={14} />
                  {downloading ? "Generating..." : "Download PNG"}
                </button>

                <a
                  href={`https://twitter.com/intent/tweet?text=${tweetText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-mono text-xs px-5 py-2.5 border border-gh-border text-gh-text hover:border-amber/40 hover:text-amber transition-colors"
                >
                  <Twitter size={14} />
                  Post to X
                </a>

                <a
                  href={linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-mono text-xs px-5 py-2.5 border border-[#0077b5]/50 text-gh-text hover:border-[#0077b5] hover:text-[#0077b5] transition-colors"
                >
                  <Linkedin size={14} />
                  LinkedIn
                </a>
              </div>
            </motion.div>
          </div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
