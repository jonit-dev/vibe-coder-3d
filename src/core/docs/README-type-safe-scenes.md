# Type-Safe Scene System

This document describes the comprehensive type-safe scene system implemented for dynamically generated scenes like XX123.tsx. The system provides full TypeScript type safety, runtime validation, and enhanced error handling.

## Overview

The type-safe scene system addresses the following issues with dynamically generated scenes:

1. **Type Safety**: All scene data is strongly typed with TypeScript interfaces
2. **Runtime Validation**: Zod schemas validate scene data at runtime
3. **Better Error Handling**: Detailed error reporting with path-specific messages
4. **Component Consistency**: Validates component data against known schemas
5. **Developer Experience**: IntelliSense support and compile-time checking

## Architecture

### Core Components

#### 1. Type Definitions (`src/core/types/scene.ts`)

- **ComponentDataMap**: Maps component types to their data structures
- **SceneData**: Complete scene structure with metadata and entities
- **SceneEntityData**: Individual entity with components
- **SceneBuilder**: Type-safe scene construction utilities

#### 2. Scene Builder (`src/core/utils/sceneBuilder.ts`)

- **SceneBuilder class**: Type-safe scene construction
- **Component creation utilities**: Helper functions for common components
- **Validation**: Runtime validation during scene construction

#### 3. Validation System (`src/core/utils/sceneValidation.ts`)

- **SceneValidator class**: Comprehensive validation with detailed error reporting
- **ValidationResult**: Structured validation results with errors and warnings
- **Batch validation**: Validate multiple scenes efficiently

#### 4. Scene Loader (`src/core/utils/sceneLoader.ts`)

- **SceneLoader class**: Enhanced scene loading with validation
- **Progress tracking**: Real-time loading progress reporting
- **Error recovery**: Graceful handling of loading errors

#### 5. TSX Serializer (`src/core/lib/serialization/tsxSerializer.ts`)

- **generateTsxScene**: Generates type-safe TSX scenes
- **Runtime validation**: Validates scene data during generation
- **Type annotations**: Full TypeScript type annotations in generated code

## Usage Examples

### Creating Type-Safe Scenes

```typescript
import {
  createSceneBuilder,
  createTransformComponent,
  createCameraComponent,
} from '@/core/utils/sceneBuilder';

// Create a type-safe scene builder
const builder = createSceneBuilder(['Transform', 'MeshRenderer', 'Camera']);

// Add entities with type safety
builder.entity('Main Camera', {
  Transform: createTransformComponent([0, 5, 10]),
  Camera: createCameraComponent({ isMain: true }),
});

builder.entity('Player', {
  Transform: createTransformComponent([0, 0, 0]),
  MeshRenderer: createMeshRendererComponent('player-mesh', 'player-material'),
});

// Build the scene
const scene = builder.build({
  name: 'MyScene',
  version: 1,
  timestamp: new Date().toISOString(),
});
```

### Validating Scenes

```typescript
import { quickValidateScene, SceneValidator } from '@/core/utils/sceneValidation';

const sceneData = /* your scene data */;

// Quick validation
const validation = quickValidateScene(sceneData);
if (!validation.success) {
  console.error('Scene validation failed:', validation.errors);
}

// Detailed validation with custom validator
const validator = new SceneValidator();
const result = validator.validateScene(sceneData);
const summary = validator.getValidationSummary();
```

### Loading Scenes with Type Safety

```typescript
import { useSceneLoader, loadSceneFromUrl } from '@/core/utils/sceneLoader';

function MyComponent() {
  const { loadScene, validateScene } = useSceneLoader();

  const handleLoadScene = async () => {
    const result = await loadScene(sceneData, {
      validateBeforeLoad: true,
      onProgress: (progress, message) => {
        console.log(`${progress}%: ${message}`);
      },
      onError: (error, entityId) => {
        console.error(`Error${entityId ? ` in entity ${entityId}` : ''}: ${error}`);
      },
    });

    if (result.success) {
      console.log(`Loaded ${result.loadedEntities} entities`);
    } else {
      console.error('Scene loading failed:', result.errors);
    }
  };

  return <button onClick={handleLoadScene}>Load Scene</button>;
}
```

### Component Utilities

```typescript
import {
  createTransformComponent,
  createMeshRendererComponent,
  createCameraComponent,
  createLightComponent,
} from '@/core/utils/sceneBuilder';

// Create components with type safety and defaults
const transform = createTransformComponent([0, 0, 0], [0, 45, 0], [1, 1, 1]);
const meshRenderer = createMeshRendererComponent('cube', 'default', {
  material: { color: '#ff0000' },
});
const camera = createCameraComponent({ isMain: true, fov: 60 });
const light = createLightComponent('directional', { intensity: 1.5 });
```

## Generated Scene Structure

The updated scene generation system produces scenes with the following improvements:

### Before (Untyped)

```typescript
const entities = [
  {
    id: '5',
    name: 'Main Camera',
    components: {
      Transform: {
        /* untyped data */
      },
      Camera: {
        /* untyped data */
      },
    },
  },
];
```

### After (Type-Safe)

