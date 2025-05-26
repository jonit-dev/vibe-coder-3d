# Dynamic Component System

## Overview

### Context & Goals

- **Flexibility**: Enable entities to have only the components they actually need, rather than forcing all entities to support all components
- **Performance**: Reduce memory usage and improve cache efficiency by avoiding unused component data
- **Scalability**: Support a growing ecosystem of components without bloating every entity
- **AI Integration**: Allow the AI Copilot to dynamically add/remove components based on natural language commands

### Current Pain Points

- All entities are created with core components (`Transform`, `MeshType`, `Material`) regardless of need
- Adding new components requires manual updates to entity creation logic
- No standardized way to define component dependencies or compatibility
- Limited support for optional components that can be added at runtime

## ✅ Current Implementation Status

### 🎯 Phase 1: Component Registry Foundation (COMPLETE)

**Core Files Created:**

- `src/core/types/component-registry.ts` - Type definitions and validation schemas
- `src/core/lib/component-registry.ts` - Central component registration system
- `src/core/lib/dynamic-components.ts` - Runtime component management
- `src/core/lib/built-in-components.ts` - Registration of existing ECS components
- `src/core/hooks/useComponent.ts` - React hooks for component management

**Key Features:**

- ✅ **Component Categories**: Core, Rendering, Physics, Gameplay, AI, Audio, UI, Network
- ✅ **Validation System**: Zod schemas for component data validation
- ✅ **Dependency Management**: Automatic dependency resolution and conflict detection
- ✅ **Event System**: Real-time component change notifications
- ✅ **Type Safety**: Full TypeScript support with strict typing

### 🏗️ Phase 2: Entity Archetypes (COMPLETE)

**Core Files Created:**

- `src/core/lib/entity-archetypes.ts` - Entity template system

**Built-in Archetypes:**

- ✅ **Static Mesh**: Basic 3D object with rendering
- ✅ **Physics Entity**: 🆕 **Default physics-enabled object (NEW)**
- ✅ **Dynamic Object**: Moving object with velocity
- ✅ **Physics Body**: Full physics simulation with collision and velocity
- ✅ **Trigger Zone**: Invisible collision detection area
- ✅ **Basic Entity**: Minimal entity with core components

**Key Features:**

- ✅ **Template-based Creation**: Predefined component sets for common entity types
- ✅ **Default Values**: Pre-configured component data for instant usability
- ✅ **Validation**: Ensure archetype integrity and component compatibility
- ✅ **Physics by Default**: New entities now include rigid body and collision detection

### 🎮 Phase 3: Unity-like UI Implementation (COMPLETE + ENHANCED)

**Core Files Created:**

- `src/editor/components/ui/AddComponentMenu.tsx` - Unity-style component browser
- `src/editor/components/ui/DynamicComponentDemo.tsx` - Demo component for testing
- `src/core/lib/component-groups.ts` - 🆕 **Component grouping system (NEW)**

**Updated Files:**

- `src/editor/components/panels/InspectorPanel/InspectorPanelContent.tsx` - Integrated Add Component button
- `src/editor/Editor.tsx` - System initialization with physics-by-default
- `src/core/index.ts` - Export all dynamic component APIs

**UI Features:**

- ✅ **Category-based Navigation**: Browse components by type (Physics, Rendering, etc.)
- ✅ **Search Functionality**: Find components by name or description
- ✅ **Validation Display**: Show warnings and errors before adding components
- ✅ **Dependency Resolution**: Automatically add required dependencies
- ✅ **Real-time Updates**: UI updates automatically when components change
- ✅ **Debug Panel**: Development-time component inspection
- ✅ **Component Packages**: 🆕 **Group related components for easy addition (NEW)**

## 🆕 New Features Added

### 1. **Physics-by-Default Entity Creation**

- **New entities automatically include physics components** (rigid body + mesh collider)
- **Exception**: Planes remain static for ground/platform use
- **Fallback system**: If archetype creation fails, falls back to basic entity creation
- **Default positioning**: Physics entities start slightly elevated to demonstrate physics

### 2. **Component Groups/Packages System**

**Built-in Component Groups:**

- ⚛️ **Physics Package**: Complete physics simulation (rigid body + mesh collider)
- 🏃 **Movement Package**: Velocity-based movement + physics simulation
- 🚪 **Trigger Package**: Invisible trigger zone setup
- 🎨 **Rendering Package**: Complete rendering with materials and shadows

**Features:**

- **One-click addition**: Add multiple related components at once
- **Smart defaults**: Pre-configured values for instant usability
- **Validation**: Ensures all group components can be added
- **Visual grouping**: Clear separation between packages and individual components

### 3. **Enhanced Dependency System**

- **Rigid Body → Mesh Collider**: Adding rigid body automatically adds mesh collider
- **Intelligent collider selection**: Auto-selects appropriate collider type based on mesh shape
- **Unified physics materials**: Consistent physics properties across related components

## 🔄 Updated Component Relationships

### Automatic Dependencies

