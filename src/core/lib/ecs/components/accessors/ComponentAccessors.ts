/**
 * ComponentAccessors - Proxy-based component access system
 * Provides direct component accessors like entity.meshRenderer with batched updates
 */

import { componentRegistry } from '../../ComponentRegistry';
import { ComponentMutationBuffer } from '../../mutations/ComponentMutationBuffer';
import type {
  ICameraAccessor,
  ICameraData,
  IMeshColliderAccessor,
  IMeshColliderData,
  IMeshRendererAccessor,
  IMeshRendererData,
  IRigidBodyAccessor,
  IRigidBodyData,
  ITransformAccessor,
  ITransformData,
} from './types';

// Unit conversion helpers for script-facing radians <-> ECS degrees
const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

/**
 * Cache component accessors per entity to avoid repeated proxy creation
 */
const entityAccessorCache = new WeakMap<object, Map<string, unknown>>();

/**
 * Create a components proxy for an entity
 * Accessors are lazily created on first access and cached
 */
export function createComponentsProxy(
  entityId: number,
  buffer: ComponentMutationBuffer,
): Record<string, unknown> {
  // Create cache key object for this entity+buffer pair
  const cacheKey = { entityId, buffer };
  let cache = entityAccessorCache.get(cacheKey);
  if (!cache) {
    cache = new Map<string, unknown>();
    entityAccessorCache.set(cacheKey, cache);
  }

  return new Proxy(
    {},
    {
      get(_, componentId: string | symbol) {
        if (typeof componentId !== 'string') return undefined;

        // Return cached accessor if available
        if (cache!.has(componentId)) {
          return cache!.get(componentId);
        }

        // Get component descriptor first
        const descriptor = componentRegistry.get<unknown>(componentId);
        if (!descriptor) {
          return undefined;
        }

        // Check if component exists on entity
        if (!componentRegistry.hasComponent(entityId, componentId)) {
          return undefined;
        }

        // Create base accessor with get/set
        const baseAccessor = {
          get(): unknown | null {
            return componentRegistry.getComponentData(entityId, componentId) ?? null;
          },
          set(patch: Record<string, unknown>): void {
            // Decompose patch into field-level updates for coalescing
            for (const [field, value] of Object.entries(patch)) {
              buffer.queue(entityId, componentId, field, value);
            }
          },
        };

        // Allow specialization (e.g., MeshRenderer gets material helpers)
        const specialized = attachSpecializedAccessors(entityId, componentId, baseAccessor, buffer);

        // Cache the specialized accessor
        cache!.set(componentId, specialized);
        return specialized;
      },
    },
  );
}

/**
 * Attach specialized accessors for specific component types
 * Supports Transform, MeshRenderer, Camera, RigidBody, and MeshCollider
 */
