import { ComponentCategory, IComponentGroup } from '../types';

import { ComponentGroupManager } from './ComponentGroupManager';

// Built-in component groups
export const BUILT_IN_COMPONENT_GROUPS: IComponentGroup[] = [
  {
    id: 'physics-group',
    name: 'Physics Package',
    description: 'Complete physics simulation with rigid body and collision detection',
    category: ComponentCategory.Physics,
    icon: 'FiZap',
    components: ['rigidBody', 'meshCollider'],
    defaultValues: {
      rigidBody: {
        enabled: true,
        bodyType: 'dynamic',
        mass: 1,
        gravityScale: 1,
        canSleep: true,
        linearDamping: 0.01,
        angularDamping: 0.01,
        material: {
          friction: 0.6,
          restitution: 0.3,
          density: 1,
        },
      },
      meshCollider: {
        enabled: true,
        colliderType: 'box',
        isTrigger: false,
        center: [0, 0, 0],
        size: {
          width: 1,
          height: 1,
          depth: 1,
        },
        physicsMaterial: {
          friction: 0.6,
          restitution: 0.3,
          density: 1,
        },
      },
    },
    order: 1,
  },
  {
    id: 'movement-group',
    name: 'Movement Package',
    description: 'Velocity-based movement and physics simulation',
    category: ComponentCategory.Physics,
    icon: 'FiTrendingUp',
    components: ['velocity', 'rigidBody', 'meshCollider'],
    defaultValues: {
      velocity: {
        linear: [0, 0, 0],
        angular: [0, 0, 0],
        linearDamping: 0.01,
        angularDamping: 0.01,
        priority: 1,
      },
      rigidBody: {
        enabled: true,
        bodyType: 'dynamic',
        mass: 1,
        gravityScale: 1,
        canSleep: true,
        linearDamping: 0.01,
        angularDamping: 0.01,
        material: {
          friction: 0.6,
          restitution: 0.3,
          density: 1,
        },
      },
      meshCollider: {
        enabled: true,
        colliderType: 'box',
        isTrigger: false,
        center: [0, 0, 0],
        size: {
          width: 1,
          height: 1,
          depth: 1,
        },
        physicsMaterial: {
          friction: 0.6,
          restitution: 0.3,
          density: 1,
        },
      },
    },
    order: 2,
  },
  {
    id: 'trigger-group',
    name: 'Trigger Package',
    description: 'Invisible trigger zone for collision detection',
    category: ComponentCategory.Physics,
    icon: '🧿',
    components: ['meshCollider'],
    defaultValues: {
      meshCollider: {
        enabled: true,
        colliderType: 'box',
        isTrigger: true,
        center: [0, 0, 0],
        size: {
          width: 1,
          height: 1,
          depth: 1,
        },
        physicsMaterial: {
          friction: 0,
          restitution: 0,
          density: 1,
        },
      },
    },
    order: 3,
  },
  {
    id: 'static-physics-group',
    name: 'Static Physics Package',
    description: 'Static physics body for immovable objects',
    category: ComponentCategory.Physics,
    icon: 'FiSquare',
    components: ['rigidBody', 'meshCollider'],
    defaultValues: {
      rigidBody: {
        enabled: true,
        bodyType: 'static',
        mass: 0,
        gravityScale: 0,
        canSleep: false,
        linearDamping: 0,
        angularDamping: 0,
        material: {
          friction: 0.8,
          restitution: 0.1,
          density: 1,
        },
      },
      meshCollider: {
        enabled: true,
        colliderType: 'box',
        isTrigger: false,
        center: [0, 0, 0],
        size: {
          width: 1,
          height: 1,
          depth: 1,
        },
        physicsMaterial: {
          friction: 0.8,
          restitution: 0.1,
          density: 1,
        },
      },
    },
    order: 4,
  },
  {
    id: 'rendering-group',
    name: 'Rendering Package',
    description: 'Complete visual rendering setup',
    category: ComponentCategory.Rendering,
    icon: 'FiEye',
    components: ['meshRenderer'],
    defaultValues: {
      meshRenderer: {
        enabled: true,
        visible: true,
        castShadows: true,
        receiveShadows: true,
        renderOrder: 0,
        frustumCulled: true,
      },
    },
    order: 5,
  },
];

export function registerBuiltInComponentGroups(): void {
  for (const group of BUILT_IN_COMPONENT_GROUPS) {
    ComponentGroupManager.registerGroup(group);
  }
  console.log(`Registered ${BUILT_IN_COMPONENT_GROUPS.length} built-in component groups`);
}
