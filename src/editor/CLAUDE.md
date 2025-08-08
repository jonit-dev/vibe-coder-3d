# Editor Module Guidelines

**Purpose**: Unity-like game editor interface and tooling.

**Architecture**:

- `components/` - UI components for editor interface
- `hooks/` - Editor-specific React hooks
- `store/` - Editor state management
- `types/` - Editor-specific type definitions
- `lib/` - Editor utilities and helpers

**Key Principles**:

- Unity-like user experience
- Component-based UI architecture
- Reactive state management
- Real-time scene manipulation

**UI Guidelines**:

- Use Tailwind for styling
- Small, focused components
- Logic in custom hooks
- Prevent unnecessary re-renders

**Editor Features**:

- Hierarchical scene management
- Inspector panel for entity properties
- Viewport with 3D scene rendering
- Asset management and importing
- Real-time collaboration tools

**Performance**:

- Optimize viewport rendering
- Debounce user inputs
- Lazy load heavy components
- Efficient state updates
