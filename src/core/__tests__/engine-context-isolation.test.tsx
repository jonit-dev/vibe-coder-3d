/**
 * Tests for EngineProvider isolation and independent loop controls
 * Verifies that multiple engine instances operate independently
 */
import { act, render, renderHook } from '@testing-library/react';
import React from 'react';
import { shallow } from 'zustand/shallow';

import { EngineProvider } from '@core/context/EngineProvider';
import { useGameEngineControls } from '@core/hooks/useGameEngineControls';
import { useLoopStore } from '@core/context/EngineProvider';

// Stable selector to prevent infinite re-renders
const loopStateSelector = (s: any) => ({
  isRunning: s.isRunning,
  isPaused: s.isPaused,
});

// Test component that uses engine controls
const TestComponent = ({
  testId,
  onStateChange,
}: {
  testId: string;
  onStateChange?: (state: any) => void;
}) => {
  const controls = useGameEngineControls();
  const loopStore = useLoopStore();
  const state = loopStore(loopStateSelector, shallow);

  const stateRef = React.useRef(state);
  const onStateChangeRef = React.useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  React.useEffect(() => {
    if (
      stateRef.current.isRunning !== state.isRunning ||
      stateRef.current.isPaused !== state.isPaused
    ) {
      stateRef.current = state;
      onStateChangeRef.current?.(state);
    }
  }, [state.isRunning, state.isPaused]);

  return (
    <div data-testid={testId}>
      <button onClick={controls.startEngine} data-testid={`${testId}-start`}>
        Start
      </button>
      <button onClick={controls.pauseEngine} data-testid={`${testId}-pause`}>
        Pause
      </button>
      <button onClick={controls.stopEngine} data-testid={`${testId}-stop`}>
        Stop
      </button>
      <div data-testid={`${testId}-status`}>
        {state.isRunning ? (state.isPaused ? 'Paused' : 'Running') : 'Stopped'}
      </div>
    </div>
  );
};

describe('EngineProvider Isolation', () => {
  it('should create isolated loop stores for each provider', () => {
    // Test isolation by directly checking store references
    const { result: storeA } = renderHook(() => useLoopStore(), {
      wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
    });

    const { result: storeB } = renderHook(() => useLoopStore(), {
      wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
    });

    // Both stores should be different instances
    expect(storeA.current).not.toBe(storeB.current);

    // Both should start in stopped state
    expect(storeA.current.getState().isRunning).toBe(false);
    expect(storeB.current.getState().isRunning).toBe(false);
    expect(storeA.current.getState().isPaused).toBe(false);
    expect(storeB.current.getState().isPaused).toBe(false);
  });

  it('should maintain independent loop state between providers', () => {
    // Test that engines can have different states
    const { result: storeA } = renderHook(() => useLoopStore(), {
      wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
    });

    const { result: storeB } = renderHook(() => useLoopStore(), {
      wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
    });

    // Both should start stopped
    expect(storeA.current.getState().isRunning).toBe(false);
    expect(storeB.current.getState().isRunning).toBe(false);

    // Start engine A
    act(() => {
      storeA.current.getState().startLoop();
    });

    // Engine A should be running, Engine B should still be stopped
    expect(storeA.current.getState().isRunning).toBe(true);
    expect(storeB.current.getState().isRunning).toBe(false);
  });

  it('should provide independent loop control functions', () => {
    const { result: controlsA } = renderHook(() => useGameEngineControls(), {
      wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
    });

    const { result: controlsB } = renderHook(() => useGameEngineControls(), {
      wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
    });

    // Controls should be different instances
    expect(controlsA.current).not.toBe(controlsB.current);
    expect(controlsA.current.startEngine).not.toBe(controlsB.current.startEngine);
  });

  it('should throw error when useGameEngineControls is used outside provider', () => {
    expect(() => {
      renderHook(() => useGameEngineControls());
    }).toThrow('useEngineContext must be used within an EngineProvider');
  });

  it('should accept and use loop options', () => {
    const { result } = renderHook(() => useLoopStore(), {
      wrapper: ({ children }) => (
        <EngineProvider loopOptions={{ maxFPS: 30, enablePerformanceTracking: true }}>
          {children}
        </EngineProvider>
      ),
    });

    const state = result.current.getState();
    expect(state.maxFPS).toBe(30);
    expect(state.targetFrameTime).toBe(1000 / 30);
  });
});
