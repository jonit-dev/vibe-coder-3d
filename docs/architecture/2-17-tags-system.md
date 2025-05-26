# Tags / Groups System

The Tags system (also called Groups in some game engines) provides an efficient way to query and manipulate collections of objects. This document outlines the implementation and usage of this pattern in Vibe Coder 3D.

## Concept

In game development, it's often necessary to identify, query, and manipulate collections of objects that share some property or behavior. For example:

- Finding all enemies within a specific area
- Applying damage to all destructible objects
- Checking if any collectible items remain in a level
- Identifying the state of game objects (fallen pins, active power-ups)

The Tags system provides a lightweight mechanism to categorize objects without requiring direct references between them, promoting loose coupling and enabling efficient querying from anywhere in the application.

## Implementation

The implementation consists of three main parts:

1. **Tag Registry** - A centralized store of all tagged objects
2. **useTag Hook** - A hook for components to register with tags
3. **Query Functions** - Functions to retrieve and manipulate tagged objects

### Tag Registry (`src/core/lib/tags.ts`)

```typescript
// Main registry using Map and Set for O(1) lookups
const tagRegistry = new Map<string, Set<React.RefObject<any>>>();

// Core registration functions
export const registerTag = (tagName: string, ref: React.RefObject<any>): void => {...}
export const unregisterTag = (tagName: string, ref: React.RefObject<any>): void => {...}

// Query functions
export const getNodes = <T,>(tagName: string): React.RefObject<T>[] => {...}
export const clearTag = (tagName: string): void => {...}
export const clearAllTags = (): void => {...}
export const getAllTags = (): string[] => {...}
export const getTagCounts = (): Record<string, number> => {...}
```

### useTag Hook (`src/core/hooks/useTag.ts`)

```typescript
export const useTag = <T>(tagName: string, ref: RefObject<T>, enabled: boolean = true): void => {
  useEffect(() => {
    if (!enabled) return;

    registerTag(tagName, ref);

    return () => {
      unregisterTag(tagName, ref);
    };
  }, [tagName, ref, enabled]);
};
```

## Usage Patterns

### 1. Basic Tagging

```tsx
function Enemy({ position }) {
  const ref = useRef(null);

  // Register with the "enemy" tag
  useTag('enemy', ref);

  return (
    <mesh ref={ref} position={position}>
      {/* ... */}
    </mesh>
  );
}
```

### 2. Conditional Tagging

```tsx
function Player({ health, position }) {
  const ref = useRef(null);

  // Apply "low-health" tag only when health is below threshold
  useTag('low-health', ref, health < 20);

  // Always apply "player" tag
  useTag('player', ref);

  return (
    <mesh ref={ref} position={position}>
      {/* ... */}
    </mesh>
  );
}
```

### 3. Multiple Tags

```tsx
function Pickup({ type, position }) {
  const ref = useRef(null);

  // Apply a base tag for all pickups
  useTag('pickup', ref);

  // Apply a specific tag based on pickup type
  useTag(`pickup-${type}`, ref);

  return (
    <mesh ref={ref} position={position}>
      {/* ... */}
    </mesh>
  );
}
```

### 4. Querying Objects

```tsx
function DamageSystem() {
  useFrame(() => {
    // Get all objects with the "damageable" tag
    const damageables = getNodes('damageable');

    // Apply some effect to them
    damageables.forEach((ref) => {
      if (ref.current) {
        // Apply damage, effects, etc.
      }
    });
  });

  return null;
}
```

### 5. Complex Queries

```tsx
// Find enemies that are both active and visible
function getVisibleEnemies() {
  const enemies = getNodes('enemy');
  const visibleObjects = getNodes('visible');

  // Find the intersection
  return enemies.filter((ref) => visibleObjects.includes(ref));
}
```

## Example: Bowling Game

In the bowling demo, we use tags to categorize pins by:

1. **Rows** - `ROW_FRONT`, `ROW_MIDDLE`, `ROW_BACK`
2. **Status** - `FALLEN`, `STANDING`
3. **Position** - `HEAD`, `LEFT_CORNER`, `RIGHT_CORNER`
4. **Type** - `ALL` (all pins)

This allows for complex queries like:

```typescript
// Check if all pins in a row are fallen
const frontRowPins = getNodes(PIN_TAGS.ROW_FRONT);
const allFrontRowFallen = frontRowPins.every((pin) => getNodes(PIN_TAGS.FALLEN).includes(pin));

// Detect a split (middle pins knocked down, corner pins standing)
const isCornerToCornerSplit =
  getNodes(PIN_TAGS.LEFT_CORNER).some((pin) => getNodes(PIN_TAGS.STANDING).includes(pin)) &&
  getNodes(PIN_TAGS.RIGHT_CORNER).some((pin) => getNodes(PIN_TAGS.STANDING).includes(pin)) &&
  getNodes(PIN_TAGS.ROW_MIDDLE).every((pin) => getNodes(PIN_TAGS.FALLEN).includes(pin));
```

## Performance Considerations

The Tags system is designed for performance:

1. **O(1) Lookups** - Using `Map` and `Set` for constant-time operations
2. **Minimal Memory** - Only stores references, not component instances
3. **Cleanup** - Proper cleanup in `useEffect` return functions
4. **Conditional Registration** - The `enabled` parameter prevents unnecessary registrations
5. **Type Safety** - Generic types ensure proper typing of retrieved objects

## Best Practices

1. **Use Consistent Tag Names** - Consider using string constants for tag names
2. **Group Related Tags** - Create tag groups like `PIN_TAGS` for related tags
3. **Conditional Tagging** - Use the `enabled` parameter for dynamic tag application
4. **Cleanup** - Let the `useTag` hook handle registration/unregistration
5. **Multiple Tags** - Apply multiple tags to objects for complex filtering
6. **Tag Hierarchies** - Consider hierarchical tag schemes (e.g., `enemy`, `enemy-boss`, `enemy-minion`)

## Integration with Other Patterns

- **ECS Integration** - Use tags to group entities with similar components
- **Signals/Events** - Dispatch events to all objects with a specific tag
- **Blueprint Pattern** - Apply consistent tags to all instances of a Blueprint

## Future Enhancements

Potential future enhancements to the tag system include:

1. **Spatial Queries** - Combine tags with spatial data structures for queries like "all enemies within radius"
2. **Tag Inheritance** - Support for tag hierarchies and inheritance
3. **Query Caching** - Cache frequently used queries for better performance
4. **Serialization** - Support for serializing/deserializing tag state
