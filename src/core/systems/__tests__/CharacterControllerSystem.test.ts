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

    // Mock the helper functions
    const {
      validateEntityPhysics,
      getNormalizedInputMapping,
      readInputState,
      calculateMovementDirection,
    } = require('../CharacterControllerHelpers');

    validateEntityPhysics.mockReturnValue({ isValid: true });
    getNormalizedInputMapping.mockReturnValue(mockControllerData.inputMapping!);
    readInputState.mockReturnValue({
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
    });
    calculateMovementDirection.mockReturnValue([0, 0]);

    // Mock golden signals
    const { validateGoldenSignals } = require('../CharacterControllerGoldenSignals');
    validateGoldenSignals.mockReturnValue(true);
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
      const {
        KinematicBodyController,
      } = require('../../physics/character/KinematicBodyController');
      KinematicBodyController.cleanupAll = vi.fn();

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      expect(KinematicBodyController).toHaveBeenCalledWith(mockWorld, expect.any(Object));
      expect(Logger.create).toHaveBeenCalledWith('CharacterControllerSystem');
    });

    it('should process entities with character controllers', () => {
      const {
        KinematicBodyController,
      } = require('../../physics/character/KinematicBodyController');
      const mockControllerInstance = {
        move: vi.fn(),
        jump: vi.fn(),
        isGrounded: vi.fn().mockReturnValue(true),
      };
      KinematicBodyController.mockImplementation(() => mockControllerInstance);
      KinematicBodyController.cleanupAll = vi.fn();

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

      const {
        KinematicBodyController,
      } = require('../../physics/character/KinematicBodyController');
      KinematicBodyController.cleanupAll = vi.fn();

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      const { readInputState } = require('../CharacterControllerHelpers');
      expect(readInputState).not.toHaveBeenCalled();
    });

    it('should skip entities with manual control mode', () => {
      vi.mocked(componentRegistry.getComponentData).mockReturnValue({
        ...mockControllerData,
        controlMode: 'manual',
      });

      const {
        KinematicBodyController,
      } = require('../../physics/character/KinematicBodyController');
      KinematicBodyController.cleanupAll = vi.fn();

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      const { readInputState } = require('../CharacterControllerHelpers');
      expect(readInputState).not.toHaveBeenCalled();
    });

    it('should handle entities with missing controller data', () => {
      vi.mocked(componentRegistry.getComponentData).mockReturnValue(null);

      const {
        KinematicBodyController,
      } = require('../../physics/character/KinematicBodyController');
      KinematicBodyController.cleanupAll = vi.fn();

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      const { readInputState } = require('../CharacterControllerHelpers');
      expect(readInputState).not.toHaveBeenCalled();
    });

    it('should process movement and jumping for valid entities', () => {
      const {
        KinematicBodyController,
      } = require('../../physics/character/KinematicBodyController');
      const mockControllerInstance = {
        move: vi.fn(),
        jump: vi.fn(),
        isGrounded: vi.fn().mockReturnValue(true),
      };
      KinematicBodyController.mockImplementation(() => mockControllerInstance);
      KinematicBodyController.cleanupAll = vi.fn();

      const {
        readInputState,
        calculateMovementDirection,
      } = require('../CharacterControllerHelpers');
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
      const {
        KinematicBodyController,
      } = require('../../physics/character/KinematicBodyController');
      const mockControllerInstance = {
        move: vi.fn(),
        jump: vi.fn(),
        isGrounded: vi.fn().mockReturnValue(false),
      };
      KinematicBodyController.mockImplementation(() => mockControllerInstance);
      KinematicBodyController.cleanupAll = vi.fn();

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
      const { validateEntityPhysics } = require('../CharacterControllerHelpers');
      validateEntityPhysics.mockReturnValue({
        isValid: false,
        hasCollider: false,
        hasRigidBody: false,
        colliderCount: 0,
        diagnosticMessage: 'Missing physics components',
      });

      const {
        KinematicBodyController,
      } = require('../../physics/character/KinematicBodyController');
      const mockControllerInstance = {
        move: vi.fn(),
        jump: vi.fn(),
        isGrounded: vi.fn().mockReturnValue(true),
      };
      KinematicBodyController.mockImplementation(() => mockControllerInstance);
      KinematicBodyController.cleanupAll = vi.fn();

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      // Should still attempt to move the controller
      expect(mockControllerInstance.move).toHaveBeenCalled();
    });

    it('should validate golden signals periodically', () => {
      const { validateGoldenSignals } = require('../CharacterControllerGoldenSignals');
      validateGoldenSignals.mockReturnValue(false); // Validation fails

      const {
        KinematicBodyController,
      } = require('../../physics/character/KinematicBodyController');
      KinematicBodyController.cleanupAll = vi.fn();

      // Mock Date.now to return specific timestamps
      const mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(6000); // 6 seconds

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      expect(validateGoldenSignals).toHaveBeenCalled();

      mockDateNow.mockRestore();
    });

    it('should not validate golden signals if interval not passed', () => {
      const { validateGoldenSignals } = require('../CharacterControllerGoldenSignals');

      const {
        KinematicBodyController,
      } = require('../../physics/character/KinematicBodyController');
      KinematicBodyController.cleanupAll = vi.fn();

      // Mock Date.now to return time within validation interval
      const mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(1000); // 1 second

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      expect(validateGoldenSignals).not.toHaveBeenCalled();

      mockDateNow.mockRestore();
    });
  });

  describe('cleanupCharacterControllerSystem', () => {
    it('should clean up all resources', () => {
      const {
        KinematicBodyController,
      } = require('../../physics/character/KinematicBodyController');
      KinematicBodyController.cleanupAll = vi.fn();

      const { logComprehensiveHealthReport } = require('../CharacterControllerGoldenSignals');
      logComprehensiveHealthReport.mockImplementation(() => {});

      // First run the system to create resources
      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      // Then cleanup
      cleanupCharacterControllerSystem(mockWorld);

      expect(KinematicBodyController.cleanupAll).toHaveBeenCalledWith(mockWorld);
      expect(logComprehensiveHealthReport).toHaveBeenCalled();
    });

    it('should handle cleanup with null world', () => {
      const {
        KinematicBodyController,
      } = require('../../physics/character/KinematicBodyController');
      KinematicBodyController.cleanupAll = vi.fn();

      const { logComprehensiveHealthReport } = require('../CharacterControllerGoldenSignals');
      logComprehensiveHealthReport.mockImplementation(() => {});

      expect(() => {
        cleanupCharacterControllerSystem(null);
      }).not.toThrow();
    });
  });

  describe('Motor Configuration', () => {
    it('should create motor config from controller data', () => {
      const { CharacterMotor } = require('../../physics/character/CharacterMotor');
      const mockMotor = {
        getConfig: vi.fn().mockReturnValue({}),
      };
      CharacterMotor.mockImplementation(() => mockMotor);
      CharacterMotor.cleanupAll = vi.fn();

      const {
        KinematicBodyController,
      } = require('../../physics/character/KinematicBodyController');
      KinematicBodyController.cleanupAll = vi.fn();

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

      const { CharacterMotor } = require('../../physics/character/CharacterMotor');
      const mockMotor = { getConfig: vi.fn().mockReturnValue({}) };
      CharacterMotor.mockImplementation(() => mockMotor);

      const {
        KinematicBodyController,
      } = require('../../physics/character/KinematicBodyController');
      KinematicBodyController.cleanupAll = vi.fn();

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

      const {
        KinematicBodyController,
      } = require('../../physics/character/KinematicBodyController');
      KinematicBodyController.cleanupAll = vi.fn();

      expect(() => {
        updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);
      }).not.toThrow();
    });

    it('should continue processing other entities if one fails', () => {
      const entityId1 = 1;
      const entityId2 = 2;

      vi.mocked(componentRegistry.getEntitiesWithComponent).mockReturnValue([entityId1, entityId2]);

      // First entity throws error, second succeeds
      vi.mocked(componentRegistry.getComponentData)
        .mockImplementationOnce((id) => {
          if (id === entityId1) throw new Error('Entity 1 error');
          return mockControllerData;
        })
        .mockImplementationOnce(() => mockControllerData);

      const {
        KinematicBodyController,
      } = require('../../physics/character/KinematicBodyController');
      const mockControllerInstance = {
        move: vi.fn(),
        jump: vi.fn(),
        isGrounded: vi.fn().mockReturnValue(true),
      };
      KinematicBodyController.mockImplementation(() => mockControllerInstance);
      KinematicBodyController.cleanupAll = vi.fn();

      expect(() => {
        updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);
      }).not.toThrow();

      // Second entity should still be processed
      expect(mockControllerInstance.move).toHaveBeenCalled();
    });
  });

  describe('Multiple Entities', () => {
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

      const { CharacterMotor } = require('../../physics/character/CharacterMotor');
      const mockMotor1 = { getConfig: vi.fn().mockReturnValue({}) };
      const mockMotor2 = { getConfig: vi.fn().mockReturnValue({}) };
      CharacterMotor.mockImplementation((config) => {
        if (config.maxSpeed === 5.0) return mockMotor1;
        if (config.maxSpeed === 8.0) return mockMotor2;
        return { getConfig: vi.fn().mockReturnValue({}) };
      });

      const {
        KinematicBodyController,
      } = require('../../physics/character/KinematicBodyController');
      const mockControllerInstance = {
        move: vi.fn(),
        jump: vi.fn(),
        isGrounded: vi.fn().mockReturnValue(true),
      };
      KinematicBodyController.mockImplementation(() => mockControllerInstance);
      KinematicBodyController.cleanupAll = vi.fn();

      updateCharacterControllerSystem(mockInputManager, true, 1 / 60, mockWorld);

      expect(CharacterMotor).toHaveBeenCalledTimes(2);
      expect(CharacterMotor).toHaveBeenCalledWith(expect.objectContaining({ maxSpeed: 5.0 }));
      expect(CharacterMotor).toHaveBeenCalledWith(expect.objectContaining({ maxSpeed: 8.0 }));
    });
  });
});
