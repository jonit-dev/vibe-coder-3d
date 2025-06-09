# Adding Components to the ECS System

This guide covers the complete pipeline for adding new components to the Vibe Coder 3D engine, from initial definition to inspector panel visualization.

## 🧠 System Architecture Overview

The component system uses a **scalable component registry** that provides:

- **BitECS integration** for high-performance data storage
- **Zod schema validation** for type safety and runtime validation
- **Automatic serialization/deserialization** between formats
- **Dependency management** and conflict detection
- **Inspector panel integration** with automatic UI generation

## 📁 File Structure

```
src/core/lib/ecs/components/
├── definitions/
│   ├── TransformComponent.ts     # ✅ Core component
│   ├── RigidBodyComponent.ts     # ✅ Physics component
│   ├── CameraComponent.ts        # ✅ Rendering component
│   ├── YourNewComponent.ts       # 🆕 Your component goes here
│   └── index.ts                  # Export aggregator
├── ComponentDefinitions.ts       # Registration logic
└── ...

src/editor/components/
├── inspector/adapters/
│   ├── TransformAdapter.tsx      # ✅ Transform UI adapter
│   ├── RigidBodyAdapter.tsx      # ✅ Physics UI adapter
│   └── YourNewAdapter.tsx        # 🆕 Your UI adapter
├── panels/InspectorPanel/
│   ├── Transform/                # ✅ Transform UI sections
│   ├── RigidBody/               # ✅ Physics UI sections
│   └── YourComponent/           # 🆕 Your UI sections
└── ...
```

## 🔧 Step-by-Step Guide

### Step 1: Define the Component Schema

Create a new file `src/core/lib/ecs/components/definitions/HealthComponent.ts`:

```typescript
/**
 * Health Component Definition
 * Handles entity health, damage, and regeneration
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { EntityId } from '../../types';

// 1. Define Zod schema for validation and TypeScript types
const HealthSchema = z.object({
  current: z.number().min(0),
  maximum: z.number().min(1),
  regenerationRate: z.number().min(0),
  isInvulnerable: z.boolean(),
  lastDamageTime: z.number().optional(),
});

// 2. Create component using ComponentFactory
export const healthComponent = ComponentFactory.create({
  id: 'Health', // Unique identifier
  name: 'Health', // Display name
  category: ComponentCategory.Gameplay, // Category for organization
  schema: HealthSchema, // Zod schema for validation

  // 3. Define BitECS field mappings (performance-optimized storage)
  fields: {
    current: Types.f32,
    maximum: Types.f32,
    regenerationRate: Types.f32,
    isInvulnerable: Types.ui8, // Boolean as uint8
    lastDamageTime: Types.f32,
  },

  // 4. Serialization: BitECS → JavaScript object
  serialize: (eid: EntityId, component: any) => ({
    current: component.current[eid],
    maximum: component.maximum[eid],
    regenerationRate: component.regenerationRate[eid],
    isInvulnerable: Boolean(component.isInvulnerable[eid]),
    lastDamageTime: component.lastDamageTime[eid],
  }),

  // 5. Deserialization: JavaScript object → BitECS
  deserialize: (eid: EntityId, data, component: any) => {
    component.current[eid] = data.current ?? data.maximum ?? 100;
    component.maximum[eid] = data.maximum ?? 100;
    component.regenerationRate[eid] = data.regenerationRate ?? 0;
    component.isInvulnerable[eid] = data.isInvulnerable ? 1 : 0;
    component.lastDamageTime[eid] = data.lastDamageTime ?? 0;
  },

  // 6. Lifecycle hooks (optional)
  onAdd: (eid: EntityId, data) => {
    console.log(`Health component added to entity ${eid} with ${data.current}/${data.maximum} HP`);
  },
  onRemove: (eid: EntityId) => {
    console.log(`Health component removed from entity ${eid}`);
  },

  // 7. Component relationships (optional)
  dependencies: [], // Required components
  conflicts: [], // Incompatible components

  // 8. Metadata (optional)
  metadata: {
    description: 'Health and damage system for gameplay entities',
    version: '1.0.0',
    author: 'Your Name',
    tags: ['gameplay', 'health', 'damage'],
  },
});

// 9. Export TypeScript type
export type HealthData = z.infer<typeof HealthSchema>;
```