```typescript
/**
 * Type-safe scene data interface
 */
interface ITypedSceneEntity {
  id: string;
  name: string;
  parentId?: string | null;
  components: {
    [K in KnownComponentTypes]?: ComponentDataMap[K];
  } & {
    [key: string]: unknown; // Allow additional components
  };
}

/**
 * Type-safe scene definition
 */
const sceneData: ITypedSceneEntity[] = [
  {
    id: '5',
    name: 'Main Camera',
    components: {
      Transform: {
        /* fully typed TransformData */
      },
      Camera: {
        /* fully typed CameraData */
      },
    },
  },
];
```

## Validation Features

### Runtime Validation

- **Schema Validation**: Zod schemas validate all component data
- **Type Checking**: Runtime type checking with detailed error messages
- **Component Consistency**: Validates component relationships and dependencies
- **Entity Validation**: Checks entity IDs, names, and component integrity

### Error Reporting

- **Path-Specific Errors**: Errors include exact paths to problematic data
- **Contextual Messages**: Descriptive error messages with suggestions
- **Warning System**: Non-critical issues reported as warnings
- **Validation Summary**: Aggregated validation results

### Example Validation Output

```typescript
{
  success: false,
  errors: [
    {
      path: 'entities[2].components.Camera.fov',
      message: 'Expected number, received string',
      value: '45' // The problematic value
    }
  ],
  warnings: [
    'Entity "Player" missing required Transform component',
    'Component "CustomComponent" is not a known component type'
  ]
}
```

## Integration with Existing Code

### Scene Generation

The scene generation system in `tsxSerializer.ts` now:

- Generates fully type-safe TSX scenes
- Includes proper TypeScript imports and type annotations
- Validates scene data during generation
- Provides IntelliSense support in generated code

### Vite Plugin

The Vite plugin in `vite-plugin-scene-api.ts` now:

- Uses the type-safe scene generator
- Validates scene data before generation
- Provides better error handling and logging
- Supports the new validation system

### Component System

The ECS component system is enhanced with:

- Type-safe component data interfaces
- Runtime validation against schemas
- Better error messages for component loading
- Type inference for component data

## Migration Guide

### For Existing Scenes

1. **Update Imports**: Replace untyped imports with type-safe versions
2. **Add Type Annotations**: Annotate scene data with proper types
3. **Enable Validation**: Use the validation utilities during loading
4. **Update Component Creation**: Use component creation utilities

### For New Scenes

1. **Use SceneBuilder**: Create scenes with the type-safe builder
2. **Validate During Development**: Use validation utilities early
3. **Leverage Type Safety**: Take advantage of TypeScript's type checking
4. **Test Loading**: Use the enhanced loading system with progress tracking

## Performance Considerations

### Validation Overhead

- **Schema Validation**: Minimal overhead for runtime validation
- **Type Checking**: Compile-time only, no runtime cost
- **Error Reporting**: Detailed errors only generated when needed

### Loading Performance

- **Progressive Loading**: Load entities incrementally with progress tracking
- **Error Recovery**: Continue loading despite individual entity failures
- **Batch Operations**: Optimized for loading multiple entities

## Best Practices

### Scene Design

1. **Use Required Components**: Always include Transform for 3D entities
2. **Consistent Naming**: Use consistent entity and component naming
3. **Validate Early**: Validate scenes during development, not just production
4. **Document Complex Scenes**: Add descriptions and metadata for complex scenes

### Type Safety

1. **Leverage Type Inference**: Let TypeScript infer types where possible
2. **Use Component Utilities**: Use helper functions for common components
3. **Validate at Boundaries**: Validate data when entering/leaving your system
4. **Handle Unknown Components**: Gracefully handle custom or unknown components

### Error Handling

1. **Provide Context**: Include entity names and IDs in error messages
2. **Use Progress Callbacks**: Keep users informed during long operations
3. **Log Warnings**: Address warnings to prevent future issues
4. **Test Error Cases**: Verify error handling works correctly

## Troubleshooting

### Common Issues

#### Type Errors

- **Solution**: Use component creation utilities or check type definitions
- **Check**: Verify component data matches expected interfaces

#### Validation Failures

- **Solution**: Use validation utilities to identify specific issues
- **Check**: Review validation error messages for exact problems

#### Loading Errors

- **Solution**: Enable detailed error logging and progress tracking
- **Check**: Verify scene data structure matches expected format

### Debug Tools

- **SceneValidator**: Comprehensive validation with detailed reporting
- **Progress Tracking**: Monitor loading progress and identify bottlenecks
- **Error Context**: Detailed error messages with paths and values

## Future Enhancements

### Planned Features

- **Component Schema Generation**: Auto-generate schemas from component definitions
- **Scene Templates**: Pre-built scene templates with type safety
- **Advanced Validation**: Cross-component validation and dependency checking
- **Performance Monitoring**: Scene loading performance metrics

### Extensibility

- **Custom Components**: Easy registration of custom component types
- **Plugin System**: Extensible validation and loading plugins
- **Custom Validators**: User-defined validation rules
- **Scene Analysis**: Advanced scene structure analysis tools

This type-safe scene system provides a robust foundation for creating, validating, and loading complex 3D scenes with full TypeScript support and runtime safety.
