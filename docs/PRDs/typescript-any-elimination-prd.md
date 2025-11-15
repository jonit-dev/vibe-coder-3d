# TypeScript `any` Type Elimination PRD

## Overview

### Context & Goals

- **Current State**: The codebase has 328 instances of `any` types across 855 TypeScript files, violating the project's strict type safety standards documented in `CLAUDE.md`.
- **Goal**: Systematically eliminate all `any` types and replace them with proper TypeScript types to improve type safety, maintainability, and developer experience.
- **Scope**: This is a refactoring effort that should preserve all existing functionality while improving type correctness.
- **Risk Management**: Batch approach prevents regressions by allowing testing between each phase.

### Current Pain Points

- **Type Safety Violations**: `any` types bypass TypeScript's type checking, hiding potential runtime errors.
- **Developer Experience**: Loss of IDE autocomplete and IntelliSense in areas using `any`.
- **Code Quality**: Direct violation of project standards ("ALWAYS use proper TypeScript types - no `any` types").
- **Maintenance Burden**: Future refactoring is harder when types are not explicit.

## Proposed Solution

### High-level Summary

- **Strategic Batching**: Group related files by domain/module to fix together, ensuring internal consistency.
- **Prioritization**: Start with foundational types (DI container, module declarations) that affect many downstream files.
- **Test Coverage**: Run full test suite after each batch to catch regressions immediately.
- **Type Definitions**: Create proper interfaces and type aliases where needed.
- **Incremental Approach**: 6 phases with clear boundaries and validation steps.

### Architecture & Directory Structure

```
src/
├── core/
│   ├── lib/
│   │   ├── di/Container.ts                    [Phase 1: Foundation]
│   │   └── ecs/                               [Phase 2: ECS Core]
│   ├── components/                            [Phase 3: Components]
│   ├── systems/AnimationSystem.ts             [Phase 4: Systems]
│   └── hooks/                                 [Phase 3: Components]
├── editor/                                     [Phase 5: Editor]
├── plugins/                                    [Phase 6: Plugins]
└── types/
    └── modules.d.ts                           [Phase 1: Foundation]
```

## Effort vs Impact Matrix

### Priority Quadrants

This matrix helps prioritize phases based on effort (time investment) and impact (value delivered):

```mermaid
quadrantChart
    title TypeScript Any Elimination - Effort vs Impact Matrix
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    quadrant-1 "Quick Wins"
    quadrant-2 "Major Projects"
    quadrant-3 "Fill-ins"
    quadrant-4 "Hard Slogs"

    Phase 1 - Foundation: [0.2, 0.95]
    Phase 2 - ECS Core: [0.5, 0.85]
    Phase 3 - Components: [0.5, 0.70]
    Phase 4 - Systems: [0.3, 0.60]
    Phase 5 - Editor: [0.6, 0.50]
    Phase 6 - Plugins: [0.3, 0.30]
```

### Phase Prioritization Analysis

| Phase                   | Effort      | Impact        | Priority           | Rationale                                                                                                            |
| ----------------------- | ----------- | ------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Phase 1: Foundation** | Low (0.5d)  | **Very High** | **1st - CRITICAL** | Affects all downstream modules; enables IDE autocomplete globally; fixes 31 instances affecting 100+ dependent files |
| **Phase 2: ECS Core**   | Medium (1d) | **Very High** | **2nd - CRITICAL** | Core architecture; 54 instances; improves component registration, serialization safety, and runtime stability        |
| **Phase 3: Components** | Medium (1d) | **High**      | **3rd - HIGH**     | User-facing safety; 15 instances; prevents prop-drilling bugs and improves component API clarity                     |
| **Phase 4: Systems**    | Low (0.5d)  | **Medium**    | **4th - MEDIUM**   | Animation/physics safety; 42+ instances; prevents state machine bugs but less critical than core                     |
| **Phase 5: Editor**     | High (1d)   | **Medium**    | **5th - MEDIUM**   | Developer UX; 80+ instances; improves authoring experience but doesn't affect runtime                                |
| **Phase 6: Plugins**    | Low (0.5d)  | **Low**       | **6th - LOW**      | Build-time only; 90+ instances; least critical as errors caught during development                                   |

### Recommended Execution Order