### Step 2: Export the Component

Update `src/core/lib/ecs/components/definitions/index.ts`:

```typescript
// Add your new component to the exports
export { healthComponent, type HealthData } from './HealthComponent';

// Existing exports...
export { cameraComponent, type CameraData } from './CameraComponent';
export { meshColliderComponent, type MeshColliderData } from './MeshColliderComponent';
export { meshRendererComponent, type MeshRendererData } from './MeshRendererComponent';
export { rigidBodyComponent, type RigidBodyData } from './RigidBodyComponent';
export { transformComponent, type TransformData } from './TransformComponent';
```

### Step 3: Register the Component

Update `src/core/lib/ecs/components/ComponentDefinitions.ts`:

```typescript
// Import your new component
import {
  healthComponent, // 🆕 Add this
  cameraComponent,
  meshColliderComponent,
  meshRendererComponent,
  rigidBodyComponent,
  transformComponent,
  type HealthData, // 🆕 Add this
  type CameraData,
  // ... other types
} from './definitions';

export function registerCoreComponents(): void {
  componentRegistry.register(transformComponent);
  componentRegistry.register(meshRendererComponent);
  componentRegistry.register(rigidBodyComponent);
  componentRegistry.register(meshColliderComponent);
  componentRegistry.register(cameraComponent);
  componentRegistry.register(healthComponent); // 🆕 Add this

  console.log('Core components registered successfully');
}

// Export the new type
export type { HealthData }; // 🆕 Add this
```

### Step 4: Add Component Type Definition

Update `src/core/lib/ecs/IComponent.ts`:

```typescript
export enum KnownComponentTypes {
  TRANSFORM = 'Transform',
  MESH_RENDERER = 'MeshRenderer',
  RIGID_BODY = 'RigidBody',
  MESH_COLLIDER = 'MeshCollider',
  CAMERA = 'Camera',
  HEALTH = 'Health', // 🆕 Add this
}
```

### Step 5: Create Inspector UI Section

Create `src/editor/components/panels/InspectorPanel/Health/HealthSection.tsx`:

```typescript
import React from 'react';
import { FiHeart } from 'react-icons/fi';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { HealthData } from '@/core/lib/ecs/components/definitions/HealthComponent';
import { ComponentField } from '@/editor/components/shared/ComponentField';
import { FieldGroup } from '@/editor/components/shared/FieldGroup';
import { GenericComponentSection } from '@/editor/components/shared/GenericComponentSection';
import { SingleAxisField } from '@/editor/components/shared/SingleAxisField';
import { ToggleField } from '@/editor/components/shared/ToggleField';

export interface IHealthSectionProps {
  healthData: HealthData;
  onUpdate: (data: Partial<HealthData>) => void;
  onRemove?: () => void;
  isPlaying?: boolean;
}

export const HealthSection: React.FC<IHealthSectionProps> = ({
  healthData,
  onUpdate,
  onRemove,
  isPlaying = false,
}) => {
  const handleRemoveHealth = () => {
    onRemove?.();
  };

  const updateHealth = (updates: Partial<HealthData>) => {
    onUpdate({ ...healthData, ...updates });
  };

  // Calculate health percentage for visual feedback
  const healthPercentage = (healthData.current / healthData.maximum) * 100;
  const isLowHealth = healthPercentage < 25;
  const isCriticalHealth = healthPercentage < 10;

  return (
    <GenericComponentSection
      title="Health"
      icon={<FiHeart />}
      headerColor={isCriticalHealth ? 'red' : isLowHealth ? 'orange' : 'green'}
      componentId={KnownComponentTypes.HEALTH}
      onRemove={handleRemoveHealth}
    >
      {/* Health Status Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-300">Health</span>
          <span className="text-xs text-gray-300">
            {healthData.current.toFixed(1)} / {healthData.maximum.toFixed(1)}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isCriticalHealth
                ? 'bg-red-500'
                : isLowHealth
                ? 'bg-orange-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.max(0, healthPercentage)}%` }}
          />
        </div>
      </div>

      <FieldGroup label="Health Values">
        <SingleAxisField
          label="Current Health"
          value={healthData.current}
          onChange={(value: number) => updateHealth({ current: Math.max(0, Math.min(value, healthData.maximum)) })}
          step={1}
          min={0}
          max={healthData.maximum}
          disabled={isPlaying}
        />

        <SingleAxisField
          label="Maximum Health"
          value={healthData.maximum}
          onChange={(value: number) => updateHealth({
            maximum: Math.max(1, value),
            current: Math.min(healthData.current, Math.max(1, value))
          })}
          step={1}
          min={1}
          disabled={isPlaying}
        />

        <SingleAxisField
          label="Regeneration Rate"
          value={healthData.regenerationRate}
          onChange={(value: number) => updateHealth({ regenerationRate: Math.max(0, value) })}
          step={0.1}
          min={0}
          placeholder="HP per second"
        />
      </FieldGroup>

      <FieldGroup label="Status">
        <ToggleField
          label="Invulnerable"
          value={healthData.isInvulnerable}
          onChange={(value: boolean) => updateHealth({ isInvulnerable: value })}
          resetValue={false}
          color="purple"
        />
      </FieldGroup>

      {/* Debug Information */}
      {healthData.lastDamageTime && healthData.lastDamageTime > 0 && (
        <div className="mt-2 p-2 bg-gray-800/50 rounded text-xs text-gray-400">
          Last damage: {new Date(healthData.lastDamageTime).toLocaleTimeString()}
        </div>
      )}
    </GenericComponentSection>
  );
};
```

### Step 6: Create Inspector Adapter

Create `src/editor/components/inspector/adapters/HealthAdapter.tsx`:

```typescript
import React from 'react';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { HealthSection } from '@/editor/components/panels/InspectorPanel/Health/HealthSection';

interface IHealthAdapterProps {
  healthComponent: any;
  updateComponent: (type: string, data: any) => boolean;
  removeComponent: (type: string) => boolean;
  isPlaying: boolean;
}

export const HealthAdapter: React.FC<IHealthAdapterProps> = ({
  healthComponent,
  updateComponent,
  removeComponent,
  isPlaying,
}) => {
  const data = healthComponent?.data;

  if (!data) return null;

  // Convert ECS data to the format expected by HealthSection
  const healthData = {
    current: data.current ?? 100,
    maximum: data.maximum ?? 100,
    regenerationRate: data.regenerationRate ?? 0,
    isInvulnerable: data.isInvulnerable ?? false,
    lastDamageTime: data.lastDamageTime ?? 0,
  };

  const handleHealthUpdate = (newData: any) => {
    if (newData === null) {
      // Remove health component
      removeComponent(KnownComponentTypes.HEALTH);
    } else {
      // Update health component
      updateComponent(KnownComponentTypes.HEALTH, newData);
    }
  };

  return (
    <HealthSection
      healthData={healthData}
      onUpdate={handleHealthUpdate}
      onRemove={() => handleHealthUpdate(null)}
      isPlaying={isPlaying}
    />
  );
};
```

### Step 7: Update Inspector Hooks

Update `src/editor/hooks/useEntityComponents.ts`:

```typescript
// Add convenience computed value
const hasHealth = useMemo(
  () => components.some((c) => c.type === KnownComponentTypes.HEALTH),
  [components],
);

// Add getter method
const getHealth = useCallback(() => {
  return getComponent(KnownComponentTypes.HEALTH);
}, [getComponent]);

// Add to return object
return {
  // ... existing properties
  hasHealth, // 🆕 Add this
  getHealth, // 🆕 Add this
  // ... rest of properties
};
```

### Step 8: Update Inspector Data Hook

Update `src/editor/hooks/useInspectorData.ts`:

```typescript
export const useInspectorData = () => {
  const selectedEntity = useEditorStore((s) => s.selectedId);
  const isPlaying = useEditorStore((s) => s.isPlaying);

  const entityComponentsData = useEntityComponents(selectedEntity);

  return {
    selectedEntity,
    isPlaying,
    ...entityComponentsData, // This now includes hasHealth and getHealth
  };
};
```

### Step 9: Update Component List

Update `src/editor/components/inspector/sections/ComponentList.tsx`:

```typescript
// Import new adapter
import { HealthAdapter } from '@/editor/components/inspector/adapters/HealthAdapter';

