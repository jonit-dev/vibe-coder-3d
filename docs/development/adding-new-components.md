# Adding New Component Types

This document outlines the new, streamlined process for defining and registering new component types in the game engine. The system now uses a `ComponentManifest` approach with auto-discovery, eliminating the need for manual registration in a central file.

## Overview

New components are defined by creating a "manifest" file. This file exports an object that describes the component's properties, data schema, behavior, and editor representation. The engine automatically discovers these manifest files and makes the components available.

## Directory Structure

Place your new component manifest files in:
`src/core/components/definitions/`

Each component should have its own file, typically named after the component (e.g., `myCustomComponent.ts`).

## The Component Manifest (`ComponentManifest<TData>`)

Each component definition file must default export an object that conforms to the `ComponentManifest<TData>` interface.

The structure of `ComponentManifest` is defined in `src/core/components/types.ts`. Key properties include:

*   **`id: string`**: A unique string identifier for your component (e.g., `"Health"`, `"CustomMover"`). This is crucial.
*   **`name: string`**: The user-friendly name displayed in the editor (e.g., `"Health"`, `"Custom Mover"`).
*   **`category: ComponentCategory`**: The category in the editor's "Add Component" menu. Import `ComponentCategory` from `@core/types/component-registry`.
    *   Examples: `ComponentCategory.Core`, `ComponentCategory.Rendering`, `ComponentCategory.Physics`, `ComponentCategory.Gameplay`, etc.
*   **`description: string`**: A brief description of what the component does.
*   **`icon: React.ReactNode`**: A React node for the icon in the editor. Typically use `react-icons`.
    *   Example: `React.createElement(FiHeart, { className: 'w-4 h-4' })`
*   **`schema: z.ZodSchema<TData>`**: A Zod schema defining the structure, types, and default values for your component's data. `TData` should be your component's data interface.
*   **`getDefaultData: () => TData`**: A function that returns an instance of `TData` with default values. It's highly recommended to use your Zod schema to provide these defaults: `() => YourSchema.parse({})`.
*   **`getRenderingContributions?: (data: TData) => IRenderingContributions`**: Optional. If your component influences how an entity is rendered (e.g., visibility, material properties, geometry type), define this function. It should return an object conforming to `IRenderingContributions` (defined in `src/core/components/types.ts`).
*   **`getPhysicsContributions?: (data: TData) => IPhysicsContributions`**: Optional. If your component influences physics (e.g., rigid body properties, colliders), define this function. It should return an object conforming to `IPhysicsContributions` (defined in `src/core/components/types.ts`).
*   **`onAdd?: (entityId: number, data: TData) => void`**: Optional. A callback function executed when this component is added to an entity. `data` is the fully validated data (including defaults).
*   **`onRemove?: (entityId: number) => void`**: Optional. A callback function executed when this component is removed from an entity.
*   **`removable?: boolean`**: Optional (defaults to `true`). Determines if the component can be removed from an entity in the editor. Core components like `Transform` are often set to `false`.
*   **`dependencies?: string[]`**: Optional. An array of component `id`s that this component requires to function correctly. The system may enforce these dependencies in the future (currently informational).
*   **`conflicts?: string[]`**: Optional. An array of component `id`s that cannot coexist with this component on the same entity. The system may enforce this in the future (currently informational).

## Defining Component Data and Schema (Zod)

Define an interface for your component's data (`TData`) and a corresponding Zod schema.

```typescript
// Example: src/core/components/definitions/health.ts

import { z } from 'zod';
import React from 'react';
import { FiHeart } from 'react-icons/fi';
import { ComponentManifest } from '../types'; // Path to ComponentManifest definition
import { ComponentCategory } from '@core/types/component-registry'; // Path to ComponentCategory enum

// 1. Define the data interface
export interface HealthData {
  currentHealth: number;
  maxHealth: number;
  canBeDamaged: boolean;
}

// 2. Define the Zod schema
// This schema validates the data and provides default values.
export const HealthSchema = z.object({
  currentHealth: z.number().int().min(0).default(100),
  maxHealth: z.number().int().min(1).default(100),
  canBeDamaged: z.boolean().default(true),
});

// 3. Create the manifest
const healthManifest: ComponentManifest<HealthData> = {
  id: 'Health', // Unique ID
  name: 'Health', // Display name
  category: ComponentCategory.Gameplay, // Editor category
  description: 'Manages the health and damage state of an entity.',
  icon: React.createElement(FiHeart, { className: 'w-4 h-4' }), // Icon for the editor
  schema: HealthSchema, // The Zod schema for validation and defaults
  getDefaultData: () => HealthSchema.parse({}), // Function to get default data instance
  onAdd: (entityId, data) => {
    console.log(`Health component added to entity ${entityId} with data:`, data);
    // Example: Initialize health-related systems or UI for this entity
  },
  onRemove: (entityId) => {
    console.log(`Health component removed from entity ${entityId}`);
    // Example: Clean up health-related systems or UI
  },
  removable: true, // This component can be removed in the editor
  dependencies: ['Transform'], // Example: Health might conceptually depend on Transform
};

export default healthManifest; // Default export the manifest object
```