Based on the effort/impact analysis, execute in this order:

**Week 1 - Critical Foundation (2 days)**:

1. **Day 1 Morning**: Phase 1 - Foundation (0.5d) → **Highest ROI**

   - Unlocks type inference across entire codebase
   - Fixes DI container, enabling typed service resolution
   - Small effort, massive impact

2. **Day 1 Afternoon - Day 2**: Phase 2 - ECS Core (1d) → **Second Highest ROI**
   - Establishes type safety for component system
   - Prevents serialization bugs (critical for Rust integration)
   - Medium effort, very high impact

**Week 1-2 - High Value (1.5 days)**: 3. **Day 3**: Phase 3 - Components (1d)

- Improves React component safety
- Better developer experience with prop types
- Medium effort, high impact

4. **Day 3 Afternoon**: Phase 4 - Systems (0.5d)
   - Animation and physics type safety
   - Prevents state machine bugs
   - Low effort, medium impact (good quick win after Day 3)

**Week 2 - Polish (1.5 days)**: 5. **Day 4**: Phase 5 - Editor (1d)

- Editor UX improvements
- Largest batch but least critical
- Can be done in parallel with other work

6. **Day 5**: Phase 6 - Plugins (0.5d)
   - Build system cleanup
   - Nice-to-have, do last

### Alternative "Critical Path Only" Strategy

If time is limited, execute only the **high-impact phases**:

**Minimum Viable Fix (2.5 days)**:

- Phase 1: Foundation (0.5d) - **MUST DO**
- Phase 2: ECS Core (1d) - **MUST DO**
- Phase 3: Components (1d) - **SHOULD DO**

This covers 100 of the 328 instances (30%) but addresses the most critical type safety issues affecting runtime stability and core architecture.

**Remaining phases** can be done as time permits or as separate PRs.

### Impact Scoring Breakdown

**Very High Impact (90-100 points)**:

- ✅ Affects core runtime behavior
- ✅ Enables type inference for 100+ dependent files
- ✅ Prevents critical bugs (serialization, DI resolution)
- ✅ Improves IDE experience globally

**High Impact (70-89 points)**:

- ✅ Affects user-facing components
- ✅ Prevents prop-drilling bugs
- ✅ Improves component API clarity

**Medium Impact (50-69 points)**:

- ✅ Affects specific systems (animation, editor)
- ✅ Improves developer experience
- ❌ Not critical for runtime stability

**Low Impact (< 50 points)**:

- ❌ Build-time only
- ❌ Errors already caught during development
- ❌ Low frequency of modification

### Effort Scoring Breakdown

**Low Effort (< 0.5 days)**:

- Small number of files (1-3)
- Clear patterns to follow
- Minimal dependencies

**Medium Effort (0.5-1 day)**:

- Moderate number of files (4-10)
- Some complex type relationships
- Multiple sub-systems

**High Effort (> 1 day)**:

- Large number of files (10+)
- Complex type interdependencies
- Requires extensive testing

## Implementation Plan

### Phase 1: Foundation Types (0.5 day)

**Priority**: CRITICAL - These types affect all other modules

**Files** (31 `any` instances):

1. `src/types/modules.d.ts` (24 instances)
2. `src/core/lib/di/Container.ts` (7 instances)

**Tasks**:

1. Create proper type definitions for module imports in `modules.d.ts`
   - Define `ISceneContext` interface properly
   - Type `sceneRegistry` with proper interface
   - Create types for descriptor objects (script, component, system, prefab)
   - Type asset service methods properly
2. Fix DI container generic constraints in `Container.ts`
   - Replace `Constructor<T = object>` any[] with proper constructor signature
   - Fix `Factory<T>` to use generic parameter types
   - Type `IServiceDefinition` without `any` default
   - Fix `has()` method parameter type
3. Validation:
   - Run `yarn typecheck`
   - Run `yarn lint`
   - Verify no new type errors introduced

**Acceptance Criteria**:

- Zero `any` types in foundation files
- All downstream files still compile
- DI container maintains full type inference

---

### Phase 2: ECS Core Types (1 day)

**Priority**: HIGH - Core architecture that affects many components

**Files** (54 `any` instances):

