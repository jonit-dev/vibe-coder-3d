/**
 * Component Definitions using the new scalable registry system
 * This file demonstrates how to register components with minimal boilerplate
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory, componentRegistry } from '../ComponentRegistry';
import { EntityId } from '../types';
import { getRgbAsHex, setRgbValues } from '../utils/colorUtils';
import { getStringFromHash, storeString } from '../utils/stringHashUtils';

// ============================================================================
// COMPONENT SCHEMAS (Zod validation)
// ============================================================================

const TransformSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotation: z.tuple([z.number(), z.number(), z.number()]),
  scale: z.tuple([z.number(), z.number(), z.number()]),
});

const MeshRendererSchema = z.object({
  meshId: z.string(),
  materialId: z.string(),
  enabled: z.boolean().default(true),
  castShadows: z.boolean().default(true),
  receiveShadows: z.boolean().default(true),
  material: z
    .object({
      color: z.string().default('#3399ff'),
      metalness: z.number().default(0),
      roughness: z.number().default(0.5),
      emissive: z.string().default('#000000'),
      emissiveIntensity: z.number().default(0),
    })
    .optional(),
});

const RigidBodySchema = z.object({
  enabled: z.boolean(),
  bodyType: z.string(),
  type: z.string().optional(), // Legacy support
  mass: z.number(),
  gravityScale: z.number(),
  canSleep: z.boolean(),
  material: z.object({
    friction: z.number(),
    restitution: z.number(),
    density: z.number(),
  }),
});

const MeshColliderSchema = z.object({
  enabled: z.boolean(),
  isTrigger: z.boolean(),
  colliderType: z.string(),
  center: z.tuple([z.number(), z.number(), z.number()]),
  size: z.object({
    width: z.number(),
    height: z.number(),
    depth: z.number(),
    radius: z.number(),
    capsuleRadius: z.number(),
    capsuleHeight: z.number(),
  }),
  physicsMaterial: z.object({
    friction: z.number(),
    restitution: z.number(),
    density: z.number(),
  }),
});

const CameraSchema = z.object({
  preset: z.string(),
  fov: z.number(),
  near: z.number(),
  far: z.number(),
  isMain: z.boolean(),
  enableControls: z.boolean(),
  projectionType: z.enum(['perspective', 'orthographic']),
  orthographicSize: z.number().optional(),
  target: z.tuple([z.number(), z.number(), z.number()]),
  clearDepth: z.boolean(),
  renderPriority: z.number(),
});

// ============================================================================
// COMPONENT REGISTRATIONS
// ============================================================================

// Transform Component
const transformComponent = ComponentFactory.create({
  id: 'Transform',
  name: 'Transform',
  category: ComponentCategory.Core,
  schema: TransformSchema,
  fields: {
    positionX: Types.f32,
    positionY: Types.f32,
    positionZ: Types.f32,
    rotationX: Types.f32,
    rotationY: Types.f32,
    rotationZ: Types.f32,
    scaleX: Types.f32,
    scaleY: Types.f32,
    scaleZ: Types.f32,
  },
  serialize: (eid: EntityId, component: any) => ({
    position: [component.positionX[eid], component.positionY[eid], component.positionZ[eid]],
    rotation: [component.rotationX[eid], component.rotationY[eid], component.rotationZ[eid]],
    scale: [component.scaleX[eid], component.scaleY[eid], component.scaleZ[eid]],
  }),
  deserialize: (eid: EntityId, data, component: any) => {
    component.positionX[eid] = data.position[0];
    component.positionY[eid] = data.position[1];
    component.positionZ[eid] = data.position[2];
    component.rotationX[eid] = data.rotation[0];
    component.rotationY[eid] = data.rotation[1];
    component.rotationZ[eid] = data.rotation[2];
    component.scaleX[eid] = data.scale[0];
    component.scaleY[eid] = data.scale[1];
    component.scaleZ[eid] = data.scale[2];
  },
  metadata: {
    description: 'Position, rotation, and scale in 3D space',
    version: '1.0.0',
  },
});

// MeshRenderer Component
const meshRendererComponent = ComponentFactory.create({
  id: 'MeshRenderer',
  name: 'Mesh Renderer',
  category: ComponentCategory.Rendering,
  schema: MeshRendererSchema,
  fields: {
    enabled: Types.ui8,
    castShadows: Types.ui8,
    receiveShadows: Types.ui8,
    materialColorR: Types.f32,
    materialColorG: Types.f32,
    materialColorB: Types.f32,
    metalness: Types.f32,
    roughness: Types.f32,
    emissiveR: Types.f32,
    emissiveG: Types.f32,
    emissiveB: Types.f32,
    emissiveIntensity: Types.f32,
    meshIdHash: Types.ui32,
    materialIdHash: Types.ui32,
  },
  serialize: (eid: EntityId, component: any) => ({
    meshId: getStringFromHash(component.meshIdHash[eid]),
    materialId: getStringFromHash(component.materialIdHash[eid]),
    enabled: Boolean(component.enabled[eid]),
    castShadows: Boolean(component.castShadows[eid]),
    receiveShadows: Boolean(component.receiveShadows[eid]),
    material: {
      color: getRgbAsHex(
        {
          r: component.materialColorR,
          g: component.materialColorG,
          b: component.materialColorB,
        },
        eid,
      ),
      metalness: component.metalness[eid],
      roughness: component.roughness[eid],
      emissive: getRgbAsHex(
        {
          r: component.emissiveR,
          g: component.emissiveG,
          b: component.emissiveB,
        },
        eid,
      ),
      emissiveIntensity: component.emissiveIntensity[eid],
    },
  }),
  deserialize: (eid: EntityId, data, component: any) => {
    component.enabled[eid] = (data.enabled ?? true) ? 1 : 0;
    component.castShadows[eid] = (data.castShadows ?? true) ? 1 : 0;
    component.receiveShadows[eid] = (data.receiveShadows ?? true) ? 1 : 0;
    component.meshIdHash[eid] = storeString(data.meshId);
    component.materialIdHash[eid] = storeString(data.materialId);

    // Set material properties with defaults
    const material = data.material || {};
    setRgbValues(
      {
        r: component.materialColorR,
        g: component.materialColorG,
        b: component.materialColorB,
      },
      eid,
      material.color || '#3399ff',
    );

    component.metalness[eid] = material.metalness ?? 0;
    component.roughness[eid] = material.roughness ?? 0.5;

    setRgbValues(
      {
        r: component.emissiveR,
        g: component.emissiveG,
        b: component.emissiveB,
      },
      eid,
      material.emissive || '#000000',
    );

    component.emissiveIntensity[eid] = material.emissiveIntensity ?? 0;
  },
  dependencies: ['Transform'],
  metadata: {
    description: 'Renders 3D mesh geometry with materials',
    version: '1.0.0',
  },
});

// RigidBody Component
const rigidBodyComponent = ComponentFactory.create({
  id: 'RigidBody',
  name: 'Rigid Body',
  category: ComponentCategory.Physics,
  schema: RigidBodySchema,
  fields: {
    enabled: Types.ui8,
    bodyTypeHash: Types.ui32,
    mass: Types.f32,
    gravityScale: Types.f32,
    canSleep: Types.ui8,
    friction: Types.f32,
    restitution: Types.f32,
    density: Types.f32,
  },
  serialize: (eid: EntityId, component: any) => {
    const bodyType = getStringFromHash(component.bodyTypeHash[eid]) || 'dynamic';
    return {
      enabled: Boolean(component.enabled[eid]),
      bodyType: bodyType as any,
      type: bodyType,
      mass: component.mass[eid],
      gravityScale: component.gravityScale[eid],
      canSleep: Boolean(component.canSleep[eid]),
      material: {
        friction: component.friction[eid],
        restitution: component.restitution[eid],
        density: component.density[eid],
      },
    };
  },
  deserialize: (eid: EntityId, data, component: any) => {
    component.enabled[eid] = data.enabled ? 1 : 0;
    component.bodyTypeHash[eid] = storeString(data.bodyType || data.type || 'dynamic');
    component.mass[eid] = data.mass ?? 1;
    component.gravityScale[eid] = data.gravityScale ?? 1;
    component.canSleep[eid] = data.canSleep ? 1 : 0;

    if (data.material) {
      component.friction[eid] = data.material.friction ?? 0.7;
      component.restitution[eid] = data.material.restitution ?? 0.3;
      component.density[eid] = data.material.density ?? 1;
    }
  },
  dependencies: ['Transform'],
  metadata: {
    description: 'Physics simulation body with mass and material properties',
    version: '1.0.0',
  },
});

// MeshCollider Component
const meshColliderComponent = ComponentFactory.create({
  id: 'MeshCollider',
  name: 'Mesh Collider',
  category: ComponentCategory.Physics,
  schema: MeshColliderSchema,
  fields: {
    enabled: Types.ui8,
    isTrigger: Types.ui8,
    shapeType: Types.ui8,
    sizeX: Types.f32,
    sizeY: Types.f32,
    sizeZ: Types.f32,
    offsetX: Types.f32,
    offsetY: Types.f32,
    offsetZ: Types.f32,
  },
  serialize: (eid: EntityId, component: any) => ({
    enabled: Boolean(component.enabled[eid]),
    isTrigger: Boolean(component.isTrigger[eid]),
    colliderType: 'box',
    center: [component.offsetX[eid], component.offsetY[eid], component.offsetZ[eid]],
    size: {
      width: component.sizeX[eid],
      height: component.sizeY[eid],
      depth: component.sizeZ[eid],
      radius: 0.5,
      capsuleRadius: 0.5,
      capsuleHeight: 2,
    },
    physicsMaterial: {
      friction: 0.7,
      restitution: 0.3,
      density: 1,
    },
  }),
  deserialize: (eid: EntityId, data, component: any) => {
    component.enabled[eid] = data.enabled ? 1 : 0;
    component.isTrigger[eid] = data.isTrigger ? 1 : 0;
    component.shapeType[eid] = 0; // Default to box

    component.offsetX[eid] = data.center[0];
    component.offsetY[eid] = data.center[1];
    component.offsetZ[eid] = data.center[2];

    component.sizeX[eid] = data.size.width;
    component.sizeY[eid] = data.size.height;
    component.sizeZ[eid] = data.size.depth;
  },
  dependencies: ['Transform'],
  metadata: {
    description: 'Physics collision detection shape',
    version: '1.0.0',
  },
});

// Camera Component
const cameraComponent = ComponentFactory.create({
  id: 'Camera',
  name: 'Camera',
  category: ComponentCategory.Rendering,
  schema: CameraSchema,
  fields: {
    fov: Types.f32,
    near: Types.f32,
    far: Types.f32,
    isMain: Types.ui8,
    enableControls: Types.ui8,
    projectionType: Types.ui8,
    orthographicSize: Types.f32,
    targetX: Types.f32,
    targetY: Types.f32,
    targetZ: Types.f32,
    presetHash: Types.ui32,
    clearDepth: Types.ui8,
    renderPriority: Types.i32,
    needsUpdate: Types.ui8,
  },
  serialize: (eid: EntityId, component: any) => ({
    preset: getStringFromHash(component.presetHash[eid]) || 'unity-default',
    fov: component.fov[eid],
    near: component.near[eid],
    far: component.far[eid],
    isMain: Boolean(component.isMain[eid]),
    enableControls: Boolean(component.enableControls[eid]),
    projectionType: (component.projectionType[eid] === 1 ? 'orthographic' : 'perspective') as
      | 'perspective'
      | 'orthographic',
    orthographicSize: component.orthographicSize[eid],
    target: [component.targetX[eid], component.targetY[eid], component.targetZ[eid]] as [
      number,
      number,
      number,
    ],
    clearDepth: Boolean(component.clearDepth[eid]),
    renderPriority: component.renderPriority[eid],
  }),
  deserialize: (eid: EntityId, data, component: any) => {
    component.fov[eid] = data.fov;
    component.near[eid] = data.near;
    component.far[eid] = data.far;
    component.isMain[eid] = data.isMain ? 1 : 0;
    component.enableControls[eid] = data.enableControls ? 1 : 0;
    component.projectionType[eid] = data.projectionType === 'orthographic' ? 1 : 0;
    component.orthographicSize[eid] = data.orthographicSize || 10;
    component.targetX[eid] = data.target[0];
    component.targetY[eid] = data.target[1];
    component.targetZ[eid] = data.target[2];
    component.presetHash[eid] = storeString(data.preset);
    component.clearDepth[eid] = data.clearDepth ? 1 : 0;
    component.renderPriority[eid] = data.renderPriority || 0;
    component.needsUpdate[eid] = 1; // Mark for update
  },
  dependencies: ['Transform'],
  metadata: {
    description: 'Camera for rendering perspectives and viewports',
    version: '1.0.0',
  },
});

// ============================================================================
// REGISTER ALL COMPONENTS
// ============================================================================

export function registerCoreComponents(): void {
  componentRegistry.register(transformComponent);
  componentRegistry.register(meshRendererComponent);
  componentRegistry.register(rigidBodyComponent);
  componentRegistry.register(meshColliderComponent);
  componentRegistry.register(cameraComponent);

  console.log('Core components registered successfully');
}

// ============================================================================
// EXAMPLE: Adding a new component is now super simple!
// ============================================================================

// Health Component (example of how easy it is to add new components)
const HealthSchema = z.object({
  current: z.number(),
  maximum: z.number(),
  regenerationRate: z.number(),
  isInvulnerable: z.boolean(),
});

const healthComponent = ComponentFactory.createSimple({
  id: 'Health',
  name: 'Health',
  category: ComponentCategory.Gameplay,
  schema: HealthSchema,
  fieldMappings: {
    current: Types.f32,
    maximum: Types.f32,
    regenerationRate: Types.f32,
    isInvulnerable: Types.ui8,
  },
  onAdd: (eid: EntityId, data) => {
    console.log(`Health component added to entity ${eid} with ${data.current}/${data.maximum} HP`);
  },
  metadata: {
    description: 'Health and damage system for gameplay entities',
    version: '1.0.0',
  },
});

// Velocity Component (example of a simple physics component)
const VelocitySchema = z.object({
  linearX: z.number(),
  linearY: z.number(),
  linearZ: z.number(),
  angularX: z.number(),
  angularY: z.number(),
  angularZ: z.number(),
  damping: z.number(),
});

const velocityComponent = ComponentFactory.createSimple({
  id: 'Velocity',
  name: 'Velocity',
  category: ComponentCategory.Physics,
  schema: VelocitySchema,
  fieldMappings: {
    linearX: Types.f32,
    linearY: Types.f32,
    linearZ: Types.f32,
    angularX: Types.f32,
    angularY: Types.f32,
    angularZ: Types.f32,
    damping: Types.f32,
  },
  dependencies: ['Transform'],
  metadata: {
    description: 'Linear and angular velocity for movement',
    version: '1.0.0',
  },
});

// Register example components
export function registerExampleComponents(): void {
  componentRegistry.register(healthComponent);
  componentRegistry.register(velocityComponent);

  console.log('Example components registered successfully');
}

// Export type definitions for TypeScript support
export type TransformData = z.infer<typeof TransformSchema>;
export type MeshRendererData = z.infer<typeof MeshRendererSchema>;
export type RigidBodyData = z.infer<typeof RigidBodySchema>;
export type MeshColliderData = z.infer<typeof MeshColliderSchema>;
export type CameraData = z.infer<typeof CameraSchema>;
export type HealthData = z.infer<typeof HealthSchema>;
export type VelocityData = z.infer<typeof VelocitySchema>;