```typescript
rigidBody: ['transform', 'meshCollider']; // Rigid body now requires mesh collider
meshCollider: ['transform', 'meshType'];
meshRenderer: ['transform', 'meshType', 'material'];
velocity: ['transform'];
```

### Component Groups

```typescript
'physics-group': ['rigidBody', 'meshCollider']
'movement-group': ['velocity', 'rigidBody', 'meshCollider']
'trigger-group': ['meshCollider'] // with isTrigger: true
'rendering-group': ['meshRenderer']
```

## 🎯 How It Works Now

### Default Entity Creation

```typescript
// OLD: Creating basic entities
const entity = ecsManager.createEntity({ meshType });

// NEW: Creating physics-enabled entities by default
const entity = await ArchetypeManager.createEntity('physics-entity', {
  meshType: { type: meshType },
});
// Automatically includes: transform, meshType, material, meshRenderer, rigidBody, meshCollider
```

### Component Group Usage

1. **Select Entity** → Inspector shows current components
2. **Click "Add Component"** → Opens enhanced component browser
3. **Choose Category** → See both packages and individual components
4. **Select Package** → Adds multiple related components with one click
5. **Auto-dependencies** → Related components added automatically

### Physics Integration

- **Rigid Body + Mesh Collider**: Added together automatically
- **Smart collider types**: Box for cubes, sphere for spheres, etc.
- **Unified materials**: Consistent friction, restitution, and density values
- **Default physics values**: Balanced for realistic simulation

## 🚀 Current Status

### ✅ Working Features

- Component registry and validation system
- Dynamic component addition/removal with automatic dependencies
- Unity-like Add Component UI with categories, search, and packages
- Entity archetypes with physics-by-default
- Component groups for related functionality
- React hooks for component management
- Integration with existing editor systems
- Debug panel for development
- **Physics-enabled entities by default**
- **One-click component packages**
- **Automatic rigid body + collider pairing**

### 🔄 Next Steps (Future Implementation)

- **Custom Component Definition**: User-defined components at runtime
- **Component Editor**: Visual component property editing
- **Archetype Editor**: Create custom archetypes in the editor
- **AI Integration**: Natural language component commands
- **Performance Optimization**: Component pooling and batch operations

## 📁 File Structure Summary

```
src/core/
├── types/
│   └── component-registry.ts          # Types and validation schemas
├── lib/
│   ├── component-registry.ts          # Component registration system
│   ├── dynamic-components.ts          # Runtime component management
│   ├── built-in-components.ts         # Built-in component registrations (updated)
│   ├── entity-archetypes.ts           # Entity template system (enhanced)
│   └── component-groups.ts            # 🆕 Component grouping system (NEW)
├── hooks/
│   └── useComponent.ts                # React hooks for components
└── index.ts                           # Public API exports (updated)

src/editor/
├── components/
│   ├── ui/
│   │   ├── AddComponentMenu.tsx       # Unity-like component browser (enhanced)
│   │   └── DynamicComponentDemo.tsx   # Demo component
│   └── panels/InspectorPanel/
│       └── InspectorPanelContent.tsx  # Updated with enhanced Add Component
└── Editor.tsx                         # System initialization (updated)
```

## Technical Architecture

### Component Registry

```typescript
// src/core/lib/component-registry.ts
export interface IComponentDescriptor<T = any> {
  id: string;
  name: string;
  category: ComponentCategory;
  component: any; // bitecs component
  dependencies?: string[];
  conflicts?: string[];
  schema: z.ZodSchema<T>;
  serialize: (entityId: number) => T | undefined;
  deserialize: (entityId: number, data: T) => void;
  onAdd?: (entityId: number) => void;
  onRemove?: (entityId: number) => void;
  required?: boolean;
  metadata?: {
    description?: string;
    version?: string;
    author?: string;
  };
}

export enum ComponentCategory {
  Core = 'core', // Transform, Name
  Rendering = 'rendering', // Material, MeshType
  Physics = 'physics', // Velocity, RigidBody
  Gameplay = 'gameplay', // Health, Inventory
  AI = 'ai', // AIAgent, Behavior
  Audio = 'audio', // AudioSource, AudioListener
  UI = 'ui', // UIElement, Canvas
  Network = 'network', // NetworkSync, PlayerInput
}

export class ComponentRegistry {
  private static instance: ComponentRegistry;
  private components: Map<string, IComponentDescriptor> = new Map();

  registerComponent<T>(descriptor: IComponentDescriptor<T>): void;
  unregisterComponent(id: string): void;
  getComponent(id: string): IComponentDescriptor | undefined;
  getComponentsByCategory(category: ComponentCategory): IComponentDescriptor[];
  validateDependencies(componentIds: string[]): ValidationResult;
  resolveDependencies(componentIds: string[]): string[];
}
```

### Entity Archetypes