// Add to interface
interface IComponentListProps {
  // ... existing props
  hasHealth: boolean;          // 🆕 Add this
  getHealth: () => any;        // 🆕 Add this
}

// Add to component props
export const ComponentList: React.FC<IComponentListProps> = ({
  // ... existing props
  hasHealth,                   // 🆕 Add this
  getHealth,                   // 🆕 Add this
}) => {
  return (
    <>
      {/* Existing components... */}

      {/* Health Component */}
      {hasHealth && (
        <HealthAdapter
          healthComponent={getHealth()}
          updateComponent={updateComponent}
          removeComponent={removeComponent}
          isPlaying={isPlaying}
        />
      )}
    </>
  );
};
```

### Step 10: Update Inspector Panel Content

Update `src/editor/components/panels/InspectorPanel/InspectorPanelContent/InspectorPanelContent.tsx`:

```typescript
export const InspectorPanelContent: React.FC = React.memo(() => {
  const {
    selectedEntity,
    isPlaying,
    components,
    hasTransform,
    hasMeshRenderer,
    hasRigidBody,
    hasMeshCollider,
    hasCamera,
    hasHealth,        // 🆕 Add this
    getTransform,
    getMeshRenderer,
    getRigidBody,
    getMeshCollider,
    getCamera,
    getHealth,        // 🆕 Add this
    addComponent,
    updateComponent,
    removeComponent,
  } = useInspectorData();

  // ... rest of component

  return (
    <div className="space-y-2 p-2 pb-4">
      <ComponentList
        selectedEntity={selectedEntity}
        isPlaying={isPlaying}
        hasTransform={hasTransform}
        hasMeshRenderer={hasMeshRenderer}
        hasRigidBody={hasRigidBody}
        hasMeshCollider={hasMeshCollider}
        hasCamera={hasCamera}
        hasHealth={hasHealth}        // 🆕 Add this
        getTransform={getTransform}
        getMeshRenderer={getMeshRenderer}
        getRigidBody={getRigidBody}
        getMeshCollider={getMeshCollider}
        getCamera={getCamera}
        getHealth={getHealth}        // 🆕 Add this
        addComponent={addComponent}
        updateComponent={updateComponent}
        removeComponent={removeComponent}
      />

      <DebugSection selectedEntity={selectedEntity} components={components} />
    </div>
  );
});
```

### Step 11: Add to Add Component Menu

Update `src/editor/components/menus/AddComponentMenu.tsx`:

```typescript
const COMPONENT_DEFINITIONS: IComponentDefinition[] = [
  // ... existing components
  {
    id: KnownComponentTypes.HEALTH,
    name: 'Health',
    description: 'Health and damage system',
    icon: <FiHeart className="w-4 h-4" />,
    category: 'Gameplay',
  },
];
```

## 💻 Creating a System (Recommended)

Systems process component data each frame. Create `src/core/systems/healthSystem.ts`:

```typescript
import { defineQuery } from 'bitecs';

import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { ECSWorld } from '@core/lib/ecs/World';
import { HealthData } from '@core/lib/ecs/components/definitions/HealthComponent';

// Get world instance
const world = ECSWorld.getInstance().getWorld();

// Lazy-initialize the query
let healthQuery: ReturnType<typeof defineQuery> | null = null;

function getHealthQuery() {
  if (!healthQuery) {
    const healthComponent = componentRegistry.getBitECSComponent('Health');
    if (!healthComponent) {
      console.warn('[healthSystem] Health component not yet registered, skipping update');
      return null;
    }
    healthQuery = defineQuery([healthComponent]);
  }
  return healthQuery;
}

/**
 * Health System - Processes health regeneration and status updates
 */
