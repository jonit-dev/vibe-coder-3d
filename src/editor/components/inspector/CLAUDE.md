# Inspector Components Guidelines

**Purpose**: Entity property editing and component management interface.

**Structure**:

- `adapters/` - Component-specific property editors
- `sections/` - Inspector panel sections
- Base inspector components
- Form controls and inputs

**Adapter Pattern**:

- Each component type has dedicated adapter
- Adapters handle component-specific UI
- Type-safe property editing
- Validation and error display

**Key Components**:

- ComponentList - Shows attached components
- Component adapters - Edit specific properties
- Add component interface
- Remove component controls

**Form Handling**:

- Real-time property updates
- Validation with Zod schemas
- Error state management
- Undo/redo support

**Performance**:

- Memoize expensive renders
- Debounce user inputs
- Efficient state updates
- Lazy load complex adapters

**Adapter Implementation**:

- Use component's Zod schema
- Handle all component properties
- Provide intuitive UI controls
- Support nested object editing
