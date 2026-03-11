"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// global-error.tsx replaces the root layout when it catches,
// so it must include <html> and <body>.
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#0d1117",
          color: "#e6edf3",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            border: "1px solid rgba(244,63,94,0.4)",
            background: "rgba(244,63,94,0.05)",
            padding: "32px",
            maxWidth: "480px",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#f43f5e",
              }}
            />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "11px",
                color: "#8b949e",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Fatal Error
            </span>
          </div>

          <h1
            style={{
              fontFamily: "monospace",
              fontSize: "18px",
              fontWeight: "bold",
              color: "#e6edf3",
              margin: "0 0 8px",
            }}
          >
            karma<span style={{ color: "#f0a500" }}>commits</span> crashed
          </h1>

          {error.message && (
            <pre
              style={{
                fontFamily: "monospace",
                fontSize: "12px",
                color: "#f43f5e",
                background: "#0d1117",
                border: "1px solid #30363d",
                padding: "12px",
                margin: "0 0 24px",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {error.message}
            </pre>
          )}

          <p
            style={{
              fontFamily: "sans-serif",
              fontSize: "14px",
              color: "#8b949e",
              lineHeight: "1.6",
              margin: "0 0 24px",
            }}
          >
            A critical error occurred at the root level. Reloading may resolve
            it.
          </p>

          <button
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#f0a500",
              color: "#0d1117",
              border: "none",
              padding: "10px 24px",
              fontFamily: "monospace",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