export function healthSystem(deltaTime: number): number {
  const query = getHealthQuery();
  if (!query) return 0;

  const entities = query(world);
  let updatedCount = 0;

  entities.forEach((eid: number) => {
    const healthData = componentRegistry.getComponentData<HealthData>(eid, 'Health');
    if (!healthData) return;

    // Skip if invulnerable or already at max health
    if (healthData.isInvulnerable || healthData.current >= healthData.maximum) {
      return;
    }

    // Apply health regeneration
    if (healthData.regenerationRate > 0) {
      const newHealth = Math.min(
        healthData.maximum,
        healthData.current + healthData.regenerationRate * deltaTime,
      );

      if (newHealth !== healthData.current) {
        componentRegistry.updateComponent(eid, 'Health', { current: newHealth });
        updatedCount++;
      }
    }
  });

  return updatedCount;
}
```

### Integrate System into Engine Loop

Update `src/core/components/EngineLoop.tsx`:

```typescript
// Import your system
import { healthSystem } from '../systems/healthSystem';

// In the useFrame callback, add:
useFrame((state, deltaTime) => {
  // ... existing systems

  // Run health system
  healthSystem(deltaTime);

  // ... rest of systems
});
```

## 🔗 System Integration for Real-time Updates

**IMPORTANT**: The guide above creates component data and UI, but to make changes actually reflect in the viewport/game, you need to create **systems** that read component data and apply it to the rendering/physics/game systems.

### Example: Camera Background System Integration

Here's how the Camera component integrates with the Three.js scene:

#### 1. Create a Hook for System Integration

`src/core/hooks/useCameraBackground.ts`:

```typescript
import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Color } from 'three';

export function useCameraBackground(
  clearFlags: string = 'skybox',
  backgroundColor?: { r: number; g: number; b: number; a: number },
) {
  const { scene } = useThree();
  const currentClearFlagsRef = useRef<string | null>(null);
  const currentBgColorRef = useRef<string | null>(null);

  useEffect(() => {
    const bgColorKey = backgroundColor
      ? `${backgroundColor.r}-${backgroundColor.g}-${backgroundColor.b}-${backgroundColor.a}`
      : null;

    // Check if anything has changed
    const clearFlagsChanged = currentClearFlagsRef.current !== clearFlags;
    const bgColorChanged = currentBgColorRef.current !== bgColorKey;

    if (!clearFlagsChanged && !bgColorChanged) return;

    // Apply the appropriate background based on clear flags
    switch (clearFlags) {
      case 'solidColor':
        if (backgroundColor) {
          scene.background = new Color(backgroundColor.r, backgroundColor.g, backgroundColor.b);
        } else {
          scene.background = new Color(0, 0, 0); // Black fallback
        }
        break;

      case 'skybox':
        scene.background = new Color('#87CEEB'); // Sky blue
        break;

      case 'depthOnly':
      case 'dontClear':
        scene.background = null;
        break;
    }

    // Update refs
    currentClearFlagsRef.current = clearFlags;
    currentBgColorRef.current = bgColorKey;
  }, [clearFlags, backgroundColor, scene]);
}
```

#### 2. Create a Manager Component

`src/core/components/cameras/CameraBackgroundManager.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { defineQuery } from 'bitecs';

import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { ECSWorld } from '@core/lib/ecs/World';
import { useCameraBackground } from '@core/hooks/useCameraBackground';