1. `src/core/lib/ecs/adapters/IndexEventAdapter.ts` (2 instances)
2. `src/core/lib/ecs/components/accessors/ComponentAccessors.ts` (2 instances)
3. `src/core/lib/ecs/components/definitions/` (24 instances across 7 files):
   - `CameraComponent.ts` (2)
   - `InstancedComponent.ts` (4)
   - `LightComponent.ts` (2)
   - `MeshColliderComponent.ts` (2)
   - `PrefabInstanceComponent.ts` (2)
   - `RigidBodyComponent.ts` (2)
   - `ScriptComponent.ts` (4)
   - `TransformComponent.ts` (2)
   - `SceneComponent.ts` (2)
   - `MeshComponent.ts` (2)
4. `src/core/lib/ecs/core/EntityManager.ts` (multiple instances)
5. `src/core/lib/ecs/systems/` (component system integration)

**Tasks**:

1. Define proper event types for IndexEventAdapter
2. Create strongly-typed component accessor patterns
3. For each component definition:
   - Create proper Zod schemas with explicit types
   - Type `fromJSON` methods properly
   - Type `toJSON` return values
   - Fix component factory function signatures
4. Create generic types for ECS patterns:
   - `IComponentFactory<TData, TComponent>`
   - `IComponentSerializer<TData>`
   - `IEventPayload<TType, TData>`
5. Validation:
   - Run full ECS test suite
   - Verify component registration
   - Test scene serialization/deserialization

**Acceptance Criteria**:

- All ECS components have proper type definitions
- Component factories are fully typed
- Serialization preserves types
- No type errors in entity/component operations

---

### Phase 3: React Components & Hooks (1 day)

**Priority**: HIGH - User-facing code with safety implications

**Files** (15 `any` instances):

1. `src/core/components/cameras/` (3 files, 6 instances)
   - `CameraControlsManager.tsx` (2)
   - `CameraFollowManager.tsx` (1)
   - `GameCameraManager.tsx` (3)
2. `src/core/components/physics/PhysicsBody.tsx` (2 instances)
3. `src/core/hooks/useGameEngineControls.ts` (1 instance)
4. `src/editor/components/` (multiple files)
5. `src/editor/hooks/` (multiple files)

**Tasks**:

1. Type camera-related component props:
   - Define `ICameraControlsConfig` interface
   - Type camera state management hooks
   - Fix ref types for Three.js objects
2. Type physics component props:
   - Create `IPhysicsBodyProps` interface
   - Type Rapier API interactions
3. Type hook return values:
   - `useGameEngineControls` return type
   - Event handler parameter types
4. Create shared prop interfaces:
   - `IGameComponentProps<TConfig>`
   - `IComponentRef<T>`
5. Validation:
   - Visual test with `yarn dev`
   - Verify camera controls work
   - Test physics interactions

**Acceptance Criteria**:

- All component props are typed
- Hook return types are explicit
- No loss of functionality
- IDE autocomplete works for all props

---

### Phase 4: Systems & Animation (0.5 day)

**Priority**: MEDIUM - Complex logic that benefits from type safety

**Files** (42+ instances):

1. `src/core/systems/AnimationSystem.ts`
2. `src/core/systems/RenderSystem.ts`
3. `src/core/systems/PhysicsSystem.ts`
4. Other system files

**Tasks**:

1. Create animation type definitions:
   - `IAnimationClip<TTarget>`
   - `IAnimationState<TData>`
   - `IAnimationTrack<TProperty, TValue>`
2. Type system update methods:
   - Define `ISystemContext` interface
   - Type entity query results
   - Fix component iteration types
3. Type animation state machine:
   - State transition types
   - Animation blend parameters
4. Validation:
   - Run animation test scenes
   - Verify state transitions
   - Check performance (no slowdown)

**Acceptance Criteria**:

- Animation system fully typed
- State machine type-safe
- Performance unchanged
- All test animations work

---

### Phase 5: Editor & UI (1 day)

**Priority**: MEDIUM - Improves developer UX

**Files** (80+ instances):

1. `src/editor/components/inspector/` (multiple files)
2. `src/editor/components/viewport/` (multiple files)
3. `src/editor/hooks/` (multiple files)
4. `src/editor/state/` (Zustand stores)

**Tasks**:

1. Type inspector components:
   - Create `IInspectorFieldProps<TValue>` generic
   - Type field change handlers
   - Fix property editor types
2. Type viewport components:
   - Gizmo interaction types
   - Selection state types
3. Type Zustand stores properly:
   - Define store state interfaces
   - Type store actions
   - Fix selector return types
4. Type UI event handlers:
   - Keyboard/mouse event types
   - Drag-and-drop types
5. Validation:
   - Test full editor workflow
   - Verify inspector editing
   - Test scene saving/loading

**Acceptance Criteria**:

- All editor components typed
- Zustand stores have proper types
- Inspector fields fully typed
- No editor functionality lost

---

### Phase 6: Plugins & Build System (0.5 day)

**Priority**: LOW - Build-time code, less critical

**Files** (90+ instances):

1. `src/plugins/vite-plugin-script-api.ts` (18 instances)
2. `src/plugins/vite-plugin-model-ingest.ts` (1 instance)
3. `src/plugins/scene-api/formats/TsxFormatHandler.ts` (1 instance)
4. `src/plugins/utils/triggerLuaTranspile.ts` (1 instance)
5. `src/plugins/assets-api/createAssetsApi.ts` (multiple instances)

**Tasks**:

1. Type Vite plugin APIs:
   - Import Vite plugin types from `vite`
   - Type plugin hooks (load, transform, etc.)
   - Fix file system operation types
2. Type asset processing:
   - Model ingestion types
   - Scene format types
   - Lua transpilation types
3. Type API endpoint handlers:
   - Request/response types for each endpoint
   - File upload types
4. Validation:
   - Run `yarn build`
   - Verify all plugins work
   - Test asset loading
   - Test scene save/load

**Acceptance Criteria**:

- All Vite plugins typed
- Build process works
- Asset processing intact
- Scene formats work

---

## File and Directory Structures

### Type Definitions Organization

```
src/
├── types/
│   ├── modules.d.ts              [Phase 1 - Module augmentation]
│   ├── ecs.ts                    [Phase 2 - ECS types]
│   ├── components.ts             [Phase 3 - Component types]
│   ├── systems.ts                [Phase 4 - System types]
│   ├── editor.ts                 [Phase 5 - Editor types]
│   └── plugins.ts                [Phase 6 - Plugin types]
```

### Component Type Pattern

```typescript
// Before (with any)
export interface IComponentData {
  value: any;
  fromJSON: (data: any) => void;
}

// After (typed)
export interface IComponentData<TValue = unknown> {
  value: TValue;
  fromJSON: (data: JsonValue) => void;
}
```

## Technical Details

### Phase 1: Foundation Types

**src/types/modules.d.ts**:

```typescript
// Proper scene context typing
export interface ISceneContext {
  createEntity: (name?: string, parent?: number) => number;
  addComponent: <TData extends IComponentData>(
    entityId: number,
    componentType: string,
    data?: TData,
  ) => void;
}

// Descriptor types
export interface IScriptDescriptor {
  name: string;
  path: string;
  exports: string[];
}

export interface IComponentDescriptor {
  type: string;
  schema: z.ZodSchema;
  factory: IComponentFactory<unknown, unknown>;
}

export interface ISystemDescriptor {
  name: string;
  priority: number;
  update: (context: ISystemContext) => void;
}

// Asset service typing
export class ProjectAssetService {
  static getInstance(): ProjectAssetService;
  loadAsset<T = unknown>(path: string): Promise<T>;
  registerAsset<T>(id: string, asset: T): void;
  getAsset<T = unknown>(id: string): T | undefined;
  getAssetBasePath(): string;
}
```

**src/core/lib/di/Container.ts**:

```typescript
// Properly constrained constructor type
export type Constructor<T = object> = new (...args: unknown[]) => T;

// Typed factory function
export type Factory<T> = (...args: unknown[]) => T;

// Service definition without any
interface IServiceDefinition<T = unknown> {
  factory: Factory<T>;
  singleton: boolean;
  instance?: T;
}

// Fixed has method
has(token: string | Constructor<unknown>): boolean {
  return this.services.has(token);
}
```

### Phase 2: ECS Component Typing Pattern

**Template for all components**:

```typescript
import { z } from 'zod';
import type { IComponentFactory } from '@core/lib/ecs/types';

// Zod schema with explicit types
export const ComponentDataSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotation: z.tuple([z.number(), z.number(), z.number()]),
  scale: z.tuple([z.number(), z.number(), z.number()]),
});

export type IComponentData = z.infer<typeof ComponentDataSchema>;

// Typed component class
export class Component {
  constructor(public data: IComponentData) {}

  // Properly typed serialization
  static fromJSON(json: unknown): Component {
    const parsed = ComponentDataSchema.parse(json);
    return new Component(parsed);
  }

  // Properly typed deserialization
  toJSON(): IComponentData {
    return ComponentDataSchema.parse(this.data);
  }
}

// Typed factory
export const componentFactory: IComponentFactory<IComponentData, Component> = {
  create: (data) => new Component(data),
  schema: ComponentDataSchema,
};
```

### Phase 3: React Component Typing

**Component props pattern**:

```typescript
import type { ReactNode } from 'react';
import type { Object3D } from 'three';

export interface ICameraControlsProps {
  target?: Object3D | null;
  enabled?: boolean;
  minDistance?: number;
  maxDistance?: number;
  children?: ReactNode;
}

export const CameraControls = React.memo<ICameraControlsProps>(
  ({ target, enabled = true, minDistance = 1, maxDistance = 100 }) => {
    // Implementation
  },
);
```

**Hook typing pattern**:

```typescript
export interface IGameEngineControls {
  play: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;
  isPlaying: boolean;
}

export function useGameEngineControls(): IGameEngineControls {
  // Implementation
  return {
    play,
    pause,
    step,
    reset,
    isPlaying,
  };
}
```

### Phase 4: Animation System Types

```typescript
// Animation track types
export type AnimationPropertyPath = string;
export type AnimationValue = number | number[] | boolean | string;

export interface IAnimationTrack<TValue extends AnimationValue = AnimationValue> {
  property: AnimationPropertyPath;
  keyframes: Array<{
    time: number;
    value: TValue;
    interpolation: 'linear' | 'step' | 'cubic';
  }>;
}

export interface IAnimationClip {
  name: string;
  duration: number;
  tracks: IAnimationTrack[];
}

export interface IAnimationState {
  clip: IAnimationClip;
  time: number;
  speed: number;
  loop: boolean;
  playing: boolean;
}

// State machine types
export interface IAnimationTransition {
  from: string;
  to: string;
  condition: (context: IAnimationContext) => boolean;
  duration: number;
}

export interface IAnimationContext {
  getParameter<T>(name: string): T | undefined;
  setParameter<T>(name: string, value: T): void;
}
```

### Phase 5: Editor Store Types

**Zustand store pattern**:

```typescript
import { create } from 'zustand';

interface IEditorState {
  selectedEntityId: number | null;
  hoveredEntityId: number | null;
  gizmoMode: 'translate' | 'rotate' | 'scale';
}

interface IEditorActions {
  selectEntity: (id: number | null) => void;
  hoverEntity: (id: number | null) => void;
  setGizmoMode: (mode: IEditorState['gizmoMode']) => void;
}

export type IEditorStore = IEditorState & IEditorActions;

export const useEditorStore = create<IEditorStore>((set) => ({
  // State
  selectedEntityId: null,
  hoveredEntityId: null,
  gizmoMode: 'translate',

  // Actions
  selectEntity: (id) => set({ selectedEntityId: id }),
  hoverEntity: (id) => set({ hoveredEntityId: id }),
  setGizmoMode: (mode) => set({ gizmoMode: mode }),
}));
```

### Phase 6: Vite Plugin Types

```typescript
import type { Plugin, ResolvedConfig } from 'vite';

interface IScriptApiOptions {
  scriptDir: string;
  outputDir: string;
}

export function vitePluginScriptApi(options: IScriptApiOptions): Plugin {
  let config: ResolvedConfig;

  return {
    name: 'vite-plugin-script-api',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    async load(id: string): Promise<string | null> {
      // Properly typed
      if (!id.endsWith('.lua')) return null;

      // Implementation
    },

    async transform(code: string, id: string): Promise<{ code: string } | null> {
      // Properly typed
    },
  };
}
```

## UI Integration

Not applicable - this is a refactoring effort focused on type safety, not UI changes.

## Usage Examples

