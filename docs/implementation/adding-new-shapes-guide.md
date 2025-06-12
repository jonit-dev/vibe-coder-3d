# Adding New Shapes to the 3D Editor

This guide provides a step-by-step process for adding new 3D shapes to the Vibe Coder 3D editor system.

## Overview

The shape system in this project is built around Three.js geometries and follows a consistent pattern across multiple files. Each shape requires updates in several key areas to be fully integrated into the editor.

## Step-by-Step Guide

### 1. Define the Shape Type

**File**: `src/editor/types/shapes.ts`

Add your new shape type to the `ShapeType` union:

```typescript
export type ShapeType =
  | 'Cube'
  | 'Sphere'
  // ... existing shapes
  | 'YourNewShape' // Add this line
  | 'CustomModel';
```

### 2. Add Mesh ID Mapping

**File**: `src/core/lib/ecs/ComponentRegistry.ts`

Add your shape to the `meshIdToTypeMap` around line 652:

```typescript
const meshIdToTypeMap: { [key: string]: string } = {
  cube: 'Cube',
  sphere: 'Sphere',
  // ... existing mappings
  yourNewShape: 'YourNewShape', // Add this line
  custom: 'custom',
};
```

### 3. Create Geometry Implementation

**Option A: Simple Three.js Geometry**

If your shape uses a built-in Three.js geometry, add it directly to `EntityMesh.tsx` (Step 4).

**Option B: Custom Geometry**

For complex shapes, create custom geometry in `src/editor/components/panels/ViewportPanel/components/CustomGeometries.tsx`:

```typescript
export const YourNewShapeGeometry: React.FC<{
  // Add props for customization
  radius?: number;
  segments?: number;
}> = ({ radius = 0.5, segments = 32 }) => {
  const geometry = useMemo(() => {
    // Create your custom Three.js geometry here
    const geom = new THREE.BufferGeometry();

    // Example: Create vertices, indices, UVs, etc.
    const vertices = [];
    const indices = [];
    // ... your geometry creation logic

    geom.setIndex(indices);
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.computeVertexNormals();

    return geom;
  }, [radius, segments]);

  return <primitive object={geometry} />;
};
```

### 4. Add Geometry to Renderer

**File**: `src/editor/components/panels/ViewportPanel/components/EntityMesh.tsx`

1. **Import custom geometry** (if created):

```typescript
import { YourNewShapeGeometry } from './CustomGeometries';
```

2. **Add case to geometry switch** (around line 174):

```typescript
const geometryContent = useMemo(() => {
  switch (meshType) {
    case 'Sphere':
      return <sphereGeometry args={[0.5, 32, 32]} />;
    // ... existing cases
    case 'YourNewShape':
      return <YourNewShapeGeometry />; // Custom geometry
      // OR
      return <yourThreeJSGeometry args={[param1, param2]} />; // Built-in geometry
    default:
      return <boxGeometry args={[1, 1, 1]} />;
  }
}, [meshType]);
```

### 5. Add Entity Creation Function

**File**: `src/editor/hooks/useEntityCreation.ts`

1. **Add creation function**:

```typescript
const createYourNewShape = useCallback(
  (name?: string, parentId?: number) => {
    const actualName = name || `Your New Shape ${getNextNumber('Your New Shape')}`;
    const entity = createEntity(actualName, parentId);
    addMeshRenderer(entity.id, 'yourNewShape'); // Must match meshId from step 2
    return entity;
  },
  [createEntity, addMeshRenderer, getNextNumber],
);
```

2. **Export the function**:

```typescript
return {
  createEntity,
  // ... existing functions
  createYourNewShape, // Add this line
  deleteEntity,
};
```

### 6. Add Handler Logic

**File**: `src/editor/hooks/useEditorHandlers.ts`

1. **Import the creation function**:

```typescript
const {
  createEntity,
  // ... existing functions
  createYourNewShape, // Add this line
} = useEntityCreation();
```

2. **Add case to switch statement** (around line 67):

```typescript
const handleAddObject = useCallback(
  async (type: ShapeType, modelPath?: string) => {
    try {
      let entity;
      switch (type) {
        case 'Cube':
          entity = createCube();
          break;
        // ... existing cases
        case 'YourNewShape':
          entity = createYourNewShape();
          break;
        default:
          entity = createEntity(type);
          break;
      }
      // ... rest of function
    }
  },
  [
    // ... existing dependencies
    createYourNewShape,  // Add to dependency array
  ],
);
```

### 7. Add to Menu System

**File**: `src/editor/components/menus/EnhancedAddObjectMenu.tsx`

