# Choosing the Right Tool

```mermaid
graph TD
    A{What are you creating?} --> B[Single primitive]
    A --> C[Composition 2+ primitives]
    A --> D[Multiple instances]

    B --> E[scene_manipulation add_entity]
    C --> F[prefab_management create_from_primitives]
    D --> G[prefab_management instantiate]

    F --> H[Creates reusable template]
    H --> I[Does NOT clutter scene]

    G --> J[Instantiate at positions]
```

## Decision Tree

1. **Single primitive** → `scene_manipulation(add_entity)`
2. **Composition 2+ primitives** → `prefab_management(create_from_primitives)`
3. **Multiple instances** → `prefab_management(instantiate)`

## Critical Rules

For collections (forests, buildings, props):
1. ✅ Create prefab ONCE via create_from_primitives
2. ✅ Instantiate multiple times via instantiate
3. ❌ NEVER add primitives individually first
