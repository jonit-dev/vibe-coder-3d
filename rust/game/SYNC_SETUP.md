# Asset Sync Setup for Rust Engine

## Overview

The Rust engine loads assets, geometry, and scenes from the `rust/game/` directory, which are automatically synced from the TypeScript editor's source folders.

## Automatic Syncing

Assets are automatically synced when running any Rust engine command:

```bash
yarn rust:engine          # Auto-syncs before running
yarn rust:screenshot      # Auto-syncs before screenshot
yarn rust:engine:test     # Auto-syncs before test
yarn rust:engine:verbose  # Auto-syncs with verbose output
```

## Manual Syncing

You can also manually sync assets:

```bash
yarn rust:sync-assets           # Full output
yarn rust:sync-assets --silent  # Silent mode
yarn rust:sync-assets --verbose # Detailed output
yarn rust:sync-assets --dry-run # Preview without copying
```

## Synced Directories

The sync script syncs three directories:

| Source (TypeScript)  | Destination (Rust)    | Contents                   |
| -------------------- | --------------------- | -------------------------- |
| `public/assets/`     | `rust/game/assets/`   | Models, textures, skyboxes |
| `src/game/geometry/` | `rust/game/geometry/` | Custom `.shape.json` files |
| `src/game/scenes/`   | `rust/game/scenes/`   | Scene `.json` files        |

## How It Works

### 1. Intelligent Caching

The sync uses a cache file (`.sync-cache.json`) to track file changes:

- Only syncs files that have changed (by hash)
- Skips unchanged files (instant sync)
- Detects new, modified, and deleted files

### 2. Deletion Sync

If you delete a file from the source folder, it's automatically deleted from the Rust folder on next sync.

### 3. GLTF Dequantization

GLB/GLTF models are automatically processed with `gltf-transform` to remove mesh quantization (not supported by Rust's GLTF crate).

## Path Resolution

### Geometry Files

TypeScript scenes reference geometry as:

```json
{
  "GeometryAsset": {
    "path": "/src/game/geometry/battleship.shape.json"
  }
}
```

Rust engine resolves this to:

```
rust/game/geometry/battleship.shape.json
```

### Assets (Models, Textures)

Assets use relative paths from `public/assets/`:

```
/assets/models/FarmHouse/glb/farm_house.glb
→ rust/game/assets/models/FarmHouse/glb/farm_house.glb
```

## Development Workflow

### Creating New Geometry

1. Create geometry file in `src/game/geometry/example.shape.json`
2. Reference it in a scene with path `/src/game/geometry/example.shape.json`
3. Run `yarn rust:sync-assets` (or any `yarn rust:engine` command)
4. Rust engine will load from `rust/game/geometry/example.shape.json`

### Creating New Scenes

1. Create scene in `src/game/scenes/myscene.json`
2. Run `yarn rust:sync-assets`
3. Run engine: `yarn rust:engine --scene myscene`

### Modifying Assets

1. Edit any file in `public/assets/`, `src/game/geometry/`, or `src/game/scenes/`
2. Sync automatically detects changes on next `yarn rust:engine` command
3. Changed files are re-synced automatically

## Cache Management

The sync cache is stored at:

```
rust/game/.sync-cache.json
```

To force a full re-sync (ignore cache):

```bash
yarn rust:sync-assets --force
```

To clear the cache manually:

```bash
rm rust/game/.sync-cache.json
yarn rust:sync-assets
```

## File Extensions Synced

- **Models**: `.glb`, `.gltf`
- **Textures**: `.png`, `.jpg`, `.jpeg`, `.webp`, `.hdr`, `.exr`
- **Geometry**: `.json` (specifically `.shape.json`)
- **Scenes**: `.json`
- **Prefabs**: `.json` (`.prefab.json`)
- **Materials**: `.json` (`.mat.json`)

## Integration with Engine

The Rust engine's path resolution automatically handles synced files:

### Geometry Assets

```rust
// TypeScript path: "/src/game/geometry/battleship.shape.json"
// Resolves to: "../game/geometry/battleship.shape.json"
```

### Model Assets

```rust
// TypeScript path: "/assets/models/FarmHouse/glb/farm_house.glb"
// Resolves to: "../../public/assets/models/FarmHouse/glb/farm_house.glb"
```

## Troubleshooting

### Files Not Syncing

1. Check source file exists in correct folder
2. Verify file extension is in `ASSET_EXTENSIONS` set
3. Run `yarn rust:sync-assets --verbose` to see details
4. Try `yarn rust:sync-assets --force` to ignore cache

### Deleted Files Still Present

1. Run `yarn rust:sync-assets` to trigger deletion sync
2. Check if file exists in source (it shouldn't)
3. Manually delete from `rust/game/` if needed

### Path Resolution Issues

1. Verify geometry paths start with `/src/game/geometry/`
2. Check asset paths start with `/assets/` or use relative paths
3. Check Rust logs for resolved path output

## Related Files

- **Sync Script**: `scripts/sync-assets-to-rust.js`
- **Package Scripts**: `package.json` (see `rust:*` commands)
- **Path Resolution**: `rust/engine/src/threed_renderer.rs` (line 1167)
- **Mesh Loader**: `rust/engine/src/renderer/mesh_loader.rs` (line 512 - index clamping)
