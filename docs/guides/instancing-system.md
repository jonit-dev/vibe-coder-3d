# Instancing System Guide

## Overview

The Instancing System allows you to efficiently render thousands of identical meshes using GPU instancing via THREE.InstancedMesh. This dramatically reduces draw calls and improves performance for scenes with repeated geometry.

**Performance Impact**: ★★★★☆

GPU instancing can reduce **thousands of draw calls** down to **one per instanced mesh group**, delivering massive performance improvements especially on mobile devices.

## When to Use Instancing

Use instancing when you have:
- **Repeated geometry**: Trees, grass, rocks, debris, particles
- **Static or semi-static objects**: Objects that don't change frequently
- **Identical meshes**: Same geometry and material (per-instance colors supported)

Don't use instancing for:
- Unique objects with different geometries
- Objects with frequently changing materials
- Objects that need individual physics interactions

## Basic Usage

### JSX Component API

The easiest way to use instancing is through the `<Instanced>` JSX component:

```tsx
import { Entity, Instanced } from '@core/components/jsx';

function ForestScene() {
  // Generate 1000 tree positions
  const treeInstances = Array.from({ length: 1000 }, (_, i) => ({
    position: [
      Math.random() * 100 - 50,
      0,
      Math.random() * 100 - 50,
    ] as [number, number, number],
    rotation: [0, Math.random() * Math.PI * 2, 0] as [number, number, number],
    scale: [1 + Math.random() * 0.5, 1 + Math.random() * 0.5, 1 + Math.random() * 0.5] as [number, number, number],
  }));

  return (
    <Entity name="TreeInstances">
      <Instanced
        baseMeshId="cylinder" // Use a cylinder as the tree trunk
        baseMaterialId="tree-material"
        instances={treeInstances}
        capacity={1000}
        castShadows={true}
        receiveShadows={true}
      />
    </Entity>
  );
}
```

### Per-Instance Colors

You can specify different colors for each instance:

```tsx
const coloredInstances = Array.from({ length: 100 }, (_, i) => ({
  position: [i * 2, 0, 0] as [number, number, number],
  color: [
    Math.random(),
    Math.random(),
    Math.random(),
  ] as [number, number, number],
}));

<Instanced
  baseMeshId="sphere"
  baseMaterialId="default"
  instances={coloredInstances}
  capacity={100}
/>
```

## Advanced Usage

### Programmatic API

For dynamic management of instances at runtime, use the `instanceSystemApi`:

```tsx
import { instanceSystemApi } from '@core/systems/InstanceSystem';

// Add a new instance
const result = instanceSystemApi.addInstance(entityId, {
  position: [10, 0, 5],
  rotation: [0, Math.PI / 4, 0],
  scale: [1, 1, 1],
});

if (result.success) {
  console.log('Instance added at index:', result.index);
}

// Update an instance
instanceSystemApi.updateInstance(entityId, instanceIndex, {
  position: [20, 5, 10],
  scale: [2, 2, 2],
});

// Remove an instance
instanceSystemApi.removeInstance(entityId, instanceIndex);

// Get all instances
const instances = instanceSystemApi.getInstances(entityId);

// Get instance count
const count = instanceSystemApi.getInstanceCount(entityId);
```

### ECS Component API

For direct ECS access:

```tsx
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import type { InstancedComponentData } from '@core/lib/ecs/components/definitions/InstancedComponent';

// Add instanced component
const data: InstancedComponentData = {
  enabled: true,
  capacity: 500,
  baseMeshId: 'cube',
  baseMaterialId: 'default',
  instances: [
    { position: [0, 0, 0] },
    { position: [5, 0, 0] },
    { position: [10, 0, 0] },
  ],
  castShadows: true,
  receiveShadows: true,
  frustumCulled: true,
};

componentRegistry.addComponent(entityId, 'Instanced', data);
```

## Examples

### Example 1: Grass Field

```tsx
function GrassField() {
  const grassBlades = Array.from({ length: 5000 }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 50;

    return {
      position: [
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius,
      ] as [number, number, number],
      rotation: [
        0,
        Math.random() * Math.PI * 2,
        Math.random() * 0.2 - 0.1, // Slight tilt
      ] as [number, number, number],
      scale: [
        0.1 + Math.random() * 0.05,
        0.5 + Math.random() * 0.3,
        0.1 + Math.random() * 0.05,
      ] as [number, number, number],
      color: [
        0.2 + Math.random() * 0.2, // Green variation
        0.6 + Math.random() * 0.2,
        0.1,
      ] as [number, number, number],
    };
  });

  return (
    <Entity name="GrassField">
      <Instanced
        baseMeshId="plane"
        baseMaterialId="grass"
        instances={grassBlades}
        capacity={5000}
        castShadows={false}
        receiveShadows={true}
      />
    </Entity>
  );
}
```

### Example 2: Particle System

