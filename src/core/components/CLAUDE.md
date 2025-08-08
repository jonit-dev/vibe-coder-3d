# Core Components Guidelines

**Purpose**: Essential game engine components for 3D rendering and interaction.

**Structure**:

- `cameras/` - Camera controls and behaviors
- `lighting/` - Light sources and shadow systems
- `physics/` - Physics bodies and constraints
- `shadows/` - Shadow rendering components
- `ui/` - Core UI elements (overlays, HUD)
- `debug/` - Debug visualization components

**Component Design**:

- Inherit from base Component class
- Self-contained functionality
- Configurable via props/parameters
- React-Three-Fiber compatible

**Performance Considerations**:

- Minimize re-renders
- Use refs for Three.js objects
- Memoize expensive calculations
- Batch state updates

**Dependencies**:

- Three.js for 3D operations
- React-Three-Fiber for React integration
- Core ECS system for component architecture