### Before: Unsafe DI Container

```typescript
// Before - no type safety
container.register('MyService', () => new MyService());
const service = container.resolve('MyService'); // any type
```

### After: Type-Safe DI Container

```typescript
// After - full type inference
container.register('MyService', () => new MyService());
const service = container.resolve<MyService>('MyService'); // MyService type

// Even better with class registration
container.registerClass(MyService);
const service = container.resolve(MyService); // MyService type
```

### Before: Unsafe Component Definition

```typescript
// Before
export const createTransform = (data: any) => {
  return new TransformComponent(data);
};
```

### After: Type-Safe Component

```typescript
// After
export const createTransform = (data: ITransformData): TransformComponent => {
  const validated = TransformDataSchema.parse(data);
  return new TransformComponent(validated);
};
```

## Testing Strategy

### Unit Tests

Each phase includes specific test scenarios:

**Phase 1 - Foundation**:

- DI container type inference
- Module import type checking
- Generic constraint validation

**Phase 2 - ECS Core**:

- Component serialization/deserialization
- Type preservation through JSON round-trip
- Component factory type inference

**Phase 3 - Components**:

- Component prop type checking
- Hook return type validation
- Event handler parameter types

**Phase 4 - Systems**:

- Animation state machine type safety
- System update type checking
- Entity query result types

**Phase 5 - Editor**:

- Store state type inference
- Action parameter validation
- Inspector field type checking

**Phase 6 - Plugins**:

- Vite plugin hook types
- Asset processing type safety
- Build output validation

### Integration Tests

After each phase:

1. **Build Test**: Run `yarn build` - must succeed
2. **Type Check**: Run `yarn typecheck` - zero errors
3. **Lint**: Run `yarn lint` - zero `any` warnings in completed modules
4. **Runtime Test**: Run `yarn dev` - application loads
5. **Functionality Test**: Load a test scene, verify core features work
6. **Rust Engine Test**: Run `yarn rust:engine --scene testphysics` - verify serialization

### Regression Prevention

Between each phase:

1. **Git Commit**: Commit changes with descriptive message
2. **Full Test Suite**: Run all existing tests
3. **Visual Test**: Load editor, create entity, add components, save scene
4. **Cross-Reference**: Check that changed files don't break dependent files
5. **Documentation**: Update CLAUDE.md files if patterns change

## Edge Cases

| Edge Case                                      | Remediation                                           |
| ---------------------------------------------- | ----------------------------------------------------- |
| **Generic type inference fails**               | Add explicit type parameters to function calls        |
| **Circular type dependencies**                 | Extract shared types to separate file                 |
| **JSON parsing loses type information**        | Add runtime validation with Zod schemas               |
| **Third-party library has poor types**         | Create ambient module declarations                    |
| **Union types become too complex**             | Use discriminated unions with `type` field            |
| **Performance impact from runtime validation** | Only validate at boundaries (JSON parsing, API calls) |
| **Breaking changes in shared types**           | Update all consumers in same commit                   |
| **Type errors in generated code**              | Update code generators to emit proper types           |

## Sequence Diagram

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Phase as Current Phase
    participant Tests as Test Suite
    participant Lint as Linter
    participant Build as Build System
    participant Git as Version Control

    loop For Each Phase (1-6)
        Dev->>Phase: Implement type fixes
        Phase->>Lint: Run yarn lint
        Lint-->>Dev: Report remaining any types

        alt All any types fixed in phase
            Phase->>Tests: Run yarn typecheck
            Tests-->>Dev: Type validation results

            alt Types valid
                Phase->>Build: Run yarn build
                Build-->>Dev: Build success/failure

                alt Build successful
                    Phase->>Tests: Run full test suite
                    Tests-->>Dev: Test results

                    alt Tests pass
                        Dev->>Dev: Visual test (yarn dev)
                        Dev->>Git: Commit phase changes
                        Dev->>Dev: Move to next phase
                    else Tests fail
                        Dev->>Dev: Fix failing tests
                    end
                else Build fails
                    Dev->>Dev: Fix build errors
                end
            else Type errors
                Dev->>Dev: Fix type errors
            end
        else Still have any types
            Dev->>Dev: Continue fixing
        end
    end

    Dev->>Git: Final commit
    Dev->>Dev: Close issue
