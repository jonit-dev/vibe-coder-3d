# Custom Shapes Authoring Guide

This directory contains custom 3D shapes that are automatically discovered and made available in the editor. Each shape is a TypeScript/TSX module that exports a shape descriptor.

## Quick Start

### 1. Create a New Shape File

Create a new `.tsx` file in this directory (or subdirectories):

```tsx
// src/game/shapes/MyAwesomeShape.tsx
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { z } from 'zod';
import type { ICustomShapeDescriptor } from '@core';

// Define parameters with Zod for validation
const paramsSchema = z.object({
  radius: z.number().min(0.1).max(10).default(0.5),
  segments: z.number().int().min(3).max(128).default(32),
  height: z.number().min(0.1).max(20).default(1),
});

// Export the shape descriptor (MUST be named 'shape')
export const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
  meta: {
    id: 'my-awesome-shape', // Unique ID (kebab-case)
    name: 'My Awesome Shape', // Display name
    category: 'Custom', // Category for grouping
    tags: ['geometry', 'procedural'], // Search tags
    version: '1.0.0',
  },
  paramsSchema,
  getDefaultParams: () => paramsSchema.parse({}),
  renderGeometry: (params) => {
    // Create geometry using React Three Fiber primitives
    return (
      <cylinderGeometry args={[params.radius, params.radius, params.height, params.segments]} />
    );
  },
};
```

### 2. Save and Refresh

The shape will be automatically discovered on the next page refresh or HMR update.

### 3. Use in Editor

- Open the Add menu → Custom Shapes
- Your shape will appear in the list
- Click to add it to the scene

## Shape Descriptor Structure

### Required Exports

Each shape module **MUST** export a named export called `shape`:

```tsx
export const shape: ICustomShapeDescriptor<typeof paramsSchema> = { ... };
```

### Metadata (`meta`)

```tsx
meta: {
  id: 'unique-shape-id',           // Required: Unique identifier (kebab-case)
  name: 'Display Name',            // Required: Human-readable name
  category: 'Procedural',          // Optional: Category for grouping
  tags: ['tag1', 'tag2'],          // Optional: Tags for search/filtering
  version: '1.0.0',                // Optional: Version string
  icon: 'FaCube',                  // Optional: React Icons name
  previewImage: '/path/to/img.png',// Optional: Static preview fallback
  defaultColor: '#FF6B6B',         // Optional: Default color (hex format)
  defaultMaterial: {               // Optional: Full material settings
    color: '#FF6B6B',
    shader: 'standard',
    materialType: 'solid',
    metalness: 0.5,
    roughness: 0.7,
    albedoTexture: '/path/to/texture.png',
    normalTexture: '/path/to/normal.png',
    // ... other material properties
  }
}
```

**Note:** You can use either `defaultColor` for simple solid colors or `defaultMaterial` for complete material control including textures. If both are provided, `defaultMaterial` takes precedence.

### Parameters Schema (`paramsSchema`)

Use Zod to define shape parameters with validation:

```tsx
const paramsSchema = z.object({
  // Numeric parameters
  size: z.number().min(0.1).max(10).default(1),

  // Integer parameters
  segments: z.number().int().min(3).max(128).default(32),

  // Boolean parameters
  smoothShading: z.boolean().default(true),

  // String parameters
  variant: z.enum(['type-a', 'type-b']).default('type-a'),

  // Optional parameters
  detail: z.number().optional(),
});
```

### Default Parameters (`getDefaultParams`)

Returns default values for all parameters:

```tsx
getDefaultParams: () => paramsSchema.parse({});
```

This parses an empty object, which applies all `.default()` values from the schema.

### Geometry Rendering (`renderGeometry`)

Receives validated parameters and returns React Three Fiber JSX:

```tsx
renderGeometry: (params) => {
  // Option 1: Use built-in geometries
  return <sphereGeometry args={[params.radius, params.segments, params.segments]} />;

  // Option 2: Create custom THREE.js geometry
  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(params.width, params.height, params.depth);
  }, [params]);

  return <primitive object={geometry} />;
};
```

## Complete Examples

### Example 1: Simple Parametric Shape

```tsx
// src/game/shapes/ParametricBox.tsx
import React from 'react';
import { z } from 'zod';
import type { ICustomShapeDescriptor } from '@core';

const paramsSchema = z.object({
  width: z.number().default(1),
  height: z.number().default(1),
  depth: z.number().default(1),
});

export const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
  meta: {
    id: 'parametric-box',
    name: 'Parametric Box',
    category: 'Basic',
  },
  paramsSchema,
  getDefaultParams: () => paramsSchema.parse({}),
  renderGeometry: (params) => <boxGeometry args={[params.width, params.height, params.depth]} />,
};
```

### Example 2: Complex Procedural Shape

```tsx
// src/game/shapes/TorusKnot.tsx
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { z } from 'zod';
import type { ICustomShapeDescriptor } from '@core';

const paramsSchema = z.object({
  radius: z.number().min(0.1).max(5).default(0.4),
  tube: z.number().min(0.01).max(1).default(0.1),
  tubularSegments: z.number().int().min(3).max(200).default(64),
  radialSegments: z.number().int().min(3).max(64).default(8),
  p: z.number().int().min(1).max(10).default(2),
  q: z.number().int().min(1).max(10).default(3),
});

export const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
  meta: {
    id: 'torus-knot-procedural',
    name: 'Torus Knot (Procedural)',
    category: 'Procedural',
    tags: ['knot', 'math', 'parametric'],
    version: '1.0.0',
  },
  paramsSchema,
  getDefaultParams: () => paramsSchema.parse({}),
  renderGeometry: (params) => {
    const geometry = useMemo(
      () =>
        new THREE.TorusKnotGeometry(
          params.radius,
          params.tube,
          params.tubularSegments,
          params.radialSegments,
          params.p,
          params.q,
        ),
      [
        params.radius,
        params.tube,
        params.tubularSegments,
        params.radialSegments,
        params.p,
        params.q,
      ],
    );

    return <primitive object={geometry} />;
  },
};
```

