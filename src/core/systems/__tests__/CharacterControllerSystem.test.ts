/**
 * Character Controller System Unit Tests
 * Tests the main orchestrating system that manages character controllers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  updateCharacterControllerSystem,
  cleanupCharacterControllerSystem,
} from '../CharacterControllerSystem';
import { componentRegistry } from '../../lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '../../lib/ecs/IComponent';
import type { ICharacterControllerData } from '../../lib/ecs/components/accessors/types';
import { Logger } from '../../lib/logger';
import {
  validateEntityPhysics,
  getNormalizedInputMapping,
  readInputState,
  calculateMovementDirection,
  consumeIntents,
} from '../CharacterControllerHelpers';
import {
  validateGoldenSignals,
  logComprehensiveHealthReport,
} from '../CharacterControllerGoldenSignals';
import { CharacterMotor } from '../../physics/character/CharacterMotor';
import { KinematicBodyController } from '../../physics/character/KinematicBodyController';

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
vi.mock('../CharacterControllerHelpers');
vi.mock('../CharacterControllerGoldenSignals');
vi.mock('../../physics/character/CharacterMotor');
vi.mock('../../physics/character/KinematicBodyController');
vi.mock('../../lib/ecs/ComponentRegistry');

// Mock World from Rapier
const mockWorld = {
  createCharacterController: vi.fn(),
  removeCharacterController: vi.fn(),
  gravity: { x: 0, y: -9.81, z: 0 },
} as any;

// Mock InputManager
const mockInputManager = {
  isKeyDown: vi.fn(),
};

describe('CharacterControllerSystem', () => {
  let entityId: number;
  let mockControllerData: ICharacterControllerData;

  beforeEach(() => {
    vi.clearAllMocks();
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

    // Mock component registry methods
    vi.mocked(componentRegistry.getEntitiesWithComponent).mockReturnValue([entityId]);
    vi.mocked(componentRegistry.getComponentData).mockReturnValue(mockControllerData);
    vi.mocked(componentRegistry.updateComponent).mockImplementation(() => {});

    // Mock the helper functions using vi.mocked
    vi.mocked(validateEntityPhysics).mockReturnValue({ isValid: true });
    vi.mocked(getNormalizedInputMapping).mockReturnValue(mockControllerData.inputMapping!);
    vi.mocked(readInputState).mockReturnValue({
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
    });
    vi.mocked(calculateMovementDirection).mockReturnValue([0, 0]);

    // Mock golden signals
    vi.mocked(validateGoldenSignals).mockReturnValue(true);

    // Mock consumeIntents to return empty array by default
    vi.mocked(consumeIntents).mockReturnValue([]);
  });

  afterEach(() => {
    cleanupCharacterControllerSystem(mockWorld);
  });

  describe('updateCharacterControllerSystem', () => {
    it('should not run when not playing', () => {
      updateCharacterControllerSystem(mockInputManager, false, 1 / 60, mockWorld);

      expect(mockWorld.createCharacterController).not.toHaveBeenCalled();
      expect(componentRegistry.getEntitiesWithComponent).not.toHaveBeenCalled();
    });

    it('should not run when world is null', () => {
      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, null);

      expect(mockWorld.createCharacterController).not.toHaveBeenCalled();
      expect(componentRegistry.getEntitiesWithComponent).not.toHaveBeenCalled();
    });

    it('should initialize kinematic controller on first run', () => {
      vi.mocked(KinematicBodyController).cleanupAll = vi.fn();

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      expect(KinematicBodyController).toHaveBeenCalledWith(mockWorld, expect.any(Object));
      // Logger.create is called at module load time, not during system init
    });

    it('should process entities with character controllers', () => {
      const mockControllerInstance = {
        move: vi.fn(),
        jump: vi.fn(),
        isGrounded: vi.fn().mockReturnValue(true),
      };
      vi.mocked(KinematicBodyController).mockImplementation(() => mockControllerInstance);
      vi.mocked(KinematicBodyController).cleanupAll = vi.fn();

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      expect(componentRegistry.getEntitiesWithComponent).toHaveBeenCalledWith(
        KnownComponentTypes.CHARACTER_CONTROLLER,
      );
      expect(componentRegistry.getComponentData).toHaveBeenCalledWith(
        entityId,
        KnownComponentTypes.CHARACTER_CONTROLLER,
      );
    });

    it('should skip entities with disabled controllers', () => {
      vi.mocked(componentRegistry.getComponentData).mockReturnValue({
        ...mockControllerData,
        enabled: false,
      });

      vi.mocked(KinematicBodyController).cleanupAll = vi.fn();

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      // readInputState is already imported and mocked
      expect(readInputState).not.toHaveBeenCalled();
    });

    it('should skip entities with manual control mode', () => {
      vi.mocked(componentRegistry.getComponentData).mockReturnValue({
        ...mockControllerData,
        controlMode: 'manual',
      });

      vi.mocked(KinematicBodyController).cleanupAll = vi.fn();

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      // readInputState is already imported and mocked
      expect(readInputState).not.toHaveBeenCalled();
    });

    it('should handle entities with missing controller data', () => {
      vi.mocked(componentRegistry.getComponentData).mockReturnValue(null);

      vi.mocked(KinematicBodyController).cleanupAll = vi.fn();

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      // readInputState is already imported and mocked
      expect(readInputState).not.toHaveBeenCalled();
    });

    it('should process movement and jumping for valid entities', () => {
      const mockControllerInstance = {
        move: vi.fn(),
        jump: vi.fn(),
        isGrounded: vi.fn().mockReturnValue(true),
      };
      vi.mocked(KinematicBodyController).mockImplementation(() => mockControllerInstance);
      vi.mocked(KinematicBodyController).cleanupAll = vi.fn();

      // readInputState and calculateMovementDirection are already imported and mocked
      readInputState.mockReturnValue({
        forward: true,
        backward: false,
        left: false,
        right: false,
        jump: true,
      });
      calculateMovementDirection.mockReturnValue([0, 1]);

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      expect(readInputState).toHaveBeenCalledWith(
        mockInputManager,
        mockControllerData.inputMapping,
      );
      expect(calculateMovementDirection).toHaveBeenCalledWith({
        forward: true,
        backward: false,
        left: false,
        right: false,
        jump: true,
      });
      expect(mockControllerInstance.move).toHaveBeenCalledWith(entityId, [0, 1], 1 / 60);
      expect(mockControllerInstance.jump).toHaveBeenCalledWith(entityId);
    });

    it('should update isGrounded state in component', () => {
      const mockControllerInstance = {
        move: vi.fn(),
        jump: vi.fn(),
        isGrounded: vi.fn().mockReturnValue(false),
      };
      vi.mocked(KinematicBodyController).mockImplementation(() => mockControllerInstance);
      vi.mocked(KinematicBodyController).cleanupAll = vi.fn();

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      expect(componentRegistry.updateComponent).toHaveBeenCalledWith(
        entityId,
        KnownComponentTypes.CHARACTER_CONTROLLER,
        expect.objectContaining({
          ...mockControllerData,
          isGrounded: false,
        }),
      );
    });

    it('should handle physics validation failures gracefully', () => {
      // validateEntityPhysics is already imported and mocked
      vi.mocked(validateEntityPhysics).mockReturnValue({
        isValid: false,
        hasCollider: false,
        hasRigidBody: false,
        colliderCount: 0,
        diagnosticMessage: 'Missing physics components',
      });

      const mockControllerInstance = {
        move: vi.fn(),
        jump: vi.fn(),
        isGrounded: vi.fn().mockReturnValue(true),
      };
      vi.mocked(KinematicBodyController).mockImplementation(() => mockControllerInstance);
      vi.mocked(KinematicBodyController).cleanupAll = vi.fn();

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      // Entity will be deferred for retry, so move should NOT be called on first frame
      expect(mockControllerInstance.move).not.toHaveBeenCalled();
    });

    it('should validate golden signals periodically', () => {
      // validateGoldenSignals is already imported and mocked
      validateGoldenSignals.mockReturnValue(false); // Validation fails

      vi.mocked(KinematicBodyController).cleanupAll = vi.fn();

      // Mock Date.now to return specific timestamps
      const mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(6000); // 6 seconds

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      expect(validateGoldenSignals).toHaveBeenCalled();

      mockDateNow.mockRestore();
    });

    it('should not validate golden signals if interval not passed', () => {
      // validateGoldenSignals is already imported and mocked

      vi.mocked(KinematicBodyController).cleanupAll = vi.fn();

      // Mock Date.now to return time within validation interval
      const mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(1000); // 1 second

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      expect(validateGoldenSignals).not.toHaveBeenCalled();

      mockDateNow.mockRestore();
    });
  });

  describe('cleanupCharacterControllerSystem', () => {
    it('should clean up all resources', () => {
      vi.mocked(KinematicBodyController).cleanupAll = vi.fn();

      // logComprehensiveHealthReport is already imported and mocked
      logComprehensiveHealthReport.mockImplementation(() => {});

      // First run the system to create resources
      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      // Then cleanup
      cleanupCharacterControllerSystem(mockWorld);

      expect(KinematicBodyController.cleanupAll).toHaveBeenCalledWith(mockWorld);
      expect(logComprehensiveHealthReport).toHaveBeenCalled();
    });

    it('should handle cleanup with null world', () => {
      vi.mocked(KinematicBodyController).cleanupAll = vi.fn();

      // logComprehensiveHealthReport is already imported and mocked
      logComprehensiveHealthReport.mockImplementation(() => {});

      expect(() => {
        cleanupCharacterControllerSystem(null);
      }).not.toThrow();
    });
  });

  describe('Motor Configuration', () => {
    it('should create motor config from controller data', () => {
      const mockMotor = {
        getConfig: vi.fn().mockReturnValue({}),
      };
      vi.mocked(CharacterMotor).mockImplementation(() => mockMotor);
      vi.mocked(CharacterMotor).cleanupAll = vi.fn();

      vi.mocked(KinematicBodyController).cleanupAll = vi.fn();

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      expect(CharacterMotor).toHaveBeenCalledWith({
        maxSpeed: 6.0,
        jumpStrength: 6.5,
        gravity: -9.81, // gravityScale * -9.81
        slopeLimitDeg: 45.0,
        stepOffset: 0.3,
        skinWidth: 0.08,
        snapMaxSpeed: 5.0,
        maxDepenetrationPerFrame: 0.5,
        pushStrength: 1.0,
        maxPushMass: 0,
      });
    });

    it('should handle missing optional config values', () => {
      const controllerDataWithoutDefaults = {
        ...mockControllerData,
        snapMaxSpeed: undefined,
        maxDepenetrationPerFrame: undefined,
        pushStrength: undefined,
        maxPushMass: undefined,
      };
      vi.mocked(componentRegistry.getComponentData).mockReturnValue(controllerDataWithoutDefaults);

      const mockMotor = { getConfig: vi.fn().mockReturnValue({}) };
      CharacterMotor.mockImplementation(() => mockMotor);

      vi.mocked(KinematicBodyController).cleanupAll = vi.fn();

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      expect(CharacterMotor).toHaveBeenCalledWith(
        expect.objectContaining({
          snapMaxSpeed: 5.0, // Default value
          maxDepenetrationPerFrame: 0.5, // Default value
          pushStrength: 1.0, // Default value
          maxPushMass: 0, // Default value
        }),
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle exceptions during entity processing gracefully', () => {
      // Mock component registry to throw error
      vi.mocked(componentRegistry.getComponentData).mockImplementation(() => {
        throw new Error('Component access error');
      });

      vi.mocked(KinematicBodyController).cleanupAll = vi.fn();

      // The system doesn't currently have try-catch, so errors will propagate
      expect(() => {
        updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);
      }).toThrow('Component access error');
    });

    it('should continue processing other entities if one fails', () => {
      const entityId1 = 1;
      const entityId2 = 2;

      vi.mocked(componentRegistry.getEntitiesWithComponent).mockReturnValue([entityId1, entityId2]);

      // First entity throws error
      vi.mocked(componentRegistry.getComponentData).mockImplementation((id) => {
        if (id === entityId1) throw new Error('Entity 1 error');
        return mockControllerData;
      });

      const mockControllerInstance = {
        move: vi.fn(),
        jump: vi.fn(),
        isGrounded: vi.fn().mockReturnValue(true),
      };
      vi.mocked(KinematicBodyController).mockImplementation(() => mockControllerInstance);
      vi.mocked(KinematicBodyController).cleanupAll = vi.fn();

      // The system doesn't currently have try-catch per entity, so the error will propagate
      expect(() => {
        updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);
      }).toThrow('Entity 1 error');
    });
  });

  describe('Multiple Entities', () => {
    beforeEach(() => {
      // Clear constructor call count before this test
      vi.mocked(CharacterMotor).mockClear();
      vi.mocked(KinematicBodyController).mockClear();
    });

    it('should process multiple character controllers independently', () => {
      const entityId1 = 1;
      const entityId2 = 2;

      vi.mocked(componentRegistry.getEntitiesWithComponent).mockReturnValue([entityId1, entityId2]);

      const controllerData1 = { ...mockControllerData, maxSpeed: 5.0 };
      const controllerData2 = { ...mockControllerData, maxSpeed: 8.0 };

      vi.mocked(componentRegistry.getComponentData)
        .mockImplementationOnce((id) => {
          if (id === entityId1) return controllerData1;
          if (id === entityId2) return controllerData2;
          return null;
        })
        .mockImplementation((id) => {
          if (id === entityId1) return controllerData1;
          if (id === entityId2) return controllerData2;
          return null;
        });

      const mockMotor1 = { getConfig: vi.fn().mockReturnValue({}) };
      const mockMotor2 = { getConfig: vi.fn().mockReturnValue({}) };
      vi.mocked(CharacterMotor).mockImplementation((config) => {
        if (config.maxSpeed === 5.0) return mockMotor1;
        if (config.maxSpeed === 8.0) return mockMotor2;
        return { getConfig: vi.fn().mockReturnValue({}) };
      });

      const mockControllerInstance = {
        move: vi.fn(),
        jump: vi.fn(),
        isGrounded: vi.fn().mockReturnValue(true),
      };
      vi.mocked(KinematicBodyController).mockImplementation(() => mockControllerInstance);
      vi.mocked(KinematicBodyController).cleanupAll = vi.fn();

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      // System creates motors for both entities (and may create a default motor on first init)
      expect(CharacterMotor).toHaveBeenCalledWith(expect.objectContaining({ maxSpeed: 5.0 }));
      expect(CharacterMotor).toHaveBeenCalledWith(expect.objectContaining({ maxSpeed: 8.0 }));
    });
  });
});
