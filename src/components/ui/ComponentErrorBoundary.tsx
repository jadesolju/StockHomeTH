'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Granular React Error Boundary to isolate interactive component errors
 * and prevent whole-page crashes (white screen).
 */
export class ComponentErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ComponentErrorBoundary] Component Crash Caught:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-sm flex flex-col gap-2 my-2">
          <div className="flex items-center gap-2 font-medium">
            <span>⚠️ เกิดข้อผิดพลาดในการแสดงผลคอมโพเนนต์นี้</span>
          </div>
          <p className="text-xs text-red-400/80">
            {this.state.error?.message || 'Component failed to render properly.'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;
