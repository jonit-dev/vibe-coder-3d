/**
 * Tests for PhysicsEventsAPI.ts
 * Verifies collision and trigger event subscription/dispatch system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createPhysicsEventsAPI,
  dispatchPhysicsEvent,
  cleanupPhysicsEventsAPI,
} from '../PhysicsEventsAPI';

describe('PhysicsEventsAPI', () => {
  const entityId = 1;

  beforeEach(() => {
    // Clean up any existing subscriptions
    cleanupPhysicsEventsAPI(entityId);
  });

  describe('createPhysicsEventsAPI', () => {
    it('should create a physics events API with all methods', () => {
      const api = createPhysicsEventsAPI(entityId);

      expect(api).toHaveProperty('onCollisionEnter');
      expect(api).toHaveProperty('onCollisionExit');
      expect(api).toHaveProperty('onTriggerEnter');
      expect(api).toHaveProperty('onTriggerExit');

      expect(typeof api.onCollisionEnter).toBe('function');
      expect(typeof api.onCollisionExit).toBe('function');
      expect(typeof api.onTriggerEnter).toBe('function');
      expect(typeof api.onTriggerExit).toBe('function');
    });
  });

  describe('onCollisionEnter', () => {
    it('should register collision enter callback', () => {
      const api = createPhysicsEventsAPI(entityId);
      const callback = vi.fn();

      const unsubscribe = api.onCollisionEnter(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should call callback when collision enter event is dispatched', () => {
      const api = createPhysicsEventsAPI(entityId);
      const callback = vi.fn();

      api.onCollisionEnter(callback);
      dispatchPhysicsEvent(entityId, 'collisionEnter', 2);

      expect(callback).toHaveBeenCalledWith(2);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should call multiple callbacks for same event', () => {
      const api = createPhysicsEventsAPI(entityId);
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      api.onCollisionEnter(callback1);
      api.onCollisionEnter(callback2);
      dispatchPhysicsEvent(entityId, 'collisionEnter', 3);

      expect(callback1).toHaveBeenCalledWith(3);
      expect(callback2).toHaveBeenCalledWith(3);
    });

    it('should allow unsubscribing from events', () => {
      const api = createPhysicsEventsAPI(entityId);
      const callback = vi.fn();

      const unsubscribe = api.onCollisionEnter(callback);
      unsubscribe();

      dispatchPhysicsEvent(entityId, 'collisionEnter', 4);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle unsubscribe of one callback while keeping others', () => {
      const api = createPhysicsEventsAPI(entityId);
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = api.onCollisionEnter(callback1);
      api.onCollisionEnter(callback2);

      unsubscribe1();
      dispatchPhysicsEvent(entityId, 'collisionEnter', 5);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith(5);
    });
  });

  describe('onCollisionExit', () => {
    it('should call callback when collision exit event is dispatched', () => {
      const api = createPhysicsEventsAPI(entityId);
      const callback = vi.fn();

      api.onCollisionExit(callback);
      dispatchPhysicsEvent(entityId, 'collisionExit', 6);

      expect(callback).toHaveBeenCalledWith(6);
    });

    it('should not call collision exit when collision enter is dispatched', () => {
      const api = createPhysicsEventsAPI(entityId);
      const exitCallback = vi.fn();

      api.onCollisionExit(exitCallback);
      dispatchPhysicsEvent(entityId, 'collisionEnter', 7);

      expect(exitCallback).not.toHaveBeenCalled();
    });
  });

  describe('onTriggerEnter', () => {
    it('should call callback when trigger enter event is dispatched', () => {
      const api = createPhysicsEventsAPI(entityId);
      const callback = vi.fn();

      api.onTriggerEnter(callback);
      dispatchPhysicsEvent(entityId, 'triggerEnter', 8);

      expect(callback).toHaveBeenCalledWith(8);
    });
  });

  describe('onTriggerExit', () => {
    it('should call callback when trigger exit event is dispatched', () => {
      const api = createPhysicsEventsAPI(entityId);
      const callback = vi.fn();

      api.onTriggerExit(callback);
      dispatchPhysicsEvent(entityId, 'triggerExit', 9);

      expect(callback).toHaveBeenCalledWith(9);
    });
  });

  describe('dispatchPhysicsEvent', () => {
    it('should not throw when dispatching to entity with no subscriptions', () => {
      expect(() => {
        dispatchPhysicsEvent(999, 'collisionEnter', 1);
      }).not.toThrow();
    });

    it('should handle errors in callbacks gracefully', () => {
      const api = createPhysicsEventsAPI(entityId);
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const successCallback = vi.fn();

      api.onCollisionEnter(errorCallback);
      api.onCollisionEnter(successCallback);

      // Should not throw even though first callback errors
      expect(() => {
        dispatchPhysicsEvent(entityId, 'collisionEnter', 10);
      }).not.toThrow();

      // Second callback should still be called
      expect(successCallback).toHaveBeenCalledWith(10);
    });

    it('should dispatch events to correct entity only', () => {
      const entity1Id = 1;
      const entity2Id = 2;

      const api1 = createPhysicsEventsAPI(entity1Id);
      const api2 = createPhysicsEventsAPI(entity2Id);

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      api1.onCollisionEnter(callback1);
      api2.onCollisionEnter(callback2);

      dispatchPhysicsEvent(entity1Id, 'collisionEnter', 999);

      expect(callback1).toHaveBeenCalledWith(999);
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('cleanupPhysicsEventsAPI', () => {
    it('should remove all event subscriptions for an entity', () => {
      const api = createPhysicsEventsAPI(entityId);
      const callback = vi.fn();

      api.onCollisionEnter(callback);
      api.onTriggerEnter(callback);

      cleanupPhysicsEventsAPI(entityId);

      dispatchPhysicsEvent(entityId, 'collisionEnter', 11);
      dispatchPhysicsEvent(entityId, 'triggerEnter', 12);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should not affect other entities', () => {
      const entity1Id = 1;
      const entity2Id = 2;

      const api1 = createPhysicsEventsAPI(entity1Id);
      const api2 = createPhysicsEventsAPI(entity2Id);

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      api1.onCollisionEnter(callback1);
      api2.onCollisionEnter(callback2);

      cleanupPhysicsEventsAPI(entity1Id);

      dispatchPhysicsEvent(entity2Id, 'collisionEnter', 13);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith(13);
    });

    it('should not throw when cleaning up entity with no subscriptions', () => {
      expect(() => {
        cleanupPhysicsEventsAPI(999);
      }).not.toThrow();
    });
  });

  describe('Multiple event types', () => {
    it('should handle subscriptions to multiple event types on same entity', () => {
      const api = createPhysicsEventsAPI(entityId);
      const collisionCallback = vi.fn();
      const triggerCallback = vi.fn();

      api.onCollisionEnter(collisionCallback);
      api.onTriggerEnter(triggerCallback);

      dispatchPhysicsEvent(entityId, 'collisionEnter', 14);
      dispatchPhysicsEvent(entityId, 'triggerEnter', 15);

      expect(collisionCallback).toHaveBeenCalledWith(14);
      expect(collisionCallback).toHaveBeenCalledTimes(1);
      expect(triggerCallback).toHaveBeenCalledWith(15);
      expect(triggerCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle enter and exit events independently', () => {
      const api = createPhysicsEventsAPI(entityId);
      const enterCallback = vi.fn();
      const exitCallback = vi.fn();

      api.onCollisionEnter(enterCallback);
      api.onCollisionExit(exitCallback);

      dispatchPhysicsEvent(entityId, 'collisionEnter', 16);
      expect(enterCallback).toHaveBeenCalledWith(16);
      expect(exitCallback).not.toHaveBeenCalled();

      dispatchPhysicsEvent(entityId, 'collisionExit', 17);
      expect(exitCallback).toHaveBeenCalledWith(17);
      expect(enterCallback).toHaveBeenCalledTimes(1); // Still only called once
    });
  });

  describe('Memory management', () => {
    it('should properly clean up when all callbacks are unsubscribed', () => {
      const api = createPhysicsEventsAPI(entityId);
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsub1 = api.onCollisionEnter(callback1);
      const unsub2 = api.onCollisionEnter(callback2);

      unsub1();
      unsub2();

      // After all unsubscribes, dispatching should not call anything
      dispatchPhysicsEvent(entityId, 'collisionEnter', 18);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should handle double unsubscribe gracefully', () => {
      const api = createPhysicsEventsAPI(entityId);
      const callback = vi.fn();

      const unsubscribe = api.onCollisionEnter(callback);

      unsubscribe();

      // Should not throw on second unsubscribe
      expect(() => {
        unsubscribe();
      }).not.toThrow();
    });
  });
});
