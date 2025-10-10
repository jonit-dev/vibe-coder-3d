import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { eventBus } from '@/core/lib/events';

import { soundSystem, cleanupSoundSystem } from '../soundSystem';

// Mock dependencies
vi.mock('@/core/lib/ecs/ComponentRegistry');
vi.mock('@/core/lib/events');

describe('Sound System', () => {
  let mockComponentRegistry: typeof componentRegistry;
  let mockEventBus: typeof eventBus;

  beforeEach(() => {
    vi.clearAllMocks();

    mockComponentRegistry = {
      getEntitiesWithComponent: vi.fn(),
      getComponentData: vi.fn(),
    } as any;

    mockEventBus = {
      emit: vi.fn(),
    } as any;

    Object.assign(componentRegistry, mockComponentRegistry);
    Object.assign(eventBus, mockEventBus);

    // Reset system state
    cleanupSoundSystem();
  });

  afterEach(() => {
    cleanupSoundSystem();
  });

  describe('Initialization', () => {
    it('should initialize on first run and query sounds when entering play mode', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([]);

      // First run - not in play mode
      soundSystem(0.016, false);

      // Enter play mode - should query for sounds
      soundSystem(0.016, true);

      expect(mockComponentRegistry.getEntitiesWithComponent).toHaveBeenCalledWith('Sound');
    });

    it('should not process sounds when not in play mode', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([1, 2, 3]);

      const count = soundSystem(0.016, false);

      expect(count).toBe(0);
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });
  });

  describe('Play Mode Detection', () => {
    it('should detect entering play mode', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([]);

      // First call - not playing
      soundSystem(0.016, false);
      expect(mockEventBus.emit).not.toHaveBeenCalled();

      // Second call - entering play mode
      soundSystem(0.016, true);

      // Should query for sound entities when entering play mode
      expect(mockComponentRegistry.getEntitiesWithComponent).toHaveBeenCalled();
    });

    it('should not trigger autoplay when already in play mode', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([1]);
      mockComponentRegistry.getComponentData.mockReturnValue({
        autoplay: true,
        enabled: true,
        isPlaying: false,
      });

      // Enter play mode
      soundSystem(0.016, false);
      soundSystem(0.016, true);

      const firstCallCount = mockEventBus.emit.mock.calls.length;

      // Stay in play mode
      soundSystem(0.016, true);

      // Should not emit more events
      expect(mockEventBus.emit.mock.calls.length).toBe(firstCallCount);
    });

    it('should trigger autoplay again when re-entering play mode', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([1]);
      mockComponentRegistry.getComponentData.mockReturnValue({
        autoplay: true,
        enabled: true,
        isPlaying: false,
      });

      // Enter play mode
      soundSystem(0.016, false);
      soundSystem(0.016, true);
      expect(mockEventBus.emit).toHaveBeenCalledTimes(1);

      // Exit play mode
      soundSystem(0.016, false);

      // Re-enter play mode
      soundSystem(0.016, true);

      // Should trigger autoplay again
      expect(mockEventBus.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('Autoplay Processing', () => {
    it('should emit sound:autoplay for autoplay sounds', () => {
      const soundData = {
        autoplay: true,
        enabled: true,
        isPlaying: false,
        volume: 1.0,
      };

      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([1]);
      mockComponentRegistry.getComponentData.mockReturnValue(soundData);

      // Enter play mode
      soundSystem(0.016, false);
      const count = soundSystem(0.016, true);

      expect(count).toBe(1);
      expect(mockEventBus.emit).toHaveBeenCalledWith('sound:autoplay', {
        entityId: 1,
        soundData,
      });
    });

    it('should process multiple autoplay sounds', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([1, 2, 3]);
      mockComponentRegistry.getComponentData.mockReturnValue({
        autoplay: true,
        enabled: true,
        isPlaying: false,
      });

      soundSystem(0.016, false);
      const count = soundSystem(0.016, true);

      expect(count).toBe(3);
      expect(mockEventBus.emit).toHaveBeenCalledTimes(3);
    });

    it('should not autoplay disabled sounds', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([1]);
      mockComponentRegistry.getComponentData.mockReturnValue({
        autoplay: true,
        enabled: false,
        isPlaying: false,
      });

      soundSystem(0.016, false);
      const count = soundSystem(0.016, true);

      expect(count).toBe(0);
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });

    it('should not autoplay sounds with autoplay disabled', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([1]);
      mockComponentRegistry.getComponentData.mockReturnValue({
        autoplay: false,
        enabled: true,
        isPlaying: false,
      });

      soundSystem(0.016, false);
      const count = soundSystem(0.016, true);

      expect(count).toBe(0);
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });

    it('should not autoplay already playing sounds', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([1]);
      mockComponentRegistry.getComponentData.mockReturnValue({
        autoplay: true,
        enabled: true,
        isPlaying: true,
      });

      soundSystem(0.016, false);
      const count = soundSystem(0.016, true);

      expect(count).toBe(0);
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });

    it('should handle missing sound data gracefully', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([1]);
      mockComponentRegistry.getComponentData.mockReturnValue(null);

      soundSystem(0.016, false);
      const count = soundSystem(0.016, true);

      expect(count).toBe(0);
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });

    it('should handle undefined sound data gracefully', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([1]);
      mockComponentRegistry.getComponentData.mockReturnValue(undefined);

      soundSystem(0.016, false);
      const count = soundSystem(0.016, true);

      expect(count).toBe(0);
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });
  });

  describe('Mixed Sound Scenarios', () => {
    it('should only autoplay eligible sounds from mixed set', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([1, 2, 3, 4]);

      // Mock different sound configurations
      mockComponentRegistry.getComponentData
        .mockReturnValueOnce({ autoplay: true, enabled: true, isPlaying: false }) // 1: should play
        .mockReturnValueOnce({ autoplay: false, enabled: true, isPlaying: false }) // 2: no autoplay
        .mockReturnValueOnce({ autoplay: true, enabled: false, isPlaying: false }) // 3: disabled
        .mockReturnValueOnce({ autoplay: true, enabled: true, isPlaying: true }); // 4: already playing

      soundSystem(0.016, false);
      const count = soundSystem(0.016, true);

      expect(count).toBe(1);
      expect(mockEventBus.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cleanup', () => {
    it('should reset system state on cleanup', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([1]);
      mockComponentRegistry.getComponentData.mockReturnValue({
        autoplay: true,
        enabled: true,
        isPlaying: false,
      });

      // Enter play mode
      soundSystem(0.016, false);
      soundSystem(0.016, true);
      expect(mockEventBus.emit).toHaveBeenCalledTimes(1);

      // Cleanup
      cleanupSoundSystem();

      // Should trigger autoplay again after cleanup
      soundSystem(0.016, false);
      soundSystem(0.016, true);
      expect(mockEventBus.emit).toHaveBeenCalledTimes(2);
    });

    it('should allow re-initialization after cleanup', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([]);

      soundSystem(0.016, true);
      cleanupSoundSystem();
      soundSystem(0.016, false);

      expect(mockComponentRegistry.getEntitiesWithComponent).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty entity list', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([]);

      soundSystem(0.016, false);
      const count = soundSystem(0.016, true);

      expect(count).toBe(0);
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });

    it('should handle undefined isPlaying parameter', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([]);

      const count = soundSystem(0.016);

      expect(count).toBe(0);
    });

    it('should handle very small delta time', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([]);

      const count = soundSystem(0.000001, true);

      expect(count).toBe(0);
    });

    it('should handle very large delta time', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([]);

      const count = soundSystem(10.0, true);

      expect(count).toBe(0);
    });

    it('should handle rapid play mode toggles', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([1]);
      mockComponentRegistry.getComponentData.mockReturnValue({
        autoplay: true,
        enabled: true,
        isPlaying: false,
      });

      soundSystem(0.016, false);
      soundSystem(0.016, true);
      soundSystem(0.016, false);
      soundSystem(0.016, true);
      soundSystem(0.016, false);
      soundSystem(0.016, true);

      // Should trigger autoplay 3 times (each time entering play mode)
      expect(mockEventBus.emit).toHaveBeenCalledTimes(3);
    });
  });

  describe('Performance', () => {
    it('should handle large number of sound entities', () => {
      const entityIds = Array.from({ length: 1000 }, (_, i) => i + 1);
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue(entityIds);
      mockComponentRegistry.getComponentData.mockReturnValue({
        autoplay: true,
        enabled: true,
        isPlaying: false,
      });

      soundSystem(0.016, false);
      const count = soundSystem(0.016, true);

      expect(count).toBe(1000);
      expect(mockEventBus.emit).toHaveBeenCalledTimes(1000);
    });

    it('should not allocate unnecessarily outside play mode', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([1, 2, 3]);

      for (let i = 0; i < 1000; i++) {
        soundSystem(0.016, false);
      }

      // Should not process sounds when not entering play mode
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });
  });
});
