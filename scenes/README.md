# Scene Files Directory

This directory contains saved 3D scenes from the VibeEngine editor as TypeScript React components (.tsx files).

## Why TSX Format?

The VibeEngine uses TSX format for scene files because it provides:

- **Type Safety**: Full TypeScript support with compile-time validation
- **IDE Support**: IntelliSense, autocomplete, and refactoring tools
- **Version Control**: Better diffs, merges, and conflict resolution
- **Programmatic Scenes**: Ability to use variables, loops, and logic
- **Documentation**: Inline comments and JSDoc support
- **Component Reuse**: Scenes can be imported and composed together

## File Structure

Each scene file contains:
- **Component**: React functional component that creates entities
- **Metadata**: Scene information (name, version, timestamp, author)
- **Entities**: TypeScript objects with full type definitions
- **Documentation**: JSDoc comments explaining the scene

## File Naming

- Scene files are saved as `{SceneName}.tsx` using PascalCase
- Special characters are sanitized for valid component names
- Example: "My Cool Scene" becomes `MyCoolScene.tsx`

## Usage

1. **Save Scene**: Use the save button in the editor to create a TSX scene component
2. **Load Scene**: Use the load button to browse and select existing scenes
3. **Manual Editing**: Edit TSX files directly in any TypeScript-compatible editor
4. **Import Scenes**: Import and compose scenes in other components

## Example Scene Structure
```tsx
import React from 'react';
import { useEffect } from 'react';
import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { useComponentManager } from '@/editor/hooks/useComponentManager';

/**
 * Example Scene - A simple scene with camera and light
 * Generated: 2025-09-26T02:04:00.000Z
 * Version: 1
 * Author: Claude Code Assistant
 */
export const ExampleScene: React.FC = () => {
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();

  useEffect(() => {
    const entities = [
      {
        id: "1",
        name: "Main Camera",
        components: {
          "Transform": { position: [0, 0, -10] },
          "Camera": { fov: 75, near: 0.1, far: 1000 }
        }
      }
    ];

    entityManager.clearEntities();

    entities.forEach((entityData) => {
      const entity = entityManager.createEntity(entityData.name);
      Object.entries(entityData.components).forEach(([type, data]) => {
        componentManager.addComponent(entity.id, type, data);
      });
    });
  }, []);

  return null;
};

export const metadata = {
  name: "Example Scene",
  version: 1,
  timestamp: "2025-09-26T02:04:00.000Z"
};

export default ExampleScene;
```

## Validation

All scene files are validated on save/load to ensure:
- Proper schema structure
- Valid entity data
- Component integrity

If validation fails, detailed error messages will show what needs to be fixed.