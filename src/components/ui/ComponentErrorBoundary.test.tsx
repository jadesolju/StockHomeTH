import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { ComponentErrorBoundary } from './ComponentErrorBoundary';

describe('ComponentErrorBoundary Unit Tests', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should update state via getDerivedStateFromError when an error occurs', () => {
    const error = new Error('Test Component Crash');
    const newState = ComponentErrorBoundary.getDerivedStateFromError(error);

    expect(newState).toEqual({
      hasError: true,
      error,
    });
  });

  it('should invoke onError prop and log error inside componentDidCatch', () => {
    const onErrorMock = vi.fn();
    const boundary = new ComponentErrorBoundary({
      children: 'Content',
      onError: onErrorMock,
      componentName: 'MarketCard',
    });

    const testError = new Error('Render Failed');
    const testErrorInfo = { componentStack: 'in MarketCard' };

    boundary.componentDidCatch(testError, testErrorInfo as any);

    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock).toHaveBeenCalledWith(testError, testErrorInfo);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[ComponentErrorBoundary] Crash caught in MarketCard:',
      testError,
      testErrorInfo
    );
  });

  it('should render children when state.hasError is false', () => {
    const boundary = new ComponentErrorBoundary({
      children: <div data-testid="children">Normal Component Content</div>,
    });

    boundary.state = { hasError: false, error: null };
    const rendered = boundary.render();

    expect(rendered).toEqual(<div data-testid="children">Normal Component Content</div>);
  });

  it('should render custom fallback prop when state.hasError is true and fallback is provided', () => {
    const customFallback = <div data-testid="custom-fallback">Custom Offline Message</div>;
    const boundary = new ComponentErrorBoundary({
      children: 'Normal Component Content',
      fallback: customFallback,
    });

    boundary.state = { hasError: true, error: new Error('Simulated Crash') };
    const rendered = boundary.render();

    expect(rendered).toBe(customFallback);
  });

  it('should reset error state when resetError is called', () => {
    const boundary = new ComponentErrorBoundary({
      children: 'Content',
    });

    boundary.state = { hasError: true, error: new Error('Failed') };
    expect(boundary.state.hasError).toBe(true);

    const setStateSpy = vi.spyOn(boundary, 'setState').mockImplementation((newState: any) => {
      Object.assign(boundary.state, newState);
    });

    boundary.resetError();

    expect(setStateSpy).toHaveBeenCalledWith({
      hasError: false,
      error: null,
    });
    expect(boundary.state.hasError).toBe(false);
  });
});
