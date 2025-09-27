# Core Systems Guidelines

**Purpose**: Core engine systems that process entities and components.

**System Types**:

- Rendering systems (mesh, lighting, camera)
- Physics systems (collision, dynamics)
- Input handling systems
- Audio systems
- Animation systems
- Network synchronization systems

**System Architecture**:

- Each system implements ISystem interface
- Systems query entities with required components
- Update in deterministic order each frame
- Handle component lifecycle events

**Performance Requirements**:

- Systems must be optimized for frame rate
- Batch operations when possible
- Use efficient data structures
- Profile system execution time
- Avoid allocations in update loops

**Best Practices**:

- Systems should be stateless when possible
- Store state in components, not systems
- Use global state only when necessary
- Proper cleanup of system state