```

## Risks & Mitigations

| Risk                                               | Mitigation                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Breaking changes in public APIs**                | Use deprecation warnings, maintain backward compatibility layer temporarily                |
| **Performance regression from runtime validation** | Only validate at system boundaries; use type guards instead of runtime checks in hot paths |
| **Incomplete type coverage**                       | Use `strict: true` in tsconfig.json; enable `noImplicitAny`                                |
| **Developer resistance to strict typing**          | Document benefits in CLAUDE.md; provide examples and patterns                              |
| **Time overrun**                                   | Phases are independent; can pause between phases if needed                                 |
| **Merge conflicts with ongoing work**              | Coordinate with team; do foundation phases first to minimize conflicts                     |
| **Third-party type incompatibility**               | Create wrapper types; contribute upstream type improvements                                |
| **Generic type complexity**                        | Keep generics simple; prefer specific types over overly abstract generics                  |

## Timeline

### Total Estimated Time: 4.5 days

**Phase Breakdown**:

- Phase 1 (Foundation): 0.5 day
- Phase 2 (ECS Core): 1.0 day
- Phase 3 (Components): 1.0 day
- Phase 4 (Systems): 0.5 day
- Phase 5 (Editor): 1.0 day
- Phase 6 (Plugins): 0.5 day

**Daily Schedule** (assuming 8-hour workday):

- **Day 1**: Phase 1 (AM) + Phase 2 start (PM)
- **Day 2**: Phase 2 complete + Phase 3 start
- **Day 3**: Phase 3 complete + Phase 4 complete
- **Day 4**: Phase 5 complete
- **Day 5**: Phase 6 complete + final validation

**Milestones**:

- End of Day 1: Foundation and 50% of ECS core complete
- End of Day 2: All core engine types complete
- End of Day 3: All runtime types complete
- End of Day 4: All editor types complete
- End of Day 5: Zero `any` types in codebase

## Acceptance Criteria

- [ ] `yarn lint` reports zero "Unexpected any" warnings
- [ ] `yarn typecheck` passes with zero errors
- [ ] `yarn build` completes successfully
- [ ] All existing tests pass
- [ ] Editor loads and functions normally (`yarn dev`)
- [ ] Can create entity, add components, edit properties in inspector
- [ ] Can save and load scenes (both .tsx and .json formats)
- [ ] Rust engine can load scenes: `yarn rust:engine --scene testphysics`
- [ ] Screenshots work: `yarn rust:screenshot --scene testphysics`
- [ ] Animation system works in test scenes
- [ ] Physics interactions work correctly
- [ ] No performance regression (FPS unchanged)
- [ ] IDE autocomplete works for all previously `any` typed code
- [ ] No console errors or warnings in browser/Rust output
- [ ] Documentation updated in relevant CLAUDE.md files

## Conclusion

This systematic elimination of `any` types will significantly improve the codebase's type safety, maintainability, and developer experience. By breaking the work into six logical phases based on architectural layers, we minimize the risk of regressions while ensuring each phase can be independently tested and validated.

The batched approach allows for:

- **Incremental progress** with clear checkpoints
- **Early detection** of type-related issues
- **Reduced merge conflicts** through focused changes
- **Better code review** by grouping related changes
- **Maintainable momentum** by avoiding overwhelming scope

Upon completion, the codebase will fully comply with the "ALWAYS use proper TypeScript types - no `any` types" standard, providing better tooling support, catching bugs at compile-time, and improving overall code quality.

## Assumptions & Dependencies

**Assumptions**:

- Existing test coverage is sufficient to catch regressions
- Team has capacity for 4.5 days of focused refactoring work
- No major feature development will conflict during this period
- Current TypeScript version (check package.json) supports all required features
- Existing Zod schemas are correct and can be trusted

**Dependencies**:

- TypeScript (version from package.json)
- Zod validation library
- ESLint with TypeScript plugin
- Existing test infrastructure
- Development environment setup (yarn, Node.js)
- No blocking PRs that modify type definitions

**External Constraints**:

- Rust engine must remain compatible with scene JSON format
- Editor UI cannot have breaking changes
- Build times should not increase significantly
- Bundle size should not increase significantly
- No changes to public API contracts without deprecation period