```tsx
function ParticleExplosion() {
  const [particles, setParticles] = useState(() =>
    Array.from({ length: 200 }, () => ({
      position: [0, 0, 0] as [number, number, number],
      scale: [0.1, 0.1, 0.1] as [number, number, number],
    }))
  );

  useFrame((state, delta) => {
    setParticles(prev => prev.map(p => ({
      position: [
        p.position[0] + (Math.random() - 0.5) * delta * 10,
        p.position[1] + (Math.random() - 0.5) * delta * 10,
        p.position[2] + (Math.random() - 0.5) * delta * 10,
      ] as [number, number, number],
      scale: p.scale,
    })));
  });

  return (
    <Entity name="Particles">
      <Instanced
        baseMeshId="sphere"
        baseMaterialId="particle"
        instances={particles}
        capacity={200}
        frustumCulled={false}
      />
    </Entity>
  );
}
```

### Example 3: Dynamic Crowd

```tsx
function Crowd() {
  const entityIdRef = useRef<number>();
  const { entityId } = useEntityContext();

  useEffect(() => {
    entityIdRef.current = entityId;

    // Initial crowd
    for (let i = 0; i < 100; i++) {
      instanceSystemApi.addInstance(entityId, {
        position: [
          Math.random() * 20 - 10,
          0,
          Math.random() * 20 - 10,
        ],
        rotation: [0, Math.random() * Math.PI * 2, 0],
      });
    }
  }, [entityId]);

  // Animate crowd
  useFrame(() => {
    if (!entityIdRef.current) return;

    const instances = instanceSystemApi.getInstances(entityIdRef.current);
    if (!instances) return;

    instances.forEach((instance, index) => {
      // Simple walking animation
      const newPos = [...instance.position] as [number, number, number];
      newPos[0] += Math.sin(performance.now() * 0.001 + index) * 0.01;
      newPos[2] += Math.cos(performance.now() * 0.001 + index) * 0.01;

      instanceSystemApi.updateInstance(entityIdRef.current!, index, {
        position: newPos,
      });
    });
  });

  return (
    <Instanced
      baseMeshId="cube"
      baseMaterialId="character"
      instances={[]}
      capacity={100}
    />
  );
}
```

## Performance Tips

### 1. Set Appropriate Capacity

Always set `capacity` to the maximum number of instances you'll need. Exceeding capacity will fail silently.

```tsx
<Instanced
  capacity={1000} // Set to max expected instances
  instances={currentInstances} // Can be less than capacity
/>
```

### 2. Batch by Material and Geometry

Each unique (geometry + material) pair requires a separate InstancedMesh. Group objects with the same appearance together:

```tsx
// Good: One instanced mesh
<Instanced baseMeshId="tree" baseMaterialId="bark" instances={allTrees} />

// Bad: Multiple instanced meshes for same object type
<Instanced baseMeshId="tree" baseMaterialId="bark1" instances={someTrees} />
<Instanced baseMeshId="tree" baseMaterialId="bark2" instances={otherTrees} />
```

### 3. Use Frustum Culling

Enable `frustumCulled` for large scenes:

```tsx
<Instanced
  frustumCulled={true} // Cull instances outside camera view
  instances={instances}
/>
```

### 4. Minimize Updates

Updating instances triggers buffer uploads to the GPU. Batch updates when possible:

```tsx
// Good: Update once with all changes
const newInstances = instances.map(modifyInstance);
setInstances(newInstances);

// Bad: Update each instance individually in a loop
instances.forEach((_, i) => {
  instanceSystemApi.updateInstance(entityId, i, newData);
});
```

## Architecture

### Components

- **InstancedComponent** (`src/core/lib/ecs/components/definitions/InstancedComponent.ts`): ECS component storing instance data
- **Instanced** (`src/core/components/jsx/Instanced.tsx`): React wrapper for easy usage

### Systems

- **InstanceSystem** (`src/core/systems/InstanceSystem.ts`): Manages THREE.InstancedMesh creation and updates

### Utilities

- **InstanceBufferManager** (`src/core/lib/instancing/buffers.ts`): Efficient matrix and color buffer management
- **InstanceBufferPool** (`src/core/lib/instancing/buffers.ts`): Object pool for buffer reuse

## Limitations

1. **Shared Material**: All instances share the same base material (per-instance colors supported)
2. **Shared Geometry**: All instances use the same geometry
3. **Capacity Limit**: Maximum capacity is 100,000 instances per entity
4. **No Individual Physics**: Instances don't have individual collision shapes (use a separate collision system)

## Future Enhancements

- [ ] Integration with drei's `<Instances>` helper
- [ ] Texture atlasing for material variations
- [ ] LOD (Level of Detail) support
- [ ] GPU-based culling for even better performance
- [ ] Editor tools for scattering and painting instances

## See Also

- [Performance Optimization Guide](../PRDs/performance/)
- [R3F Instancing & Batching PRD](../PRDs/performance/4-30-r3f-instancing-and-batching-prd.md)
- [ECS Component System](./adding-components.md)
