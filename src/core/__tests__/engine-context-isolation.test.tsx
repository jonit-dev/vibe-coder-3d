/**
 * Tests for EngineProvider isolation and independent loop controls
 * Verifies that multiple engine instances operate independently
 */
import { act, renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { EngineProvider, useLoopStore } from '@core/context/EngineProvider';
import { useGameEngineControls } from '@core/hooks/useGameEngineControls';

describe('EngineProvider Isolation', () => {
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
});
