/**
 * Character Controller Component Definition
 * Handles character movement with physics-based collision detection and response
 * Follows Contract v2.0 for TS-Rust parity
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { EntityId } from '../../types';
import { getStringFromHash, storeString } from '../../utils/stringHashUtils';

// Input mapping schema for auto mode
const InputMappingSchema = z.object({
  forward: z.string(),
  backward: z.string(),
  left: z.string(),
  right: z.string(),
  jump: z.string(),
});

// Character Controller Schema (Contract v2.0 + Interaction Tuning)
const CharacterControllerSchema = z.object({
  enabled: z.boolean(),
  slopeLimit: z.number().min(0).max(90),
  stepOffset: z.number().min(0),
  skinWidth: z.number().min(0),
  gravityScale: z.number(),
  maxSpeed: z.number().min(0),
  jumpStrength: z.number().min(0),
  controlMode: z.enum(['auto', 'manual']),
  inputMapping: InputMappingSchema.optional(),
  // Interaction tuning parameters
  snapMaxSpeed: z.number().min(0), // Max vertical speed to allow ground snapping
  maxDepenetrationPerFrame: z.number().min(0), // Max depenetration per frame (meters)
  pushStrength: z.number().min(0), // Force multiplier when pushing objects
  maxPushMass: z.number().min(0), // Max mass of pushable objects (0 = unlimited)
  // Runtime-only field (not serialized to scene)
  isGrounded: z.boolean(),
});

// Character Controller Component Definition
export const characterControllerComponent = ComponentFactory.create({
  id: 'CharacterController',
  name: 'Character Controller',
  category: ComponentCategory.Gameplay,
  schema: CharacterControllerSchema,
  fields: {
    enabled: Types.ui8,
    slopeLimit: Types.f32,
    stepOffset: Types.f32,
    skinWidth: Types.f32,
    gravityScale: Types.f32,
    maxSpeed: Types.f32,
    jumpStrength: Types.f32,
    controlModeHash: Types.ui32,
    inputMappingForwardHash: Types.ui32,
    inputMappingBackwardHash: Types.ui32,
    inputMappingLeftHash: Types.ui32,
    inputMappingRightHash: Types.ui32,
    inputMappingJumpHash: Types.ui32,
    // Interaction tuning fields
    snapMaxSpeed: Types.f32,
    maxDepenetrationPerFrame: Types.f32,
    pushStrength: Types.f32,
    maxPushMass: Types.f32,
    isGrounded: Types.ui8, // Runtime-only
  },
  serialize: (eid: EntityId, bitECSComponent: unknown) => {
    const component = bitECSComponent as Record<string, Record<number, unknown>>;
    const controlMode = getStringFromHash(Number(component.controlModeHash[eid])) || 'auto';

    // Build input mapping if any hash is set
    const hasInputMapping = Boolean(component.inputMappingForwardHash[eid]);
    const inputMapping = hasInputMapping
      ? {
          forward: getStringFromHash(Number(component.inputMappingForwardHash[eid])) || 'w',
          backward: getStringFromHash(Number(component.inputMappingBackwardHash[eid])) || 's',
          left: getStringFromHash(Number(component.inputMappingLeftHash[eid])) || 'a',
          right: getStringFromHash(Number(component.inputMappingRightHash[eid])) || 'd',
          jump: getStringFromHash(Number(component.inputMappingJumpHash[eid])) || 'space',
        }
      : undefined;

    return {
      enabled: Boolean(component.enabled[eid]),
      slopeLimit: Number(component.slopeLimit[eid]),
      stepOffset: Number(component.stepOffset[eid]),
      skinWidth: Number(component.skinWidth[eid]),
      gravityScale: Number(component.gravityScale[eid]),
      maxSpeed: Number(component.maxSpeed[eid]),
      jumpStrength: Number(component.jumpStrength[eid]),
      controlMode: controlMode as 'auto' | 'manual',
      inputMapping,
      // Interaction tuning
      snapMaxSpeed: Number(component.snapMaxSpeed[eid]),
      maxDepenetrationPerFrame: Number(component.maxDepenetrationPerFrame[eid]),
      pushStrength: Number(component.pushStrength[eid]),
      maxPushMass: Number(component.maxPushMass[eid]),
      isGrounded: Boolean(component.isGrounded[eid]), // Runtime-only, included for live state
    };
  },
  deserialize: (eid: EntityId, data: ICharacterControllerData, bitECSComponent: unknown) => {
    const component = bitECSComponent as Record<string, Record<number, unknown>>;
    component.enabled[eid] = data.enabled ? 1 : 0;
    component.slopeLimit[eid] = data.slopeLimit ?? 45.0;
    component.stepOffset[eid] = data.stepOffset ?? 0.3;
    component.skinWidth[eid] = data.skinWidth ?? 0.08;
    component.gravityScale[eid] = data.gravityScale ?? 1.0;
    component.maxSpeed[eid] = data.maxSpeed ?? 6.0;
    component.jumpStrength[eid] = data.jumpStrength ?? 6.5;
    component.controlModeHash[eid] = storeString(data.controlMode || 'auto');
    // Interaction tuning with defaults
    component.snapMaxSpeed[eid] = data.snapMaxSpeed ?? 5.0;
    component.maxDepenetrationPerFrame[eid] = data.maxDepenetrationPerFrame ?? 0.5;
    component.pushStrength[eid] = data.pushStrength ?? 1.0;
    component.maxPushMass[eid] = data.maxPushMass ?? 0;
    component.isGrounded[eid] = data.isGrounded ? 1 : 0; // Runtime-only state

    // Store input mapping if provided
    if (data.inputMapping) {
      component.inputMappingForwardHash[eid] = storeString(data.inputMapping.forward || 'w');
      component.inputMappingBackwardHash[eid] = storeString(data.inputMapping.backward || 's');
      component.inputMappingLeftHash[eid] = storeString(data.inputMapping.left || 'a');
      component.inputMappingRightHash[eid] = storeString(data.inputMapping.right || 'd');
      // Auto-fix legacy ' ' to 'space'
      const jumpKey = data.inputMapping.jump === ' ' ? 'space' : data.inputMapping.jump || 'space';
      component.inputMappingJumpHash[eid] = storeString(jumpKey);
    }
  },
  dependencies: ['Transform', 'MeshCollider'], // Requires Transform for position/rotation and MeshCollider for physics shape queries
  incompatibleComponents: [], // CharacterController works alongside physics system, not against it
  metadata: {
    description:
      'Physics-based character controller with auto-input support and collision detection',
    version: '2.0.0',
    author: 'Claude',
    tags: ['gameplay', 'physics', 'character', 'controller', 'input'],
  },
});

export type ICharacterControllerData = z.infer<typeof CharacterControllerSchema>;
