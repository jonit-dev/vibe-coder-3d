/// Entity command buffer for deferred mutations
///
/// Commands are queued during gameplay/script execution and applied
/// atomically at the end of each frame to maintain consistency.

use super::{ComponentKindId, EntityId};
use serde_json::Value;

/// Commands for runtime entity mutations
#[derive(Debug, Clone)]
pub enum EntityCommand {
    /// Create a new entity
    CreateEntity {
        entity_id: EntityId,
        name: String,
        parent_id: Option<EntityId>,
        components: Vec<(ComponentKindId, Value)>,
    },
    /// Destroy an entity and its children
    DestroyEntity { entity_id: EntityId },
    /// Set or update a component on an entity
    SetComponent {
        entity_id: EntityId,
        component_type: ComponentKindId,
        data: Value,
    },
    /// Remove a component from an entity
    RemoveComponent {
        entity_id: EntityId,
        component_type: ComponentKindId,
    },
    /// Set entity parent (reparenting)
    SetParent {
        entity_id: EntityId,
        parent_id: Option<EntityId>,
    },
    /// Set entity active state
    SetActive { entity_id: EntityId, active: bool },
}

/// Buffer for batching entity commands
///
/// Commands are queued and executed atomically to prevent
/// mid-frame inconsistencies.
pub struct EntityCommandBuffer {
    commands: Vec<EntityCommand>,
}

impl EntityCommandBuffer {
    /// Create a new empty command buffer
    pub fn new() -> Self {
        Self {
            commands: Vec::new(),
        }
    }

    /// Queue a command for later execution
    pub fn push(&mut self, command: EntityCommand) {
        self.commands.push(command);
    }

    /// Drain all queued commands
    pub fn drain(&mut self) -> impl Iterator<Item = EntityCommand> + '_ {
        self.commands.drain(..)
    }

    /// Check if buffer is empty
    pub fn is_empty(&self) -> bool {
        self.commands.is_empty()
    }

    /// Get number of queued commands
    pub fn len(&self) -> usize {
        self.commands.len()
    }

    /// Clear all commands without executing
    pub fn clear(&mut self) {
        self.commands.clear();
    }
}

impl Default for EntityCommandBuffer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_command_buffer_push_and_drain() {
        let mut buffer = EntityCommandBuffer::new();

        buffer.push(EntityCommand::CreateEntity {
            entity_id: EntityId::new(1),
            name: "Test Entity".to_string(),
            parent_id: None,
            components: vec![],
        });

        buffer.push(EntityCommand::DestroyEntity {
            entity_id: EntityId::new(2),
        });

        assert_eq!(buffer.len(), 2);
        assert!(!buffer.is_empty());

        let commands: Vec<_> = buffer.drain().collect();
        assert_eq!(commands.len(), 2);
        assert!(buffer.is_empty());
    }

    #[test]
    fn test_command_buffer_clear() {
        let mut buffer = EntityCommandBuffer::new();

        buffer.push(EntityCommand::DestroyEntity {
            entity_id: EntityId::new(1),
        });

        assert_eq!(buffer.len(), 1);

        buffer.clear();
        assert_eq!(buffer.len(), 0);
        assert!(buffer.is_empty());
    }

    #[test]
    fn test_set_component_command() {
        let mut buffer = EntityCommandBuffer::new();

        buffer.push(EntityCommand::SetComponent {
            entity_id: EntityId::new(1),
            component_type: ComponentKindId::new("Transform"),
            data: serde_json::json!({"position": [0, 5, 0]}),
        });

        assert_eq!(buffer.len(), 1);
    }

    #[test]
    fn test_set_parent_command() {
        let mut buffer = EntityCommandBuffer::new();

        buffer.push(EntityCommand::SetParent {
            entity_id: EntityId::new(2),
            parent_id: Some(EntityId::new(1)),
        });

        assert_eq!(buffer.len(), 1);

        let commands: Vec<_> = buffer.drain().collect();
        if let EntityCommand::SetParent {
            entity_id,
            parent_id,
        } = &commands[0]
        {
            assert_eq!(*entity_id, EntityId::new(2));
            assert_eq!(*parent_id, Some(EntityId::new(1)));
        } else {
            panic!("Expected SetParent command");
        }
    }
}
