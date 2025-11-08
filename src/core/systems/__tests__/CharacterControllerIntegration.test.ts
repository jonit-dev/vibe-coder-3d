/**
 * Character Controller Integration Tests
 * End-to-end tests for character controller systems working together
 *
 * NOTE: These tests include CharacterControllerAutoInputSystem which is deprecated.
 * The Auto system is kept in tests only for backward compatibility validation.
 * See docs/PRDs/editor/character-controller-gap-closure-prd.md Phase 1.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  updateCharacterControllerSystem,
  cleanupCharacterControllerSystem,
} from '../CharacterControllerSystem';
// NOTE: CharacterControllerAutoInputSystem is deprecated - tests kept for compatibility
import {
  updateCharacterControllerAutoInputSystem,
  cleanupCharacterControllerAutoInputSystem,
} from '../CharacterControllerAutoInputSystem';
import {
  getNormalizedInputMapping,
  readInputState,
  calculateMovementDirection,
  validateEntityPhysics,
  enqueueIntent,
  consumeIntents,
} from '../CharacterControllerHelpers';
import {
  captureGoldenSignals,
  validateGoldenSignals,
  clearSignalHistory,
} from '../CharacterControllerGoldenSignals';
import { componentRegistry } from '../../lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '../../lib/ecs/IComponent';
import type {
  ICharacterControllerData,
  IInputMapping,
} from '../../lib/ecs/components/accessors/types';
import type {
  World,
  KinematicCharacterController,
  Collider,
  RigidBody,
} from '@dimforge/rapier3d-compat';

// Mock dependencies
vi.mock('../../lib/logger', () => ({
  Logger: {
    create: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
}));
vi.mock('../../lib/ecs/ComponentRegistry');
vi.mock('../../physics/character/ColliderRegistry');
vi.mock('../../physics/character/CharacterMotor');
vi.mock('../../physics/character/KinematicBodyController');

describe('Character Controller Integration Tests', () => {
  let mockWorld: World;
  let mockInputManager: any;
  let entityId: number;
  let mockControllerData: ICharacterControllerData;
  let mockCollider: Collider;
  let mockRigidBody: RigidBody;

  beforeEach(() => {
    vi.clearAllMocks();
    clearSignalHistory();

    // Setup mock world
    mockWorld = {
      createCharacterController: vi.fn(),
      removeCharacterController: vi.fn(),
      gravity: { x: 0, y: -9.81, z: 0 },
      createRigidBody: vi.fn(),
      removeRigidBody: vi.fn(),
    } as any;

    // Setup mock input manager
    mockInputManager = {
      isKeyDown: vi.fn(),
    };

    // Setup test entity
    entityId = 1;

    // Setup mock character controller data
    mockControllerData = {
      enabled: true,
      controlMode: 'auto',
      maxSpeed: 6.0,
      jumpStrength: 6.5,
      gravityScale: 1.0,
      slopeLimit: 45.0,
      stepOffset: 0.3,
      skinWidth: 0.08,
      snapMaxSpeed: 5.0,
      maxDepenetrationPerFrame: 0.5,
      pushStrength: 1.0,
      maxPushMass: 0,
      isGrounded: false,
      inputMapping: {
        forward: 'w',
        backward: 's',
        left: 'a',
        right: 'd',
        jump: 'space',
      },
    };

    // Setup mock physics components
    mockCollider = {
      parent: null,
      position: { x: 0, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    } as any;

    mockRigidBody = {
      linvel: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
      setLinvel: vi.fn(),
      applyImpulse: vi.fn(),
    } as any;

    // Mock component registry
    vi.mocked(componentRegistry.getEntitiesWithComponent).mockReturnValue([entityId]);
    vi.mocked(componentRegistry.getComponentData).mockReturnValue(mockControllerData);
    vi.mocked(componentRegistry.updateComponent).mockImplementation(() => {});

    // Mock collider registry
    const { colliderRegistry } = require('../../physics/character/ColliderRegistry');
    colliderRegistry.hasPhysics = vi.fn().mockReturnValue(true);
    colliderRegistry.getColliders = vi.fn().mockReturnValue([mockCollider]);
    colliderRegistry.getRigidBody = vi.fn().mockReturnValue(mockRigidBody);
    colliderRegistry.getRegisteredEntityIds = vi.fn().mockReturnValue([entityId]);
    colliderRegistry.getDiagnostics = vi.fn().mockReturnValue({
      totalRegistrations: 10,
      totalUnregistrations: 5,
      dropouts: 1,
    });
    colliderRegistry.size = vi.fn().mockReturnValue(5);
    colliderRegistry.logHealthReport = vi.fn();

    // Mock Rapier character controller
    const mockRapierController: KinematicCharacterController = {
      computeColliderMovement: vi.fn().mockReturnValue({
        x: 0,
        y: 0,
        z: 0,
      }),
      computedMovement: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
      computedGrounded: vi.fn().mockReturnValue(true),
      setUp: vi.fn(),
      setMaxSlopeClimbAngle: vi.fn(),
      setSlideEnabled: vi.fn(),
      enableSnapToGround: vi.fn(),
      enableAutostep: vi.fn(),
      setApplyImpulsesToDynamicBodies: vi.fn(),
      setCharacterMass: vi.fn(),
    } as any;

    mockWorld.createCharacterController.mockReturnValue(mockRapierController);
  });

  afterEach(() => {
    cleanupCharacterControllerSystem(mockWorld);
    cleanupCharacterControllerAutoInputSystem(mockWorld);
  });

  describe('Complete Character Controller Lifecycle', () => {
    it('should handle full character controller lifecycle', () => {
      // 1. Character controller is created
      expect(componentRegistry.getEntitiesWithComponent).toHaveBeenCalledWith(
        KnownComponentTypes.CHARACTER_CONTROLLER,
      );

      // 2. System processes during play mode
      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);
      expect(componentRegistry.getComponentData).toHaveBeenCalledWith(
        entityId,
        KnownComponentTypes.CHARACTER_CONTROLLER,
      );

      // 3. Auto input system processes movement
      updateCharacterControllerAutoInputSystem(
        mockInputManager,
        true,
        1 / 60,
        mockWorld,
        () => mockCollider,
      );

      // 4. Golden signals validate health
      const isValid = validateGoldenSignals();
      expect(isValid).toBe(true);

      // 5. Cleanup happens when play mode ends
      updateCharacterControllerSystem(mockInputManager, false, 1 / 60, mockWorld);
      updateCharacterControllerAutoInputSystem(mockInputManager, false, 1 / 60, mockWorld);
    });

    it('should handle input mapping normalization across systems', () => {
      // Test with legacy space key
      const legacyControllerData = {
        ...mockControllerData,
        inputMapping: {
          forward: 'W',
          backward: 'S',
          left: 'A',
          right: 'D',
          jump: ' ', // Legacy space key
        },
      };

      vi.mocked(componentRegistry.getComponentData).mockReturnValue(legacyControllerData);

      // Test normalization in helpers
      const normalizedMapping = getNormalizedInputMapping(legacyControllerData);
      expect(normalizedMapping.jump).toBe('space');

      // Test that systems use normalized mapping
      const inputState = readInputState(mockInputManager, normalizedMapping);
      expect(typeof inputState.jump).toBe('boolean');

      // Test movement direction calculation
      const direction = calculateMovementDirection({
        forward: true,
        backward: false,
        left: false,
        right: false,
        jump: false,
      });
      expect(direction).toEqual([0, 1]);
    });

    it('should coordinate between intent queue and systems', () => {
      // Enqueue a move intent
      enqueueIntent({
        entityId,
        type: 'move',
        data: { inputXZ: [1, 0], speed: 6 },
      });

      // Enqueue a jump intent
      enqueueIntent({
        entityId,
        type: 'jump',
        data: { strength: 8 },
      });

      // Consume intents (this would be done by the system)
      const intents = consumeIntents(entityId);
      expect(intents).toHaveLength(2);
      expect(intents[0].type).toBe('move');
      expect(intents[1].type).toBe('jump');

      // Verify queue is empty after consumption
      const emptyIntents = consumeIntents(entityId);
      expect(emptyIntents).toHaveLength(0);
    });
  });

  describe('Physics Integration', () => {
    it('should validate physics registration before processing', () => {
      const isValid = validateEntityPhysics(entityId);
      expect(isValid).toBe(true);

      // Test with missing physics
      const { colliderRegistry } = require('../../physics/character/ColliderRegistry');
      colliderRegistry.hasPhysics = vi.fn().mockReturnValue(false);

      const isInvalid = validateEntityPhysics(entityId);
      expect(isInvalid).toBe(false);
    });

    it('should handle movement with physics collision resolution', () => {
      // Setup input state
      mockInputManager.isKeyDown.mockImplementation((key: string) => {
        if (key === 'w') return true;
        if (key === 'space') return false;
        return false;
      });

      // Mock the character controller to return movement
      const mockRapierController = mockWorld.createCharacterController();
      mockRapierController.computedMovement.mockReturnValue({ x: 0, y: 0, z: 0.1 });

      updateCharacterControllerAutoInputSystem(
        mockInputManager,
        true,
        1 / 60,
        mockWorld,
        () => mockCollider,
      );

      expect(mockRapierController.computeColliderMovement).toHaveBeenCalled();
      expect(componentRegistry.updateComponent).toHaveBeenCalledWith(
        entityId,
        KnownComponentTypes.TRANSFORM,
        expect.objectContaining({
          position: expect.any(Array),
        }),
      );
    });

    it('should handle jump mechanics with ground detection', () => {
      // Setup grounded state
      const mockRapierController = mockWorld.createCharacterController();
      mockRapierController.computedGrounded.mockReturnValue(true);

      mockInputManager.isKeyDown.mockImplementation((key: string) => {
        if (key === 'space') return true;
        return false;
      });

      updateCharacterControllerAutoInputSystem(
        mockInputManager,
        true,
        1 / 60,
        mockWorld,
        () => mockCollider,
      );

      expect(mockRapierController.computeColliderMovement).toHaveBeenCalled();
      expect(componentRegistry.updateComponent).toHaveBeenCalledWith(
        entityId,
        KnownComponentTypes.CHARACTER_CONTROLLER,
        expect.objectContaining({
          isGrounded: true,
        }),
      );
    });

    it('should fall back to simple physics when Rapier controller fails', () => {
      // Make Rapier controller creation fail
      mockWorld.createCharacterController.mockImplementation(() => {
        throw new Error('Failed to create controller');
      });

      updateCharacterControllerAutoInputSystem(
        mockInputManager,
        true,
        1 / 60,
        mockWorld,
        () => mockCollider,
      );

      // Should still update transform with simple physics
      expect(componentRegistry.updateComponent).toHaveBeenCalledWith(
        entityId,
        KnownComponentTypes.TRANSFORM,
        expect.objectContaining({
          position: expect.any(Array),
        }),
      );
    });
  });

  describe('System Coordination', () => {
    it('should handle multiple systems processing the same entity', () => {
      // Both systems should be able to process the same entity without conflict
      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);
      updateCharacterControllerAutoInputSystem(
        mockInputManager,
        true,
        1 / 60,
        mockWorld,
        () => mockCollider,
      );

      // Both should have attempted to process the entity
      expect(componentRegistry.getComponentData).toHaveBeenCalledTimes(2); // Once per system
    });

    it('should respect control mode settings', () => {
      // Test with manual control mode
      const manualControllerData = {
        ...mockControllerData,
        controlMode: 'manual' as const,
      };

      vi.mocked(componentRegistry.getComponentData).mockReturnValue(manualControllerData);

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      // System should skip manual mode entities
      const { readInputState } = require('../CharacterControllerHelpers');
      expect(readInputState).not.toHaveBeenCalled();
    });

    it('should handle disabled controllers gracefully', () => {
      // Test with disabled controller
      const disabledControllerData = {
        ...mockControllerData,
        enabled: false,
      };

      vi.mocked(componentRegistry.getComponentData).mockReturnValue(disabledControllerData);

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);
      updateCharacterControllerAutoInputSystem(
        mockInputManager,
        true,
        1 / 60,
        mockWorld,
        () => mockCollider,
      );

      // Systems should skip disabled entities
      const { readInputState } = require('../CharacterControllerHelpers');
      expect(readInputState).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle exceptions across systems gracefully', () => {
      // Mock component registry to throw error
      vi.mocked(componentRegistry.getComponentData).mockImplementation(() => {
        throw new Error('Component access error');
      });

      expect(() => {
        updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);
      }).not.toThrow();

      expect(() => {
        updateCharacterControllerAutoInputSystem(
          mockInputManager,
          true,
          1 / 60,
          mockWorld,
          () => mockCollider,
        );
      }).not.toThrow();
    });

    it('should continue processing when some systems fail', () => {
      // First system works, second fails
      const workingControllerData = { ...mockControllerData };

      vi.mocked(componentRegistry.getComponentData)
        .mockReturnValueOnce(workingControllerData)
        .mockImplementationOnce(() => {
          throw new Error('Second system error');
        })
        .mockReturnValue(workingControllerData);

      // First system should work
      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      // Second system should handle error gracefully
      expect(() => {
        updateCharacterControllerAutoInputSystem(
          mockInputManager,
          true,
          1 / 60,
          mockWorld,
          () => mockCollider,
        );
      }).not.toThrow();
    });
  });

  describe('Performance and Resource Management', () => {
    it('should properly clean up resources when play mode ends', () => {
      // Run systems to create resources
      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);
      updateCharacterControllerAutoInputSystem(
        mockInputManager,
        true,
        1 / 60,
        mockWorld,
        () => mockCollider,
      );

      // Verify resources were created
      expect(mockWorld.createCharacterController).toHaveBeenCalled();

      // Cleanup
      cleanupCharacterControllerSystem(mockWorld);
      cleanupCharacterControllerAutoInputSystem(mockWorld);

      // Verify cleanup was called
      expect(mockWorld.removeCharacterController).toHaveBeenCalled();
    });

    it('should handle multiple entities efficiently', () => {
      const entityIds = [1, 2, 3, 4, 5];
      vi.mocked(componentRegistry.getEntitiesWithComponent).mockReturnValue(entityIds);

      // Mock different controller data for each entity
      vi.mocked(componentRegistry.getComponentData).mockImplementation((entityId) => ({
        ...mockControllerData,
        maxSpeed: 6.0 + entityId, // Different speed per entity
      }));

      // Process multiple entities
      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      // Should process all entities
      expect(componentRegistry.getComponentData).toHaveBeenCalledTimes(entityIds.length);
    });

    it('should validate golden signals without impacting performance', () => {
      // Create multiple snapshots
      for (let i = 0; i < 10; i++) {
        mockInputManager.isKeyDown.mockReturnValue(false);
        updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);
      }

      // Validate should still work
      const isValid = validateGoldenSignals();
      expect(isValid).toBe(true);

      // Should not impact system processing
      expect(mockWorld.createCharacterController).toHaveBeenCalled();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle typical player movement loop', () => {
      // Simulate player pressing forward key
      mockInputManager.isKeyDown.mockImplementation((key: string) => {
        if (key === 'w') return true;
        return false;
      });

      // Process movement
      updateCharacterControllerAutoInputSystem(
        mockInputManager,
        true,
        1 / 60,
        mockWorld,
        () => mockCollider,
      );

      expect(mockWorld.createCharacterController().computeColliderMovement).toHaveBeenCalled();

      // Simulate releasing key
      mockInputManager.isKeyDown.mockReturnValue(false);

      // Process stop movement
      updateCharacterControllerAutoInputSystem(
        mockInputManager,
        true,
        1 / 60,
        mockWorld,
        () => mockCollider,
      );

      expect(componentRegistry.updateComponent).toHaveBeenCalled();
    });

    it('should handle player jumping while moving', () => {
      // Player moving forward and jumping
      mockInputManager.isKeyDown.mockImplementation((key: string) => {
        if (key === 'w' || key === 'space') return true;
        return false;
      });

      // Mock as grounded to allow jump
      const mockRapierController = mockWorld.createCharacterController();
      mockRapierController.computedGrounded.mockReturnValue(true);

      updateCharacterControllerAutoInputSystem(
        mockInputManager,
        true,
        1 / 60,
        mockWorld,
        () => mockCollider,
      );

      expect(mockRapierController.computeColliderMovement).toHaveBeenCalled();
    });

    it('should handle collision response during movement', () => {
      // Setup collision scenario - movement is blocked
      const mockRapierController = mockWorld.createCharacterController();
      mockRapierController.computedMovement.mockReturnValue({ x: 0, y: 0, z: 0 }); // Movement blocked
      mockRapierController.computedGrounded.mockReturnValue(true);

      mockInputManager.isKeyDown.mockImplementation((key: string) => {
        if (key === 'w') return true;
        return false;
      });

      updateCharacterControllerAutoInputSystem(
        mockInputManager,
        true,
        1 / 60,
        mockWorld,
        () => mockCollider,
      );

      // Should have computed collision-aware movement
      expect(mockRapierController.computeColliderMovement).toHaveBeenCalled();
      expect(componentRegistry.updateComponent).toHaveBeenCalled();
    });

    it('should handle slope climbing within limits', () => {
      // Setup steep slope but within character's limit
      const mockRapierController = mockWorld.createCharacterController();
      mockRapierController.computedMovement.mockReturnValue({ x: 0, y: 0.1, z: 0.05 });
      mockRapierController.computedGrounded.mockReturnValue(true);

      mockInputManager.isKeyDown.mockImplementation((key: string) => {
        if (key === 'w') return true;
        return false;
      });

      updateCharacterControllerAutoInputSystem(
        mockInputManager,
        true,
        1 / 60,
        mockWorld,
        () => mockCollider,
      );

      expect(componentRegistry.updateComponent).toHaveBeenCalledWith(
        entityId,
        KnownComponentTypes.TRANSFORM,
        expect.objectContaining({
          position: expect.arrayContaining([
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
          ]),
        }),
      );
    });
  });
});
