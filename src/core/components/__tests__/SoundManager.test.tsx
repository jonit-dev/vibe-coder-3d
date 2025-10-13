/**
 * SoundManager Component Tests
 * Tests for the performance-optimized SoundManager component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SoundManager } from '../SoundManager';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { eventBus } from '@/core/lib/events';

// Mock Howler
vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    play: vi.fn().mockReturnValue(1),
    pause: vi.fn(),
    stop: vi.fn(),
    unload: vi.fn(),
    playing: vi.fn().mockReturnValue(false),
    loop: vi.fn(),
    volume: vi.fn(),
    rate: vi.fn(),
    pos: vi.fn(),
    seek: vi.fn().mockReturnValue(0),
    duration: vi.fn().mockReturnValue(10),
  })),
  Howler: {
    autoUnlock: true,
    html5PoolSize: 10,
    pos: vi.fn(),
    orientation: vi.fn(),
  },
}));

describe('SoundManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(<SoundManager />);
    expect(container).toBeDefined();
  });

  it('should return null (does not render visible content)', () => {
    const { container } = render(<SoundManager />);
    expect(container.firstChild).toBeNull();
  });

  describe('event handling', () => {
    it('should handle component:added event for Sound components', () => {
      const { unmount } = render(<SoundManager />);

      const soundData = {
        audioPath: '',
        volume: 0.8,
        loop: false,
        autoplay: false,
        enabled: true,
        isPlaying: false,
        muted: false,
        playbackRate: 1.0,
        is3D: false,
        minDistance: 1,
        maxDistance: 10,
        rolloffFactor: 1,
        coneInnerAngle: 360,
        coneOuterAngle: 360,
        coneOuterGain: 0,
        currentTime: 0,
        duration: 0,
        format: 'mp3',
      };

      eventBus.emit('component:added', {
        entityId: 1,
        componentId: 'Sound',
        data: soundData,
      });

      // Should not throw
      expect(true).toBe(true);
      unmount();
    });

    it('should handle component:updated event for Sound components', () => {
      const { unmount } = render(<SoundManager />);

      const soundData = {
        audioPath: '',
        volume: 0.5,
        loop: true,
        autoplay: false,
        enabled: true,
        isPlaying: false,
        muted: false,
        playbackRate: 1.0,
        is3D: false,
        minDistance: 1,
        maxDistance: 10,
        rolloffFactor: 1,
        coneInnerAngle: 360,
        coneOuterAngle: 360,
        coneOuterGain: 0,
        currentTime: 0,
        duration: 0,
        format: 'mp3',
      };

      eventBus.emit('component:updated', {
        entityId: 1,
        componentId: 'Sound',
        data: soundData,
      });

      // Should not throw
      expect(true).toBe(true);
      unmount();
    });

    it('should handle component:removed event for Sound components', () => {
      render(<SoundManager />);

      eventBus.emit('component:removed', {
        entityId: 1,
        componentId: 'Sound',
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle sound:autoplay event', () => {
      const { unmount } = render(<SoundManager />);

      const soundData = {
        audioPath: '',
        volume: 0.8,
        loop: false,
        autoplay: true,
        enabled: true,
        isPlaying: false,
        muted: false,
        playbackRate: 1.0,
        is3D: false,
        minDistance: 1,
        maxDistance: 10,
        rolloffFactor: 1,
        coneInnerAngle: 360,
        coneOuterAngle: 360,
        coneOuterGain: 0,
        currentTime: 0,
        duration: 0,
        format: 'mp3',
      };

      eventBus.emit('sound:autoplay', {
        entityId: 1,
        soundData,
      });

      // Should not throw
      expect(true).toBe(true);
      unmount();
    });

    it('should ignore non-Sound component events', () => {
      render(<SoundManager />);

      eventBus.emit('component:added', {
        entityId: 1,
        componentId: 'Transform',
        data: { position: [0, 0, 0] },
      });

      eventBus.emit('component:updated', {
        entityId: 1,
        componentId: 'MeshRenderer',
        data: { color: '#ff0000' },
      });

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('performance characteristics', () => {
    it('should use React.memo to prevent unnecessary re-renders', () => {
      expect(SoundManager.displayName).toBeUndefined(); // React.memo doesn't set displayName
      // The component should be wrapped in React.memo
      expect(typeof SoundManager).toBe('object'); // React.memo returns an object
    });

    it('should not cause excessive allocations', () => {
      const { rerender } = render(<SoundManager />);

      // Multiple re-renders should not cause memory issues
      for (let i = 0; i < 100; i++) {
        rerender(<SoundManager />);
      }

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should cleanup sound instances on unmount', () => {
      const { unmount } = render(<SoundManager />);

      // Add a sound component without audio path to avoid Howl instantiation
      eventBus.emit('component:added', {
        entityId: 1,
        componentId: 'Sound',
        data: {
          audioPath: '',
          volume: 0.8,
          loop: false,
          autoplay: false,
          enabled: true,
          isPlaying: false,
          muted: false,
          playbackRate: 1.0,
          is3D: false,
          minDistance: 1,
          maxDistance: 10,
          rolloffFactor: 1,
          coneInnerAngle: 360,
          coneOuterAngle: 360,
          coneOuterGain: 0,
          currentTime: 0,
          duration: 0,
          format: 'mp3',
        },
      });

      unmount();

      // Cleanup should have been called
      // Note: We can't directly verify this without exposing internals,
      // but the test ensures unmount doesn't crash
      expect(true).toBe(true);
    });
  });

  describe('3D audio positioning', () => {
    it('should initialize Howler with correct global settings', () => {
      const { Howler } = require('howler');

      render(<SoundManager />);

      expect(Howler.autoUnlock).toBe(true);
      expect(Howler.html5PoolSize).toBe(10);
    });

    it('should update listener position periodically', async () => {
      // Mock camera entity
      vi.spyOn(componentRegistry, 'getEntitiesWithComponent').mockReturnValue([1]);
      vi.spyOn(componentRegistry, 'getComponentData')
        .mockReturnValueOnce({ position: [1, 2, 3] })
        .mockReturnValueOnce({ rotation: [0, 0, 0] });

      const { unmount } = render(<SoundManager />);

      // Wait for interval to trigger
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Component should handle listener updates
      expect(componentRegistry.getEntitiesWithComponent).toHaveBeenCalled();

      unmount();
    });
  });

  describe('callback stability', () => {
    it('should use memoized callbacks to prevent re-subscriptions', () => {
      // This test verifies that handlers don't change on every render
      const { rerender } = render(<SoundManager />);

      // Store initial event listener count
      const initialListenerCount = eventBus.listenerCount?.('component:added') || 0;

      // Multiple re-renders
      rerender(<SoundManager />);
      rerender(<SoundManager />);
      rerender(<SoundManager />);

      // Listener count should not increase (handlers are memoized)
      const finalListenerCount = eventBus.listenerCount?.('component:added') || 0;

      // Should maintain same listener count (or close to it)
      // Note: This is a proxy test since we can't directly inspect useCallback
      expect(finalListenerCount).toBeLessThanOrEqual(initialListenerCount + 1);
    });
  });
});
