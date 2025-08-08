# Editor Panels Guidelines

**Purpose**: Main editor interface panels (Inspector, Viewport, etc.).

**Panel Types**:

- `ViewportPanel/` - 3D scene rendering and manipulation
- `InspectorPanel/` - Entity property editing
- Scene hierarchy panel
- Asset browser panel
- Console/debug panel

**Panel Architecture**:

- Main panel component handles layout
- Content components handle specific functionality
- Hooks manage panel-specific state
- Context providers for panel data

**Viewport Panel**:

- Three.js scene rendering
- Camera controls and manipulation
- Entity selection and gizmos
- Real-time scene updates
- Performance optimizations

**Inspector Panel**:

- Dynamic component adapters
- Property form generation
- Component addition/removal
- Real-time value updates
- Validation and error handling

**Responsive Design**:

- Panel resizing and docking
- Mobile-friendly interactions
- Adaptive layouts
- Keyboard shortcuts
