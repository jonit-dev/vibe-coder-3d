# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Script API Documentation** - Complete API reference for scripting system with real-world examples
  - Entity, Input, Math, Time, Timer APIs
  - Audio, Events, Prefab, Query, UI APIs
  - GameObject pattern for high-level entity management
  - Console API with proper sandboxing
- **Rust Build Optimization Tools**
  - `xtask` build automation with metrics tracking
  - Build metrics script for CI/CD integration
  - Feature matrix analysis tool
- **New PRDs**
  - UI Script API implementation plan
  - Script system refactor roadmap
  - Rust build optimization strategy with full metrics

### Changed

- **Monaco Editor Performance** - Added 500ms debounce to script editor saves
  - No more lag on every keystroke
  - Only saves after user stops typing
  - Proper cleanup to prevent memory leaks
- **Rust Build Performance** - 91% size reduction and 9x faster incremental builds
  - Binary size: 114MB → 10MB (debug), 122MB → 6MB (release with LTO)
  - Incremental compile: 45s → 5s
  - Smart feature flags and dependency optimization

### Fixed

- Removed excessive logging in physics/character controller systems
- Fixed ViewportPanel milestone spam
- Better test mocking for CharacterController
- Minor cleanups (unused imports, regex escaping)

## [0.1.0] - 2025-11-09

### Added

- **Core Engine Infrastructure**

  - Entity Component System (ECS) with bitECS
  - React Three Fiber based 3D editor
  - Dual architecture (TypeScript + Rust)

- **TypeScript Editor**

  - Visual scene editor with drag-and-drop
  - Component inspector with real-time editing
  - Material editor with PBR support
  - Prefab browser and management
  - Debug tools and performance monitoring
  - Scene serialization (dual format: .tsx + .json)

- **Rust Native Engine**

  - PBR rendering with three-d library
  - Cross-platform support (Windows, Linux, macOS)
  - Scene loading from JSON
  - Debug mode with orbital camera
  - Collider visualization
  - Screenshot capture system
  - GPU profiling

- **Physics System**

  - Rapier physics engine integration
  - Multiple collision shapes (box, sphere, capsule, mesh)
  - Rigid body dynamics
  - Physics triggers and sensors
  - Bidirectional ECS synchronization

- **Scripting System**

  - TypeScript-based scripting
  - 14 global APIs (Entity, Transform, Input, Audio, etc.)
  - Script lifecycle (onStart, onUpdate, onDestroy)
  - Rust: Lua scripting runtime (mlua)

- **Material System**

  - PBR material support
  - Material types (Standard, Phong, Lambert, Basic, Physical)
  - Texture support (albedo, normal, metallic, roughness, AO)
  - Material registry with validation
  - Live preview in editor

- **Prefab System**

  - Unity-like prefab architecture
  - Nested prefab support
  - Override system for variants
  - Dependency tracking

- **Input System**

  - Action-based input mapping
  - Keyboard and mouse support
  - Configurable input actions
  - Pointer lock for FPS games

- **Asset Pipeline**

  - GLTF model loading with Draco compression
  - Texture optimization with mipmaps
  - Mesh optimization with meshoptimizer
  - LOD system for performance
  - Asset caching and lazy loading

- **Development Tools**
  - Comprehensive documentation (50+ files)
  - TypeScript type safety
  - ESLint and Prettier configuration
  - Husky git hooks
  - Vitest testing framework
  - GitHub Actions CI workflow

### Known Issues

- AI integration is planned but not yet implemented
- Some TODO/FIXME comments remain in codebase (16 occurrences)

---

## How to Use This Changelog

### For Maintainers

When making changes, add them to the `[Unreleased]` section under the appropriate category:

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

When releasing a new version:

1. Change `[Unreleased]` to `[X.Y.Z] - YYYY-MM-DD`
2. Create a new `[Unreleased]` section
3. Update the version in package.json
4. Tag the release in Git

### For Users

- Check the `[Unreleased]` section to see what's coming
- Read version sections to understand what changed in each release
- Look for **Security** entries to understand important security updates

[Unreleased]: https://github.com/jonit-dev/vibe-coder-3d/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/jonit-dev/vibe-coder-3d/releases/tag/v0.1.0