### Example 3: Custom Geometry Builder

```tsx
// src/game/shapes/Star.tsx
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { z } from 'zod';
import type { ICustomShapeDescriptor } from '@core';

const paramsSchema = z.object({
  points: z.number().int().min(3).max(20).default(5),
  innerRadius: z.number().min(0.1).max(5).default(0.3),
  outerRadius: z.number().min(0.2).max(10).default(0.6),
  depth: z.number().min(0.1).max(5).default(0.1),
});

function createStarShape(points: number, innerRadius: number, outerRadius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const angleStep = (Math.PI * 2) / points;

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * angleStep) / 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }

  shape.closePath();
  return shape;
}

export const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
  meta: {
    id: 'star-extruded',
    name: 'Star (Extruded)',
    category: 'Shapes',
    tags: ['star', 'polygon', '2d'],
  },
  paramsSchema,
  getDefaultParams: () => paramsSchema.parse({}),
  renderGeometry: (params) => {
    const geometry = useMemo(() => {
      const starShape = createStarShape(params.points, params.innerRadius, params.outerRadius);
      return new THREE.ExtrudeGeometry(starShape, {
        depth: params.depth,
        bevelEnabled: false,
      });
    }, [params.points, params.innerRadius, params.outerRadius, params.depth]);

    return <primitive object={geometry} />;
  },
};
```

## Best Practices

### Performance

1. **Use `useMemo` for geometry creation**: Prevents recreating geometry on every render
2. **Include all params in dependency array**: Ensures geometry updates when params change
3. **Keep geometry complexity reasonable**: Very high polygon counts may affect editor performance

```tsx
// ✅ Good
const geometry = useMemo(
  () => new THREE.BoxGeometry(params.width, params.height, params.depth),
  [params.width, params.height, params.depth],
);

// ❌ Bad - geometry recreated every render
const geometry = new THREE.BoxGeometry(params.width, params.height, params.depth);
```

### Parameter Validation

1. **Set sensible min/max constraints**: Prevents invalid or extreme values
2. **Provide good defaults**: Makes shapes immediately usable
3. **Use descriptive parameter names**: Improves UX

```tsx
// ✅ Good
radius: z.number().min(0.1).max(10).default(0.5);

// ❌ Bad - no constraints
radius: z.number();
```

### Naming Conventions

1. **IDs**: Use kebab-case (e.g., `torus-knot`, `star-shape`)
2. **Names**: Use Title Case (e.g., "Torus Knot", "Star Shape")
3. **Files**: Match the shape name (e.g., `TorusKnot.tsx`, `StarShape.tsx`)

### Categories

Common categories to use:

- `Basic` - Simple geometric primitives
- `Procedural` - Math-based procedural shapes
- `Environment` - Terrain, rocks, trees, etc.
- `Architecture` - Buildings, stairs, walls, etc.
- `Decorative` - Ornamental shapes
- `Custom` - Catch-all for unique shapes

## Troubleshooting

### Shape Not Appearing in Editor

1. **Check the export name**: Must be `export const shape`
2. **Verify file location**: Must be in `src/game/shapes/**/*.{ts,tsx}`
3. **Check console for errors**: Discovery errors are logged
4. **Refresh the page**: HMR may not catch all changes

### Invalid Shape Descriptor Errors

Check that your shape has:

- ✅ `meta.id` (string, required)
- ✅ `meta.name` (string, required)
- ✅ `paramsSchema` (Zod schema, required)
- ✅ `getDefaultParams` (function, required)
- ✅ `renderGeometry` (function, required)

### Geometry Not Rendering

1. **Check browser console**: Look for runtime errors
2. **Verify Three.js imports**: Ensure `import * as THREE from 'three'`
3. **Test params manually**: Try rendering with hardcoded values first
4. **Check useMemo dependencies**: All params should be in the array

## Advanced Topics

### Using External Libraries

You can import and use external geometry libraries:

```tsx
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';

const geometry = useMemo(
  () =>
    new RoundedBoxGeometry(
      params.width,
      params.height,
      params.depth,
      params.segments,
      params.radius,
    ),
  [params],
);
```

### Conditional Geometry

Create different geometries based on parameters:

```tsx
renderGeometry: (params) => {
  if (params.variant === 'sphere') {
    return <sphereGeometry args={[params.size, 32, 32]} />;
  } else {
    return <boxGeometry args={[params.size, params.size, params.size]} />;
  }
};
```

### Multiple Geometries

Return multiple geometry elements if needed:

```tsx
renderGeometry: (params) => (
  <>
    <boxGeometry args={[params.width, params.height, params.depth]} />
    {/* Additional geometries can be composed here if needed */}
  </>
);
```

## Resources

- [Three.js Geometry Documentation](https://threejs.org/docs/#api/en/core/BufferGeometry)
- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Zod Documentation](https://zod.dev/)
- Shape Registry API: `src/core/lib/rendering/shapes/`

## Support

If you encounter issues or have questions:

1. Check this guide and examples
2. Review the `ExampleTorusKnot.tsx` in this directory
3. Check browser console for error messages
4. Review the shape registry source code