1. **Add to appropriate category** in `OBJECT_CATEGORIES` (around line 31):

```typescript
const OBJECT_CATEGORIES: IMenuCategory[] = [
  {
    label: 'Basic Shapes', // or appropriate category
    icon: <TbBox size={18} />,
    items: [
      // ... existing items
      {
        type: 'YourNewShape',
        label: 'Your New Shape',
        icon: <TbYourIcon size={18} />, // Choose appropriate icon
      },
    ],
  },
  // ... other categories
];
```

2. **Add to validTypes array** (around line 158):

```typescript
const validTypes: ShapeType[] = [
  'Cube',
  'Sphere',
  // ... existing types
  'YourNewShape', // Add this line
];
```

## Example: Adding a Star Shape

Here's a complete example of adding a star-shaped geometry:

### 1. Types

```typescript
// src/editor/types/shapes.ts
| 'Star'
```

### 2. Mesh ID Mapping

```typescript
// src/core/lib/ecs/ComponentRegistry.ts
star: 'Star',
```

### 3. Custom Geometry

```typescript
// src/editor/components/panels/ViewportPanel/components/CustomGeometries.tsx
export const StarGeometry: React.FC<{
  outerRadius?: number;
  innerRadius?: number;
  points?: number;
  depth?: number;
}> = ({ outerRadius = 0.5, innerRadius = 0.25, points = 5, depth = 0.1 }) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();

    // Create star shape
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();

    const extrudeSettings = {
      depth,
      bevelEnabled: false,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [outerRadius, innerRadius, points, depth]);

  return <primitive object={geometry} />;
};
```

### 4. Add to EntityMesh

```typescript
// Import
import { StarGeometry } from './CustomGeometries';

// Case
case 'Star':
  return <StarGeometry />;
```

### 5. Creation Function

```typescript
const createStar = useCallback(
  (name?: string, parentId?: number) => {
    const actualName = name || `Star ${getNextNumber('Star')}`;
    const entity = createEntity(actualName, parentId);
    addMeshRenderer(entity.id, 'star');
    return entity;
  },
  [createEntity, addMeshRenderer, getNextNumber],
);
```

### 6. Handler

```typescript
case 'Star':
  entity = createStar();
  break;
```

### 7. Menu

```typescript
{
  type: 'Star',
  label: 'Star',
  icon: <TbStar size={18} />,
},
```

## Testing Your New Shape

1. **Start the development server**
2. **Open the Add menu** in the top toolbar
3. **Find your shape** in the appropriate category
4. **Click to add** and verify it appears in the viewport
5. **Check the hierarchy** to ensure proper naming
6. **Test selection** and transformation tools

## Common Issues and Solutions

### Shape Doesn't Appear

- Check console for errors
- Verify all files were updated correctly
- Ensure meshId matches between ComponentRegistry and useEntityCreation

### Shape Appears as Cube

- Check that the geometry case in EntityMesh.tsx is correct
- Verify the meshType mapping in ComponentRegistry

### Can't Select Shape

- Ensure the mesh has proper userData with entityId
- Check that the geometry is properly constructed

### Performance Issues

- Use `useMemo` for expensive geometry calculations
- Consider LOD (Level of Detail) for complex shapes
- Profile with React DevTools

## Advanced Customization

### Parametric Shapes

Add properties to the geometry component and expose them through:

- Inspector panel components
- Material system integration
- Animation system hooks

### Shader Integration

- Custom materials for special effects
- Vertex shaders for dynamic deformation
- Fragment shaders for procedural textures

### Physics Integration

- Add collision shape definitions
- Configure physics material properties
- Set up rigid body constraints

## Contributing

When adding new shapes to the project:

1. **Follow naming conventions** (PascalCase for types, camelCase for functions)
2. **Add proper TypeScript types** for all parameters
3. **Include JSDoc comments** for complex functions
4. **Test thoroughly** before submitting
5. **Update this guide** if you discover new patterns or requirements

## Files Modified Summary

For each new shape, you'll typically modify these 7 files:

1. `src/editor/types/shapes.ts` - Type definition
2. `src/core/lib/ecs/ComponentRegistry.ts` - Mesh ID mapping
3. `src/editor/components/panels/ViewportPanel/components/CustomGeometries.tsx` - Geometry (if custom)
4. `src/editor/components/panels/ViewportPanel/components/EntityMesh.tsx` - Renderer integration
5. `src/editor/hooks/useEntityCreation.ts` - Creation function
6. `src/editor/hooks/useEditorHandlers.ts` - Handler logic
7. `src/editor/components/menus/EnhancedAddObjectMenu.tsx` - Menu integration
