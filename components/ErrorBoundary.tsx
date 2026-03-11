"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-gh-bg flex items-center justify-center p-6">
          <div className="border border-rose/40 bg-rose/5 p-8 max-w-lg w-full">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-rose animate-pulse" />
              <span className="font-mono text-xs text-gh-muted tracking-widest uppercase">
                Runtime Error
              </span>
            </div>

            {/* Title */}
            <h2 className="font-mono font-bold text-gh-text text-lg mb-2">
              Something went wrong
            </h2>

            {/* Error message */}
            {this.state.error && (
              <div className="bg-gh-bg border border-gh-border p-4 mb-6 overflow-auto max-h-40">
                <code className="font-mono text-xs text-rose break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <p className="font-sans text-sm text-gh-muted mb-6 leading-relaxed">
              An unexpected error occurred. This has been noted. Try refreshing
              the page — if it persists, check your connection or try again in a
              moment.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="btn-amber text-sm px-6 py-2.5"
              >
                Reload page
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="font-mono text-xs px-6 py-2.5 border border-gh-border text-gh-muted hover:text-gh-text hover:border-gh-text transition-colors"
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