function attachSpecializedAccessors(
  entityId: number,
  componentId: string,
  base: { get: () => unknown | null; set: (patch: Record<string, unknown>) => void },
  buffer: ComponentMutationBuffer,
): unknown {
  if (componentId === 'Transform') {
    const transformAccessor: ITransformAccessor = {
      get(): ITransformData | null {
        const data = base.get() as ITransformData | null;
        if (!data) return null;
        // Convert stored degrees to radians for scripts
        return {
          ...data,
          rotation: [
            data.rotation[0] * DEG_TO_RAD,
            data.rotation[1] * DEG_TO_RAD,
            data.rotation[2] * DEG_TO_RAD,
          ],
        };
      },
      set: base.set,
      setPosition(x: number, y: number, z: number): void {
        buffer.queue(entityId, 'Transform', 'position', [x, y, z]);
      },
      setRotation(x: number, y: number, z: number): void {
        // Scripts use radians; ECS stores degrees
        buffer.queue(entityId, 'Transform', 'rotation', [
          x * RAD_TO_DEG,
          y * RAD_TO_DEG,
          z * RAD_TO_DEG,
        ]);
      },
      setScale(x: number, y: number, z: number): void {
        buffer.queue(entityId, 'Transform', 'scale', [x, y, z]);
      },
      translate(x: number, y: number, z: number): void {
        const current = base.get() as ITransformData | null;
        if (current) {
          const [px, py, pz] = current.position;
          buffer.queue(entityId, 'Transform', 'position', [px + x, py + y, pz + z]);
        }
      },
      rotate(x: number, y: number, z: number): void {
        const current = base.get() as ITransformData | null;
        if (current) {
          const [rx, ry, rz] = current.rotation;
          // Inputs are radians; convert to degrees and add to stored degrees
          buffer.queue(entityId, 'Transform', 'rotation', [
            rx + x * RAD_TO_DEG,
            ry + y * RAD_TO_DEG,
            rz + z * RAD_TO_DEG,
          ]);
        }
      },
      lookAt(targetPos: [number, number, number]): void {
        const current = base.get() as ITransformData | null;
        if (current) {
          const [px, py, pz] = current.position;
          const [tx, ty, tz] = targetPos;

          const dx = tx - px;
          const dy = ty - py;
          const dz = tz - pz;

          const yaw = Math.atan2(dx, dz); // radians
          const distance = Math.sqrt(dx * dx + dz * dz);
          const pitch = -Math.atan2(dy, distance); // radians

          // Store degrees
          buffer.queue(entityId, 'Transform', 'rotation', [
            pitch * RAD_TO_DEG,
            yaw * RAD_TO_DEG,
            0,
          ]);
        }
      },
      forward(): [number, number, number] {
        const current = base.get() as ITransformData | null;
        if (!current) return [0, 0, 1];
        // Convert stored degrees to radians for trig
        const rx = current.rotation[0] * DEG_TO_RAD;
        const ry = current.rotation[1] * DEG_TO_RAD;
        return [Math.sin(ry) * Math.cos(rx), -Math.sin(rx), Math.cos(ry) * Math.cos(rx)];
      },
      right(): [number, number, number] {
        const current = base.get() as ITransformData | null;
        if (!current) return [1, 0, 0];
        const ry = current.rotation[1] * DEG_TO_RAD;
        return [Math.cos(ry), 0, -Math.sin(ry)];
      },
      up(): [number, number, number] {
        const current = base.get() as ITransformData | null;
        if (!current) return [0, 1, 0];
        const rx = current.rotation[0] * DEG_TO_RAD;
        const ry = current.rotation[1] * DEG_TO_RAD;
        return [-Math.sin(ry) * Math.sin(rx), Math.cos(rx), -Math.cos(ry) * Math.sin(rx)];
      },
    };

    return transformAccessor;
  }

  if (componentId === 'MeshRenderer') {
    const meshRendererAccessor: IMeshRendererAccessor = {
      get: base.get as () => IMeshRendererData | null,
      set: base.set,
      enable(value: boolean): void {
        base.set({ enabled: !!value });
      },
      material: {
        setColor(hex: string | number): void {
          const colorStr = typeof hex === 'number' ? `#${hex.toString(16).padStart(6, '0')}` : hex;
          base.set({ material: { color: colorStr } });
        },
        setMetalness(value: number): void {
          const clamped = Math.max(0, Math.min(1, value));
          base.set({ material: { metalness: clamped } });
        },
        setRoughness(value: number): void {
          const clamped = Math.max(0, Math.min(1, value));
          base.set({ material: { roughness: clamped } });
        },
        setEmissive(hex: string | number, intensity = 1): void {
          const emissiveStr =
            typeof hex === 'number' ? `#${hex.toString(16).padStart(6, '0')}` : hex;
          base.set({
            material: {
              emissive: emissiveStr,
              emissiveIntensity: intensity,
            },
          });
        },
        setTexture(
          kind: 'albedo' | 'normal' | 'metallic' | 'roughness' | 'emissive' | 'occlusion',
          idOrPath: string,
        ): void {
          const textureKey = `${kind}Texture`;
          base.set({ material: { [textureKey]: idOrPath } });
        },
      },
    };

    return meshRendererAccessor;
  }

  if (componentId === 'Camera') {
    const cameraAccessor: ICameraAccessor = {
      get: base.get as () => ICameraData | null,
      set: base.set,
      setFov(fov: number): void {
        buffer.queue(entityId, 'Camera', 'fov', Math.max(1, Math.min(179, fov)));
      },
      setClipping(near: number, far: number): void {
        buffer.queue(entityId, 'Camera', 'near', Math.max(0.01, near));
        buffer.queue(entityId, 'Camera', 'far', Math.max(near + 0.1, far));
      },
      setProjection(type: 'perspective' | 'orthographic'): void {
        buffer.queue(entityId, 'Camera', 'projectionType', type);
      },
      setAsMain(isMain: boolean): void {
        buffer.queue(entityId, 'Camera', 'isMain', isMain);
      },
    };

    return cameraAccessor;
  }

  if (componentId === 'RigidBody') {
    const rigidBodyAccessor: IRigidBodyAccessor = {
      get: base.get as () => IRigidBodyData | null,
      set: base.set,
      enable(value: boolean): void {
        buffer.queue(entityId, 'RigidBody', 'enabled', !!value);
      },
      setBodyType(type: 'dynamic' | 'kinematic' | 'static'): void {
        buffer.queue(entityId, 'RigidBody', 'bodyType', type);
        buffer.queue(entityId, 'RigidBody', 'type', type);
      },
      setMass(mass: number): void {
        buffer.queue(entityId, 'RigidBody', 'mass', Math.max(0.01, mass));
      },
      setGravityScale(scale: number): void {
        buffer.queue(entityId, 'RigidBody', 'gravityScale', scale);
      },
      setPhysicsMaterial(friction: number, restitution: number, density = 1): void {
        buffer.queue(entityId, 'RigidBody', 'material', {
          friction: Math.max(0, friction),
          restitution: Math.max(0, Math.min(1, restitution)),
          density: Math.max(0.01, density),
        });
      },
      applyForce(force: [number, number, number], point?: [number, number, number]): void {
        buffer.queue(entityId, 'RigidBody', '__applyForce', { force, point });
      },
      applyImpulse(impulse: [number, number, number], point?: [number, number, number]): void {
        buffer.queue(entityId, 'RigidBody', '__applyImpulse', { impulse, point });
      },
      setLinearVelocity(vel: [number, number, number]): void {
        buffer.queue(entityId, 'RigidBody', '__setLinearVelocity', vel);
      },
      getLinearVelocity(): [number, number, number] {
        // This will be populated by physics binding reading from Rapier world
        const data = base.get() as any;
        return data?.__linearVelocity || [0, 0, 0];
      },
      setAngularVelocity(vel: [number, number, number]): void {
        buffer.queue(entityId, 'RigidBody', '__setAngularVelocity', vel);
      },
      getAngularVelocity(): [number, number, number] {
        // This will be populated by physics binding reading from Rapier world
        const data = base.get() as any;
        return data?.__angularVelocity || [0, 0, 0];
      },
    };

    return rigidBodyAccessor;
  }

  if (componentId === 'MeshCollider') {
    const meshColliderAccessor: IMeshColliderAccessor = {
      get: base.get as () => IMeshColliderData | null,
      set: base.set,
      enable(value: boolean): void {
        buffer.queue(entityId, 'MeshCollider', 'enabled', !!value);
      },
      setTrigger(isTrigger: boolean): void {
        buffer.queue(entityId, 'MeshCollider', 'isTrigger', !!isTrigger);
      },
      setType(type: 'box' | 'sphere' | 'capsule' | 'convex' | 'mesh' | 'heightfield'): void {
        buffer.queue(entityId, 'MeshCollider', 'colliderType', type);
      },
      setCenter(x: number, y: number, z: number): void {
        buffer.queue(entityId, 'MeshCollider', 'center', [x, y, z]);
      },
      setBoxSize(width: number, height: number, depth: number): void {
        buffer.queue(entityId, 'MeshCollider', 'size', {
          width: Math.max(0.01, width),
          height: Math.max(0.01, height),
          depth: Math.max(0.01, depth),
        });
      },
      setSphereRadius(radius: number): void {
        buffer.queue(entityId, 'MeshCollider', 'size', {
          radius: Math.max(0.01, radius),
        });
      },
      setCapsuleSize(radius: number, height: number): void {
        buffer.queue(entityId, 'MeshCollider', 'size', {
          capsuleRadius: Math.max(0.01, radius),
          capsuleHeight: Math.max(0.01, height),
        });
      },
    };

    return meshColliderAccessor;
  }

  // Return base accessor for components without specialization
  return base;
}