export const CameraBackgroundManager: React.FC = () => {
  const [clearFlags, setClearFlags] = useState<string>('skybox');
  const [backgroundColor, setBackgroundColor] = useState<
    { r: number; g: number; b: number; a: number } | undefined
  >();

  const world = ECSWorld.getInstance().getWorld();

  useEffect(() => {
    const updateFromMainCamera = () => {
      const cameraComponent = componentRegistry.getBitECSComponent('Camera');
      if (!cameraComponent) return;

      const query = defineQuery([cameraComponent]);
      const entities = query(world);

      // Find the main camera
      let mainCameraEntity = entities.find((eid) => {
        const cameraData = componentRegistry.getComponentData(eid, 'Camera');
        return cameraData?.isMain;
      });

      // If no main camera found, use the first camera
      if (!mainCameraEntity && entities.length > 0) {
        mainCameraEntity = entities[0];
      }

      if (mainCameraEntity) {
        const cameraData = componentRegistry.getComponentData(mainCameraEntity, 'Camera');
        if (cameraData) {
          setClearFlags(cameraData.clearFlags);
          setBackgroundColor(cameraData.backgroundColor);
        }
      }
    };

    // Update immediately and then poll for changes
    updateFromMainCamera();
    const interval = setInterval(updateFromMainCamera, 100);

    return () => clearInterval(interval);
  }, [world]);

  // Use the hook to actually apply the changes to the scene
  useCameraBackground(clearFlags, backgroundColor);

  return null; // This component doesn't render anything
};
```

#### 3. Integrate into Viewport

Add the manager to your Canvas in `ViewportPanel.tsx`:

```typescript
import { CameraBackgroundManager } from '@/core/components/cameras/CameraBackgroundManager';

// Inside your Canvas:
<Canvas>
  {/* Other components */}
  <CameraBackgroundManager />
  {/* Rest of your scene */}
</Canvas>
```

### General Pattern for System Integration

For any component that affects the 3D scene or game state:

1. **Create a Hook** (`useComponentName.ts`) that:

   - Takes component data as parameters
   - Uses Three.js hooks (`useThree`, `useFrame`) to apply changes
   - Optimizes with refs to avoid unnecessary updates

2. **Create a Manager Component** (`ComponentNameManager.tsx`) that:

   - Queries ECS for entities with your component
   - Extracts the relevant data
   - Passes it to your hook

3. **Add Manager to Scene** in `ViewportPanel.tsx` or `EngineLoop.tsx`

4. **Remove Hardcoded Values** that might override your component data

This pattern ensures that:

- ✅ UI changes immediately reflect in the viewport
- ✅ Component data drives the actual game/rendering behavior
- ✅ Multiple entities can have the same component type
- ✅ Main/primary entities can be prioritized
- ✅ Performance is optimized with change detection

## 🔗 Using Components in Game Code

### Using the Component Registry Hook

```typescript
import { useComponentRegistry } from '@/core/hooks/useComponentRegistry';

function MyGameComponent() {
  const { addComponent, getComponentData, updateComponent } = useComponentRegistry();

  const handleDamage = (entityId: number, damage: number) => {
    const healthData = getComponentData<HealthData>(entityId, 'Health');
    if (healthData && !healthData.isInvulnerable) {
      const newHealth = Math.max(0, healthData.current - damage);
      updateComponent(entityId, 'Health', {
        current: newHealth,
        lastDamageTime: Date.now()
      });
    }
  };

  return (
    // Your component JSX
  );
}
```

### Using Entity Creation Hook

```typescript
import { useEntityCreation } from '@/editor/hooks/useEntityCreation';
import { useComponentManager } from '@/editor/hooks/useComponentManager';

function CreateEnemyButton() {
  const { createCube } = useEntityCreation();
  const componentManager = useComponentManager();

  const createEnemy = () => {
    // Create cube entity (comes with Transform and MeshRenderer)
    const enemy = createCube('Enemy');

    // Add health component
    componentManager.addComponent(enemy.id, 'Health', {
      current: 100,
      maximum: 100,
      regenerationRate: 1,
      isInvulnerable: false,
    });

    // Add physics components
    componentManager.addComponent(enemy.id, 'RigidBody', {
      enabled: true,
      bodyType: 'dynamic',
      mass: 1,
      gravityScale: 1,
      canSleep: true,
      material: { friction: 0.7, restitution: 0.3, density: 1 }
    });
  };

  return <button onClick={createEnemy}>Create Enemy</button>;
}
```

## 🧪 Testing Your Component

### 1. Runtime Testing

```typescript
// In your game code or tests
import { useComponentRegistry } from '@/core/hooks/useComponentRegistry';

const { addComponent, getComponentData, updateComponent } = useComponentRegistry();

