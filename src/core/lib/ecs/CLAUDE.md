# ECS (Entity Component System) Guidelines

**Architecture**:

- Entities: Unique identifiers (numbers/strings)
- Components: Data-only structures implementing IComponent
- Systems: Logic processors that operate on component collections

**Component Rules**:

- Must implement IComponent interface
- Pure data containers - no methods
- Serializable structures
- Use Zod schemas for validation

**System Rules**:

- Stateless where possible
- Query components via ComponentRegistry
- Handle component lifecycle events
- Update in deterministic order

**Registry Usage**:

- Central component registration
- Type-safe component queries
- Component lifecycle management
- Validation and serialization

**Performance**:

- Components stored in flat arrays
- Systems iterate efficiently
- Avoid component creation/destruction in hot paths