```typescript
// src/core/lib/entity-archetypes.ts
export interface IEntityArchetype {
  id: string;
  name: string;
  description?: string;
  components: string[]; // Component IDs
  defaultValues?: Record<string, any>;
  validation?: (data: any) => boolean;
}

export class ArchetypeManager {
  private static archetypes: Map<string, IEntityArchetype> = new Map();

  static registerArchetype(archetype: IEntityArchetype): void;
  static createEntity(archetypeId: string, overrides?: any): number;
  static getArchetype(id: string): IEntityArchetype | undefined;
  static listArchetypes(): IEntityArchetype[];
}

// Built-in archetypes
export const BUILT_IN_ARCHETYPES: IEntityArchetype[] = [
  {
    id: 'static-mesh',
    name: 'Static Mesh',
    components: ['transform', 'meshType', 'material'],
  },
  {
    id: 'dynamic-object',
    name: 'Dynamic Object',
    components: ['transform', 'meshType', 'material', 'velocity'],
  },
  {
    id: 'physics-body',
    name: 'Physics Body',
    components: ['transform', 'meshType', 'material', 'velocity', 'rigidBody'],
  },
  {
    id: 'character',
    name: 'Character',
    components: ['transform', 'meshType', 'material', 'velocity', 'health', 'input'],
  },
];
```

### Dynamic Component Manager

```typescript
// src/core/lib/dynamic-components.ts
export class DynamicComponentManager {
  private static instance: DynamicComponentManager;

  addComponent(entityId: number, componentId: string, data?: any): Promise<boolean>;
  removeComponent(entityId: number, componentId: string): Promise<boolean>;
  hasComponent(entityId: number, componentId: string): boolean;
  getEntityComponents(entityId: number): string[];
  validateComponentAddition(entityId: number, componentId: string): ValidationResult;

  private resolveDependencies(entityId: number, componentId: string): void;
  private checkConflicts(entityId: number, componentId: string): string[];
  private notifyComponentChange(
    entityId: number,
    componentId: string,
    action: 'add' | 'remove',
  ): void;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingDependencies?: string[];
  conflicts?: string[];
}
```

## API Reference & Usage Examples

### Registering a Custom Component

```typescript
import { ComponentRegistry, ComponentCategory } from '@core/lib/component-registry';

// Register a Health component
componentRegistry.registerComponent({
  id: 'health',
  name: 'Health',
  category: ComponentCategory.Gameplay,
  component: HealthComponent,
  schema: z.object({
    current: z.number().min(0),
    maximum: z.number().min(1),
    regeneration: z.number().min(0).default(0),
  }),
  serialize: (entityId) => ({
    current: HealthComponent.current[entityId],
    maximum: HealthComponent.maximum[entityId],
    regeneration: HealthComponent.regeneration[entityId],
  }),
  deserialize: (entityId, data) => {
    HealthComponent.current[entityId] = data.current;
    HealthComponent.maximum[entityId] = data.maximum;
    HealthComponent.regeneration[entityId] = data.regeneration;
  },
  onAdd: (entityId) => {
    console.log(`Health component added to entity ${entityId}`);
  },
});
```

### Creating Entities with Archetypes

```typescript
import { ArchetypeManager } from '@core/lib/entity-archetypes';

// Create a character entity
const characterId = ArchetypeManager.createEntity('character', {
  transform: { position: [0, 1, 0] },
  health: { current: 100, maximum: 100 },
});

// Create a static mesh
const meshId = ArchetypeManager.createEntity('static-mesh', {
  material: { color: [1, 0, 0] },
});
```

### Dynamic Component Management

```typescript
import { DynamicComponentManager } from '@core/lib/dynamic-components';

const componentManager = DynamicComponentManager.getInstance();

// Add a component at runtime
await componentManager.addComponent(entityId, 'velocity', {
  linear: [0, 0, 0],
  angular: [0, 0, 0],
});

// Remove a component
await componentManager.removeComponent(entityId, 'velocity');

// Check validation before adding
const validation = componentManager.validateComponentAddition(entityId, 'rigidBody');
if (validation.valid) {
  await componentManager.addComponent(entityId, 'rigidBody');
} else {
  console.error('Cannot add component:', validation.errors);
}
```

## 🎮 How to Use

1. **Start the Editor** → Dynamic component system initializes automatically
2. **Add Object** → Creates physics-enabled entity by default (except planes)
3. **Select Entity** → Inspector shows current components with enhanced UI
4. **Click "Add Component"** → Browse by category or search
5. **Choose Package** → Add multiple related components at once
6. **Individual Components** → Still available for fine-grained control
7. **Automatic Dependencies** → System handles component relationships

## 🎯 Key Improvements Made

1. **Physics by Default**: All new 3D objects (except planes) are physics-enabled
2. **Component Packages**: Grouped related components for easier addition
3. **Smart Dependencies**: Rigid body automatically includes mesh collider
4. **Unified UI**: Enhanced component browser with clear categorization
5. **Better Defaults**: Pre-configured values for instant usability
6. **Automatic Fallbacks**: Graceful degradation if archetype creation fails

The system now provides a much more Unity-like experience where physics simulation is the default, and users can easily add complex functionality with single clicks while still maintaining fine-grained control when needed!