// Add health component to an entity
addComponent(entityId, 'Health', {
  current: 80,
  maximum: 100,
  regenerationRate: 2.5,
  isInvulnerable: false,
});

// Read component data
const healthData = getComponentData(entityId, 'Health');
console.log(healthData); // { current: 80, maximum: 100, ... }

// Update component
updateComponent(entityId, 'Health', { current: 50 });
```

### 2. Inspector Testing

1. Run the editor: `yarn dev`
2. Create an entity in the scene
3. Select the entity in the hierarchy
4. Click "Add Component" in the inspector
5. Choose your new "Health" component
6. Verify the UI renders correctly
7. Test field updates and validation

## 🎯 Best Practices

### Component Design

- **Single Responsibility**: Each component should have one clear purpose
- **Data-Oriented**: Store only data, not behavior (use systems for logic)
- **Immutable Updates**: Always create new objects when updating
- **Validation**: Use Zod schemas for runtime validation

### Performance Considerations

- **BitECS Fields**: Use appropriate data types (`Types.f32` for floats, `Types.ui8` for booleans)
- **Serialization**: Keep serialize/deserialize functions simple and fast
- **Memory**: Avoid storing large objects directly in components

### UI Guidelines

- **Consistent Styling**: Follow existing component UI patterns
- **Responsive Fields**: Use appropriate input types for different data
- **Visual Feedback**: Provide immediate feedback for user interactions
- **Error Handling**: Handle invalid input gracefully

## 🔄 Component Lifecycle

```mermaid
graph TD
    A[Component Definition] --> B[Register in System]
    B --> C[Add to Entity]
    C --> D[Serialize to BitECS]
    D --> E[System Processing]
    E --> F[UI Updates]
    F --> G[User Interaction]
    G --> H[Deserialize from BitECS]
    H --> I[Component Update]
    I --> E
    I --> J[Remove Component]
    J --> K[Cleanup]
```

## 📚 Advanced Features

### Component Dependencies

```typescript
export const myComponent = ComponentFactory.create({
  // ... other config
  dependencies: ['Transform', 'MeshRenderer'], // Required components
  conflicts: ['Camera'], // Incompatible components
});
```

### Component Events

```typescript
// Listen for component events
useEvent('component:added', (event) => {
  if (event.componentId === 'Health') {
    console.log(`Health component added to entity ${event.entityId}`);
  }
});
```

### Dynamic Component Loading

```typescript
// Runtime component registration
const dynamicComponent = ComponentFactory.create({
  // ... component definition
});

componentRegistry.register(dynamicComponent);
```

## 🚀 Next Steps

After implementing your component:

1. **Write Tests**: Add unit tests for your component logic
2. **Create Systems**: Build systems that process your component data
3. **Add Documentation**: Document your component's purpose and usage
4. **Performance Profile**: Test with many entities to ensure performance
5. **Share**: Consider contributing useful components back to the core

## 🔗 Related Files

- **Core System**: `src/core/lib/ecs/ComponentRegistry.ts`
- **Component Definitions**: `src/core/lib/ecs/components/definitions/`
- **Inspector System**: `src/editor/components/inspector/`
- **Example Components**: `src/core/lib/ecs/components/ComponentDefinitions.ts`

## ✅ Component Integration Checklist

Use this checklist to ensure you haven't missed any steps:

### Core Component Definition

- [ ] Created component definition file in `src/core/lib/ecs/components/definitions/`
- [ ] Defined Zod schema for validation
- [ ] Used `ComponentFactory.create()` with proper BitECS field mappings
- [ ] Implemented serialize/deserialize functions
- [ ] Added component to `definitions/index.ts` exports
- [ ] Registered component in `ComponentDefinitions.ts`
- [ ] Added component ID to `KnownComponentTypes` enum

### Inspector Integration

- [ ] Created UI section component in `src/editor/components/panels/InspectorPanel/YourComponent/`
- [ ] Created adapter component in `src/editor/components/inspector/adapters/`
- [ ] Added component props to `useEntityComponents` hook
- [ ] Updated `ComponentList.tsx` to render your component
- [ ] Updated inspector panel content to pass component data
- [ ] Added component to `AddComponentMenu.tsx`

### System Integration (Optional)

- [ ] Created system file in `src/core/systems/`
- [ ] Integrated system into `EngineLoop.tsx`
- [ ] Tested system performance with many entities

### Testing & Validation

- [ ] Component appears in Add Component menu
- [ ] Component UI renders correctly in inspector
- [ ] Component data updates correctly
- [ ] Component validation works (try invalid data)
- [ ] Component removal works properly
- [ ] No console errors during normal usage

## 🚨 Common Issues & Troubleshooting

### "Component not found" Errors

```typescript
// Problem: Component not registered
console.error('Component Health not found');

