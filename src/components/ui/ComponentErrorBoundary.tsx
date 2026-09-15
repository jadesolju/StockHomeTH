'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface ComponentErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

export interface ComponentErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ComponentErrorBoundary extends Component<
  ComponentErrorBoundaryProps,
  ComponentErrorBoundaryState
> {
  public override state: ComponentErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ComponentErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(
      `[ComponentErrorBoundary] Crash caught in ${
        this.props.componentName || 'UI Component'
      }:`,
      error,
      errorInfo
    );

    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (err) {
        console.error('[ComponentErrorBoundary] Error in onError handler:', err);
      }
    }
  }

  public resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 my-2 rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md flex flex-col items-center text-center space-y-3">
          <div className="p-2 rounded-full bg-amber-500/20 text-amber-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-amber-600">
              เกิดข้อผิดพลาดในการโหลด {this.props.componentName || 'ส่วนประกอบนี้'}
            </h4>
            <p className="text-xs text-amber-600/80 max-w-sm">
              {this.state.error?.message || 'ระบบไม่สามารถแสดงผลเนื้อหาส่วนนี้ได้ในขณะนี้'}
            </p>
          </div>
          <button
            onClick={this.resetError}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            ลองอีกครั้ง
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;
