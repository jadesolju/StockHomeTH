import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import ComponentErrorBoundary from './ComponentErrorBoundary';

describe('ComponentErrorBoundary Class Logic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('updates state via getDerivedStateFromError when error is triggered', () => {
    const testError = new Error('Test boundary error');
    const newState = ComponentErrorBoundary.getDerivedStateFromError(testError);

    expect(newState).toEqual({
      hasError: true,
      error: testError,
    });
  });

  it('calls onError prop and logs error in componentDidCatch', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onErrorMock = vi.fn();
    const boundaryInstance = new ComponentErrorBoundary({ children: 'Test Child', onError: onErrorMock });

    const testError = new Error('Runtime error');
    const errorInfo = { componentStack: 'in Component' };

    boundaryInstance.componentDidCatch(testError, errorInfo as any);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[ComponentErrorBoundary] Component Crash Caught:',
      testError,
      errorInfo
    );
    expect(onErrorMock).toHaveBeenCalledWith(testError, errorInfo);

    consoleSpy.mockRestore();
  });

  it('renders fallback ReactNode when state.hasError is true and fallback is provided', () => {
    const customFallback = React.createElement('div', null, 'Custom Fallback UI');
    const boundaryInstance = new ComponentErrorBoundary({
      children: React.createElement('div', null, 'Child UI'),
      fallback: customFallback,
    });

    boundaryInstance.state = {
      hasError: true,
      error: new Error('Render Failed'),
    };

    const rendered = boundaryInstance.render();
    expect(rendered).toBe(customFallback);
  });

  it('renders default error message container when state.hasError is true and no fallback is provided', () => {
    const boundaryInstance = new ComponentErrorBoundary({
      children: React.createElement('div', null, 'Child UI'),
    });

    boundaryInstance.state = {
      hasError: true,
      error: new Error('Something broke'),
    };

    const rendered = boundaryInstance.render() as React.ReactElement;
    expect(rendered).toBeDefined();
    expect(rendered.type).toBe('div');
  });

  it('renders children when state.hasError is false', () => {
    const childElement = React.createElement('span', null, 'Normal Content');
    const boundaryInstance = new ComponentErrorBoundary({
      children: childElement,
    });

    boundaryInstance.state = {
      hasError: false,
      error: null,
    };

    const rendered = boundaryInstance.render();
    expect(rendered).toBe(childElement);
  });
});