// Solution: Check registration in ComponentDefinitions.ts
export function registerCoreComponents(): void {
  // ... other components
  componentRegistry.register(healthComponent); // Make sure this is present
}
```

### Inspector Not Showing Component

```typescript
// Problem: Missing in ComponentList or useEntityComponents
// Solution: Check these files for your component:

// 1. useEntityComponents.ts - Add computed value
const hasHealth = useMemo(
  () => components.some((c) => c.type === KnownComponentTypes.HEALTH),
  [components],
);

// 2. ComponentList.tsx - Add rendering
{hasHealth && (
  <HealthAdapter
    healthComponent={getHealth()}
    updateComponent={updateComponent}
    removeComponent={removeComponent}
    isPlaying={isPlaying}
  />
)}
```

### Serialization/Deserialization Issues

```typescript
// Problem: Data not persisting correctly
// Solution: Check field mappings match schema

// Schema defines:
const HealthSchema = z.object({
  current: z.number(),
  maximum: z.number(),
});

// Fields must match:
fields: {
  current: Types.f32,  // ✅ Matches
  maximum: Types.f32,  // ✅ Matches
  // missing: Types.f32  // ❌ Would cause issues
}
```

### Performance Issues

```typescript
// Problem: System running too often
// Solution: Add performance optimizations

export function healthSystem(deltaTime: number): number {
  // Use throttling for expensive operations
  const now = performance.now();
  if (now - lastUpdateTime < 16) return 0; // 60fps max

  // Only update entities that need updates
  entities.forEach((eid: number) => {
    if (shouldSkipEntity(eid)) return;
    // ... process entity
  });
}
```

### TypeScript Errors

```typescript
// Problem: Type mismatches
// Solution: Ensure consistent types

// Component definition
export type HealthData = z.infer<typeof HealthSchema>;

// Usage in systems/hooks
const healthData = getComponentData<HealthData>(eid, 'Health');
//                                 ^^^^^^^^^^^ Use the exported type
```

## 🎯 Advanced Patterns

### Component Composition

```typescript
// Create compound components that depend on others
export const characterComponent = ComponentFactory.create({
  dependencies: ['Transform', 'Health', 'MeshRenderer'],
  // ... rest of definition
});
```

### Component Events

```typescript
// Listen for component lifecycle events
import { useEvent } from '@/core/hooks/useEvent';

useEvent('component:added', (event) => {
  if (event.componentId === 'Health') {
    console.log(`Health component added to entity ${event.entityId}`);
  }
});
```

### Dynamic Component Loading

```typescript
// Register components at runtime
const dynamicComponent = ComponentFactory.create({
  id: 'DynamicComponent',
  // ... definition
});

componentRegistry.register(dynamicComponent);
```

## 📈 Performance Considerations

### Memory Efficiency

- Use appropriate BitECS types (`Types.ui8` for booleans, not `Types.f32`)
- Avoid storing large objects directly in components
- Use entity IDs to reference other entities instead of storing references

### System Optimization

- Use queries efficiently (cache them, don't recreate each frame)
- Process only entities that need updates
- Consider using different update frequencies for different systems

### UI Performance

- Use `React.memo()` for component UI sections
- Debounce user input for expensive updates
- Only re-render inspector sections when data actually changes

---

**Happy Component Building!** 🎉

This guide covers the complete end-to-end pipeline from component definition to inspector visualization, including systems integration and practical usage patterns. The modular architecture makes it easy to add new components while maintaining type safety and performance.
