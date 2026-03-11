"use client";

import { useEffect } from "react";

/** CSS-driven amber dot cursor that scales on interactive elements */
export default function CustomCursor() {
  useEffect(() => {
    const cursor = document.getElementById("custom-cursor");
    if (!cursor) return;

    const HOVER_SELECTORS =
      "a, button, [role='button'], input, label, select, textarea, [tabindex]";

    const onMove = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };

    const onEnter = (e: MouseEvent) => {
      if ((e.target as Element)?.closest(HOVER_SELECTORS)) {
        cursor.classList.add("cursor-hover");
      }
    };

    const onLeave = (e: MouseEvent) => {
      if ((e.target as Element)?.closest(HOVER_SELECTORS)) {
        cursor.classList.remove("cursor-hover");
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onEnter, { passive: true });
    document.addEventListener("mouseout", onLeave, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onEnter);
      document.removeEventListener("mouseout", onLeave);
    };
  }, []);

  return <div id="custom-cursor" aria-hidden="true" />;
}
