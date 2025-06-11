import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRef } from 'react';

import * as tagsLib from '@/core/lib/tags';
import { useTag } from '../useTag';

// Mock the tags library
vi.mock('@/core/lib/tags', () => ({
  registerTag: vi.fn(),
  unregisterTag: vi.fn(),
}));

describe('useTag', () => {
  const mockRegisterTag = vi.mocked(tagsLib.registerTag);
  const mockUnregisterTag = vi.mocked(tagsLib.unregisterTag);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register tag when enabled', () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      useTag('test-tag', ref, true);
      return ref;
    });

    expect(mockRegisterTag).toHaveBeenCalledWith('test-tag', result.current);
  });

  it('should not register tag when disabled', () => {
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      useTag('test-tag', ref, false);
      return ref;
    });

    expect(mockRegisterTag).not.toHaveBeenCalled();
  });

  it('should default to enabled when no enabled parameter provided', () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      useTag('test-tag', ref);
      return ref;
    });

    expect(mockRegisterTag).toHaveBeenCalledWith('test-tag', result.current);
  });

  it('should unregister tag on unmount', () => {
    const { result, unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      useTag('test-tag', ref, true);
      return ref;
    });

    unmount();

    expect(mockUnregisterTag).toHaveBeenCalledWith('test-tag', result.current);
  });

  it('should re-register when tag name changes', () => {
    let tagName = 'initial-tag';

    const { result, rerender } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      useTag(tagName, ref, true);
      return ref;
    });

    expect(mockRegisterTag).toHaveBeenCalledWith('initial-tag', result.current);

    // Change tag name
    tagName = 'new-tag';
    rerender();

    expect(mockUnregisterTag).toHaveBeenCalledWith('initial-tag', result.current);
    expect(mockRegisterTag).toHaveBeenCalledWith('new-tag', result.current);
  });

  it('should handle enabling/disabling dynamically', () => {
    let enabled = false;

    const { result, rerender } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      useTag('test-tag', ref, enabled);
      return ref;
    });

    // Initially disabled, should not register
    expect(mockRegisterTag).not.toHaveBeenCalled();

    // Enable tag
    enabled = true;
    rerender();

    expect(mockRegisterTag).toHaveBeenCalledWith('test-tag', result.current);

    // Disable tag
    mockRegisterTag.mockClear();
    mockUnregisterTag.mockClear();
    enabled = false;
    rerender();

    expect(mockUnregisterTag).toHaveBeenCalledWith('test-tag', result.current);
    expect(mockRegisterTag).not.toHaveBeenCalled();
  });

  it('should work with different ref types', () => {
    const { result: meshRef } = renderHook(() => {
      const ref = useRef<THREE.Mesh>(null);
      useTag('mesh-tag', ref);
      return ref;
    });

    const { result: groupRef } = renderHook(() => {
      const ref = useRef<THREE.Group>(null);
      useTag('group-tag', ref);
      return ref;
    });

    expect(mockRegisterTag).toHaveBeenCalledWith('mesh-tag', meshRef.current);
    expect(mockRegisterTag).toHaveBeenCalledWith('group-tag', groupRef.current);
  });

  it('should handle multiple tags for same ref', () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      useTag('tag1', ref);
      useTag('tag2', ref);
      return ref;
    });

    expect(mockRegisterTag).toHaveBeenCalledWith('tag1', result.current);
    expect(mockRegisterTag).toHaveBeenCalledWith('tag2', result.current);
  });

  it('should handle ref changes', () => {
    const initialRef = { current: null } as React.MutableRefObject<HTMLDivElement | null>;
    const newRef = { current: null } as React.MutableRefObject<HTMLDivElement | null>;

    const { rerender } = renderHook(
      ({ ref }) => {
        useTag('test-tag', ref);
      },
      {
        initialProps: { ref: initialRef },
      },
    );

    expect(mockRegisterTag).toHaveBeenCalledWith('test-tag', initialRef);

    // Change ref
    rerender({ ref: newRef });

    expect(mockUnregisterTag).toHaveBeenCalledWith('test-tag', initialRef);
    expect(mockRegisterTag).toHaveBeenCalledWith('test-tag', newRef);
  });
});