## Automatic Registration

Once you create your component manifest file (e.g., `health.ts`) in the `src/core/components/definitions/` directory, the engine's build process (specifically Vite's `import.meta.glob`) will automatically detect and register it. You **do not** need to add it to any central list or registry file manually.

The `dynamicComponentRegistry.ts` handles this auto-discovery.

## Component IDs and `AutoKnownComponentTypes`

The `id` field (e.g., `"Health"`) in your manifest is the canonical identifier for your component. This string ID is what you should use when:
*   Referring to components in `dependencies` or `conflicts` arrays.
*   Adding components to `AUTO_COMPONENT_PACKS`.
*   Querying or interacting with components via the `ComponentManager`.

While the system automatically generates an `AutoKnownComponentTypes` object (located in `src/core/lib/ecs/dynamicComponentRegistry.ts`), which maps uppercase snake_case versions of IDs (e.g., `HEALTH: "Health"`) for convenience in some legacy or internal areas, direct string IDs are preferred for most operations.

## Adding to Component Packs

Component packs group related components for easy addition in the editor from the "Add Component" menu. Packs are currently defined as a static array in `src/core/lib/ecs/dynamicComponentRegistry.ts` within the `AUTO_COMPONENT_PACKS` constant.

To add your new component to an existing pack, or to create a new pack including your component, you'll need to manually edit this array.

Example:
```typescript
// In src/core/lib/ecs/dynamicComponentRegistry.ts
// ...
// Ensure you import IComponentPack from './types' or similar
// and any necessary icons (e.g., FiShield from 'react-icons/fi')

export const AUTO_COMPONENT_PACKS: Readonly<IComponentPack[]> = Object.freeze([
  // ... other packs ...
  {
    id: 'character-essentials',
    name: 'Character Essentials',
    description: 'Basic components for a game character.',
    icon: React.createElement(FiShield, { className: 'w-4 h-4' }), // Example icon
    category: ComponentCategory.Gameplay, // Example category
    components: ['Transform', 'MeshRenderer', 'Health', 'CustomMover'], // Added 'Health' and 'CustomMover' IDs
  },
]);
// ...
```
*(The process for defining component packs might be refined in the future, potentially moving towards auto-discovery for packs as well.)*

## Summary

1.  **Create Manifest File**: Create a `yourComponent.ts` file (e.g., `health.ts`) in `src/core/components/definitions/`.
2.  **Define Data Interface**: Define an interface for your component's data (e.g., `HealthData`).
3.  **Define Zod Schema**: Create a Zod schema (e.g., `HealthSchema`) for the data interface, including default values for each field.
4.  **Create Manifest Object**: Implement and default export a `ComponentManifest<YourDataInterface>` object.
    *   Fill in `id`, `name`, `category`, `description`, `icon`.
    *   Assign your Zod schema to the `schema` property.
    *   Set `getDefaultData: () => YourSchema.parse({})`.
    *   Implement optional lifecycle hooks (`onAdd`, `onRemove`), contribution functions (`getRenderingContributions`, `getPhysicsContributions`), and other properties (`removable`, `dependencies`, `conflicts`) as needed.
5.  **(Optional) Add to Packs**: If desired, manually add your component's `id` to the `components` array of relevant packs in `AUTO_COMPONENT_PACKS` within `src/core/lib/ecs/dynamicComponentRegistry.ts`.

Your new component will then be automatically discovered by the engine and available for use in the editor and through the `ComponentManager`.
```
