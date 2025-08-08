# Editor Components Guidelines

**Purpose**: React components for Unity-like editor interface.

**Structure**:

- `layout/` - Main editor layout components
- `panels/` - Editor panels (Inspector, Viewport, etc.)
- `inspector/` - Property editing components
- `menus/` - Context menus and dropdowns
- `navigation/` - Scene hierarchy and navigation
- `forms/` - Input forms and controls
- `shared/` - Reusable UI components
- `debug/` - Debug and development tools
- `chat/` - Collaboration features
- `physics/` - Physics debugging tools

**Component Rules**:

- Export as named exports only
- Inline component declarations: `export const ComponentName`
- Small, single-responsibility components
- Use custom hooks for complex logic
- Prefix interfaces with `I`

**Styling**:

- Tailwind CSS only
- Responsive design patterns
- Dark/light theme support
- Consistent spacing and typography

**State Management**:

- Local state for UI interactions
- Editor store for global state
- Props for component communication
- Context for deep component trees
