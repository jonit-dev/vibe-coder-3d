/**
 * ComponentAccessors - Proxy-based component access system
 * Provides direct component accessors like entity.meshRenderer with batched updates
 */

import { componentRegistry } from '../../ComponentRegistry';
import { ComponentMutationBuffer } from '../../mutations/ComponentMutationBuffer';
import type { IMeshRendererAccessor, IMeshRendererData } from './types';

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
 * Currently supports MeshRenderer with material helpers
 */
function attachSpecializedAccessors(
  entityId: number,
  componentId: string,
  base: { get: () => unknown | null; set: (patch: Record<string, unknown>) => void },
  buffer: ComponentMutationBuffer,
): unknown {
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

  // Return base accessor for components without specialization
  return base;
}
