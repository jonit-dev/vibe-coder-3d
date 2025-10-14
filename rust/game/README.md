# Rust Game Data

This directory mirrors the `src/game` folder structure and contains JSON exports for Rust consumption.

## Structure

```
rust/game/
├── assets/       # Asset references (future)
├── components/   # Component data (future)
├── config/       # Configuration files (future)
├── prefabs/      # Prefab definitions (future)
├── scenes/       # Scene JSON dumps (full, no compression)
├── schema/       # Component JSON schemas
├── scripts/      # Script references (future)
├── shapes/       # Shape definitions (future)
└── systems/      # System configurations (future)
```

## Scene Data

Scenes are saved in **two formats**:

1. **TSX Format** (`src/game/scenes/*.tsx`)
   - Compressed format with default omission
   - Material deduplication
   - Used by the TypeScript/React editor
   - 60-80% smaller file size

2. **JSON Format** (`rust/game/scenes/*.json`)
   - Full scene dump without compression
   - All defaults included
   - All materials inline
   - Used by the Rust renderer
   - Complete data for native rendering

### Dual Save System

When you save a scene in the editor:
- TSX file is saved to `src/game/scenes/` (compressed)
- JSON file is saved to `rust/game/scenes/` (full dump)
- Both contain the same logical data

### Scene JSON Structure

```json
{
  "metadata": {
    "name": "MyScene",
    "version": 1,
    "timestamp": "2025-10-14T12:00:00.000Z"
  },
  "entities": [...],
  "materials": [...],
  "prefabs": [...],
  "inputAssets": [...],
  "lockedEntityIds": [...]
}
```

## Component Schemas

Component schemas are exported to `rust/game/schema/` as JSON Schema files.

### Generate Schemas

```bash
yarn rust:export-schemas
```

This exports all component Zod schemas to JSON Schema format for Rust type generation.

### Schema Format

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Transform",
  "type": "object",
  "properties": {
    "position": {
      "type": "array",
      "items": [{"type": "number"}, {"type": "number"}, {"type": "number"}],
      "minItems": 3,
      "maxItems": 3
    },
    "rotation": {...},
    "scale": {...}
  },
  "required": ["position", "rotation", "scale"]
}
```

## Workflow

1. **Develop in Editor** - Create/edit scenes in TypeScript editor
2. **Save Scene** - Scene is saved in both TSX (compressed) and JSON (full) formats
3. **Export Schemas** - Run `yarn rust:export-schemas` to update component schemas
4. **Rust Renderer** - Loads JSON scenes with full data for native rendering

## Benefits

- **Separation of Concerns**: Editor uses compressed format, Rust uses full format
- **No Data Loss**: Full scene dumps preserve all data for Rust
- **Type Safety**: JSON schemas enable type-safe Rust code generation
- **Performance**: Rust renderer doesn't need to restore defaults
- **Flexibility**: Each system can use optimal format for its needs

## Notes

- JSON files are **generated** - don't edit manually
- Schemas are **derived** from TypeScript definitions
- This is a **one-way sync** from editor to Rust
- Changes in editor automatically propagate to Rust data
