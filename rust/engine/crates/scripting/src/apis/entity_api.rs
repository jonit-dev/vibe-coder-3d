//! Entity API - provides access to entity properties and transform operations
//!
//! # Lua API
//!
//! ## entity.id (read-only)
//! ```lua
//! local id = entity.id  -- Get entity ID as number
//! ```
//!
//! ## entity.name (read-only)
//! ```lua
//! local name = entity.name  -- Get entity name as string
//! ```
//!
//! ## entity.transform
//!
//! ### Getters (read-only)
//! ```lua
//! local pos = entity.transform.position    -- Returns {x, y, z}
//! local rot = entity.transform.rotation    -- Returns {x, y, z} in degrees
//! local scale = entity.transform.scale     -- Returns {x, y, z}
//! ```
//!
//! ### Setters
//! ```lua
//! entity.transform:setPosition(x, y, z)
//! entity.transform:setRotation(x, y, z)  -- Expects degrees
//! entity.transform:setScale(x, y, z)
//! ```
//!
//! ### Delta methods
//! ```lua
//! entity.transform:translate(dx, dy, dz)  -- Add to current position
//! entity.transform:rotate(dx, dy, dz)     -- Add to current rotation (degrees)
//! ```
//!
//! ## Component Access
//!
//! ```lua
//! -- Check if component exists
//! if entity:hasComponent("MeshRenderer") then
//!     -- Get component data as table
//!     local mesh = entity:getComponent("MeshRenderer")
//!     console.log("Mesh ID:", mesh.meshId)
//! end
//!
//! -- Modify component
//! entity:setComponent("Transform", {position = {10, 0, 0}})
//!
//! -- Remove component
//! entity:removeComponent("MeshRenderer")
//! ```
//!
//! ## Entity Lifecycle
//!
//! ```lua
//! -- Destroy entity
//! entity:destroy()
//!
//! -- Set active state (placeholder)
//! entity:setActive(false)
//! local active = entity:isActive()
//! ```
//!
//! ## Hierarchy
//!
//! ```lua
//! -- Get parent
//! local parent = entity:getParent()
//!
//! -- Get children
//! local children = entity:getChildren()
//!
//! -- Find child by name
//! local child = entity:findChild("ChildName")
//! ```

use glam::{Quat, Vec3};
use mlua::prelude::*;
use serde_json::Value;
use std::sync::{Arc, Mutex};
use vibe_ecs_bridge::Transform;
use vibe_ecs_bridge::{position_to_vec3_opt, scale_to_vec3_opt};
use vibe_scene::Scene;

use super::entity_mutations::{EntityMutation, EntityMutationBuffer};

/// Transform state that can be shared between Lua and Rust
///
/// Uses Arc<Mutex> for thread-safe interior mutability (required by mlua's Send constraint)
#[derive(Debug, Clone)]
pub struct EntityTransformState {
    pub position: Vec3,
    pub rotation: Vec3, // Stored as Euler degrees for TS compatibility
    pub scale: Vec3,
    pub dirty: bool,
}

impl EntityTransformState {
    pub fn from_transform(transform: &Transform) -> Self {
        let position = position_to_vec3_opt(transform.position.as_ref());
        let scale = scale_to_vec3_opt(transform.scale.as_ref());

        // Convert rotation to Euler degrees
        let rotation = if let Some(ref rot_vec) = transform.rotation {
            match rot_vec.len() {
                3 => Vec3::new(rot_vec[0], rot_vec[1], rot_vec[2]), // Already degrees
                4 => {
                    // Convert quaternion to Euler degrees
                    let quat = Quat::from_xyzw(rot_vec[0], rot_vec[1], rot_vec[2], rot_vec[3]);
                    let (x, y, z) = quat.to_euler(glam::EulerRot::XYZ);
                    Vec3::new(x.to_degrees(), y.to_degrees(), z.to_degrees())
                }
                _ => Vec3::ZERO,
            }
        } else {
            Vec3::ZERO
        };

        Self {
            position,
            rotation,
            scale,
            dirty: false,
        }
    }

    pub fn to_transform(&self) -> Transform {
        Transform {
            position: Some([self.position.x, self.position.y, self.position.z]),
            rotation: Some(vec![self.rotation.x, self.rotation.y, self.rotation.z]),
            scale: Some([self.scale.x, self.scale.y, self.scale.z]),
        }
    }

    pub fn mark_dirty(&mut self) {
        self.dirty = true;
    }
}

impl Default for EntityTransformState {
    fn default() -> Self {
        Self {
            position: Vec3::ZERO,
            rotation: Vec3::ZERO,
            scale: Vec3::ONE,
            dirty: false,
        }
    }
}

/// Register the entity API in the Lua environment
///
/// # Arguments
///
/// * `lua` - The Lua VM
/// * `entity_id` - The entity ID this script is attached to
/// * `entity_name` - The entity name
/// * `transform_state` - Shared transform state (uses Arc<Mutex> for thread-safe interior mutability)
/// * `scene` - Read-only scene reference for component access
/// * `mutation_buffer` - Buffer for queuing scene mutations
///
/// # Lua API
///
/// Creates a global `entity` table with:
/// - `entity.id` - Entity ID (read-only number)
/// - `entity.name` - Entity name (read-only string)
/// - `entity.transform` - Transform table with getters and setters
/// - `entity:hasComponent(type)` - Check if component exists
/// - `entity:getComponent(type)` - Get component data as table
/// - `entity:setComponent(type, data)` - Set/update component (queued mutation)
/// - `entity:removeComponent(type)` - Remove component (queued mutation)
/// - `entity:destroy()` - Destroy entity (queued mutation)
/// - `entity:setActive(active)` - Set active state (queued mutation)
/// - `entity:isActive()` - Check if active (always true for now)
/// - `entity:getParent()` - Get parent entity ID
/// - `entity:getChildren()` - Get child entity IDs
/// - `entity:findChild(name)` - Find child by name
pub fn register_entity_api(
    lua: &Lua,
    entity_id: u64,
    entity_name: String,
    transform_state: Arc<Mutex<EntityTransformState>>,
    scene: Arc<Scene>,
    mutation_buffer: EntityMutationBuffer,
) -> LuaResult<()> {
    let entity_table = lua.create_table()?;

    // entity.id (read-only)
    entity_table.set("id", entity_id)?;

    // entity.name (read-only)
    entity_table.set("name", entity_name)?;

    // entity.transform table
    let transform_table = lua.create_table()?;

    // Getter: entity.transform.position
    {
        let state = transform_state.clone();
        let getter = lua.create_function(move |_, ()| {
            let s = state
                .lock()
                .map_err(|e| mlua::Error::RuntimeError(format!("Lock error: {}", e)))?;
            Ok((s.position.x, s.position.y, s.position.z))
        })?;
        transform_table.set("position", getter)?;
    }

    // Getter: entity.transform.rotation
    {
        let state = transform_state.clone();
        let getter = lua.create_function(move |_, ()| {
            let s = state
                .lock()
                .map_err(|e| mlua::Error::RuntimeError(format!("Lock error: {}", e)))?;
            Ok((
                s.rotation.x.to_radians(),
                s.rotation.y.to_radians(),
                s.rotation.z.to_radians(),
            ))
        })?;
        transform_table.set("rotation", getter)?;
    }

    // Getter: entity.transform.scale
    {
        let state = transform_state.clone();
        let getter = lua.create_function(move |_, ()| {
            let s = state
                .lock()
                .map_err(|e| mlua::Error::RuntimeError(format!("Lock error: {}", e)))?;
            Ok((s.scale.x, s.scale.y, s.scale.z))
        })?;
        transform_table.set("scale", getter)?;
    }

    // Setter: entity.transform:setPosition(x, y, z)
    {
        let state = transform_state.clone();
        transform_table.set(
            "setPosition",
            lua.create_function(move |_, (_self, x, y, z): (mlua::Value, f32, f32, f32)| {
                log::trace!("Lua: entity.transform:setPosition({}, {}, {})", x, y, z);
                let mut s = state
                    .lock()
                    .map_err(|e| mlua::Error::RuntimeError(format!("Lock error: {}", e)))?;
                s.position = Vec3::new(x, y, z);
                s.mark_dirty();
                Ok(())
            })?,
        )?;
    }

    // Setter: entity.transform:setRotation(x, y, z) - expects radians
    {
        let state = transform_state.clone();
        transform_table.set(
            "setRotation",
            lua.create_function(move |_, (_self, x, y, z): (mlua::Value, f32, f32, f32)| {
                log::trace!("Lua: entity.transform:setRotation({}, {}, {})", x, y, z);
                let mut s = state
                    .lock()
                    .map_err(|e| mlua::Error::RuntimeError(format!("Lock error: {}", e)))?;
                s.rotation = Vec3::new(x.to_degrees(), y.to_degrees(), z.to_degrees()); // Store as degrees
                s.mark_dirty();
                Ok(())
            })?,
        )?;
    }

    // Setter: entity.transform:setScale(x, y, z)
    {
        let state = transform_state.clone();
        transform_table.set(
            "setScale",
            lua.create_function(move |_, (_self, x, y, z): (mlua::Value, f32, f32, f32)| {
                log::trace!("Lua: entity.transform:setScale({}, {}, {})", x, y, z);
                let mut s = state
                    .lock()
                    .map_err(|e| mlua::Error::RuntimeError(format!("Lock error: {}", e)))?;
                s.scale = Vec3::new(x, y, z);
                s.mark_dirty();
                Ok(())
            })?,
        )?;
    }

    // Delta: entity.transform:translate(dx, dy, dz)
    {
        let state = transform_state.clone();
        transform_table.set(
            "translate",
            lua.create_function(
                move |_, (_self, dx, dy, dz): (mlua::Value, f32, f32, f32)| {
                    log::trace!("Lua: entity.transform:translate({}, {}, {})", dx, dy, dz);
                    let mut s = state
                        .lock()
                        .map_err(|e| mlua::Error::RuntimeError(format!("Lock error: {}", e)))?;
                    s.position += Vec3::new(dx, dy, dz);
                    s.mark_dirty();
                    Ok(())
                },
            )?,
        )?;
    }

    // Delta: entity.transform:rotate(dx, dy, dz) - expects radians
    {
        let state = transform_state.clone();
        transform_table.set(
            "rotate",
            lua.create_function(
                move |_, (_self, dx, dy, dz): (mlua::Value, f32, f32, f32)| {
                    log::debug!(
                        "Lua: entity.transform:rotate({}, {}, {}) called",
                        dx,
                        dy,
                        dz
                    );
                    let mut s = state
                        .lock()
                        .map_err(|e| mlua::Error::RuntimeError(format!("Lock error: {}", e)))?;
                    let old_rotation = s.rotation;
                    s.rotation += Vec3::new(dx.to_degrees(), dy.to_degrees(), dz.to_degrees()); // Add radians converted to degrees
                    s.mark_dirty();
                    log::debug!(
                        "Rotation updated from {:?} to {:?}",
                        old_rotation,
                        s.rotation
                    );
                    Ok(())
                },
            )?,
        )?;
    }

    entity_table.set("transform", transform_table)?;

    // Component access methods

    // entity:hasComponent(componentType)
    {
        let scene_clone = scene.clone();
        entity_table.set(
            "hasComponent",
            lua.create_function(move |_, (_self, component_type): (mlua::Value, String)| {
                use vibe_scene::EntityId;
                let eid = EntityId::new(entity_id);

                // Find entity in scene
                if let Some(entity) = scene_clone.find_entity(eid) {
                    Ok(entity.has_component(&component_type))
                } else {
                    log::warn!("Entity {} not found in scene", entity_id);
                    Ok(false)
                }
            })?,
        )?;
    }

    // entity:getComponent(componentType) - returns component data as Lua table
    {
        let scene_clone = scene.clone();
        entity_table.set(
            "getComponent",
            lua.create_function(move |lua, (_self, component_type): (mlua::Value, String)| {
                use vibe_scene::EntityId;
                let eid = EntityId::new(entity_id);

                // Find entity in scene
                if let Some(entity) = scene_clone.find_entity(eid) {
                    if let Some(component_value) = entity.get_component_raw(&component_type) {
                        // Convert JSON Value to Lua table
                        json_value_to_lua(lua, component_value)
                    } else {
                        Ok(mlua::Value::Nil)
                    }
                } else {
                    log::warn!("Entity {} not found in scene", entity_id);
                    Ok(mlua::Value::Nil)
                }
            })?,
        )?;
    }

    // Mutation methods

    // entity:setComponent(componentType, data) - queues mutation
    {
        let buffer = mutation_buffer.clone();
        entity_table.set(
            "setComponent",
            lua.create_function(
                move |lua, (_self, component_type, data): (mlua::Value, String, mlua::Table)| {
                    use vibe_scene::EntityId;
                    let eid = EntityId::new(entity_id);

                    // Convert Lua table to JSON Value
                    let json_value = lua_table_to_json(lua, data)?;

                    log::trace!(
                        "Lua: entity:setComponent('{}', {:?}) - queued",
                        component_type,
                        json_value
                    );

                    buffer.push(EntityMutation::SetComponent {
                        entity_id: eid,
                        component_type,
                        data: json_value,
                    });

                    Ok(())
                },
            )?,
        )?;
    }

    // entity:removeComponent(componentType) - queues mutation
    {
        let buffer = mutation_buffer.clone();
        entity_table.set(
            "removeComponent",
            lua.create_function(move |_, (_self, component_type): (mlua::Value, String)| {
                use vibe_scene::EntityId;
                let eid = EntityId::new(entity_id);

                log::trace!("Lua: entity:removeComponent('{}') - queued", component_type);

                buffer.push(EntityMutation::RemoveComponent {
                    entity_id: eid,
                    component_type,
                });

                Ok(())
            })?,
        )?;
    }

    // entity:destroy() - queues mutation
    {
        let buffer = mutation_buffer.clone();
        entity_table.set(
            "destroy",
            lua.create_function(move |_, _self: mlua::Value| {
                use vibe_scene::EntityId;
                let eid = EntityId::new(entity_id);

                log::trace!("Lua: entity:destroy() - queued for entity {}", entity_id);

                buffer.push(EntityMutation::DestroyEntity { entity_id: eid });

                Ok(())
            })?,
        )?;
    }

    // entity:setActive(active) - queues mutation (placeholder)
    {
        let buffer = mutation_buffer.clone();
        entity_table.set(
            "setActive",
            lua.create_function(move |_, (_self, active): (mlua::Value, bool)| {
                use vibe_scene::EntityId;
                let eid = EntityId::new(entity_id);

                log::trace!(
                    "Lua: entity:setActive({}) - queued (not yet implemented)",
                    active
                );

                buffer.push(EntityMutation::SetActive {
                    entity_id: eid,
                    active,
                });

                Ok(())
            })?,
        )?;
    }

    // entity:isActive() - always returns true for now
    {
        entity_table.set(
            "isActive",
            lua.create_function(move |_, _self: mlua::Value| {
                // TODO: Track entity active state
                Ok(true)
            })?,
        )?;
    }

    // Hierarchy methods

    // entity:getParent() - returns parent entity ID or nil
    {
        let scene_clone = scene.clone();
        entity_table.set(
            "getParent",
            lua.create_function(move |_, _self: mlua::Value| {
                use vibe_scene::EntityId;
                let eid = EntityId::new(entity_id);

                if let Some(entity) = scene_clone.find_entity(eid) {
                    if let Some(parent_id) = entity.parent_id() {
                        Ok(Some(parent_id.as_u64()))
                    } else {
                        Ok(None)
                    }
                } else {
                    log::warn!("Entity {} not found in scene", entity_id);
                    Ok(None)
                }
            })?,
        )?;
    }

    // entity:getChildren() - returns array of child entity IDs
    {
        let scene_clone = scene.clone();
        entity_table.set(
            "getChildren",
            lua.create_function(move |lua, _self: mlua::Value| {
                use vibe_scene::EntityId;
                let eid = EntityId::new(entity_id);

                let children_table = lua.create_table()?;
                let mut index = 1;

                // Find all entities whose parent is this entity
                for other_entity in &scene_clone.entities {
                    if let Some(parent_id) = other_entity.parent_id() {
                        if parent_id == eid {
                            if let Some(child_id) = other_entity.entity_id() {
                                children_table.set(index, child_id.as_u64())?;
                                index += 1;
                            }
                        }
                    }
                }

                Ok(children_table)
            })?,
        )?;
    }

    // entity:findChild(name) - find child by name, returns ID or nil
    {
        let scene_clone = scene.clone();
        entity_table.set(
            "findChild",
            lua.create_function(move |_, (_self, child_name): (mlua::Value, String)| {
                use vibe_scene::EntityId;
                let eid = EntityId::new(entity_id);

                // Find child with matching parent and name
                for other_entity in &scene_clone.entities {
                    if let Some(parent_id) = other_entity.parent_id() {
                        if parent_id == eid {
                            if let Some(ref name) = other_entity.name {
                                if name == &child_name {
                                    if let Some(child_id) = other_entity.entity_id() {
                                        return Ok(Some(child_id.as_u64()));
                                    }
                                }
                            }
                        }
                    }
                }

                Ok(None)
            })?,
        )?;
    }

    // Set as global 'entity'
    lua.globals().set("entity", entity_table)?;

    Ok(())
}

/// Convert Lua table to serde_json::Value
fn lua_table_to_json(lua: &Lua, table: mlua::Table) -> LuaResult<Value> {
    let mut map = serde_json::Map::new();

    for pair in table.pairs::<mlua::Value, mlua::Value>() {
        let (key, value) = pair?;

        // Convert key to string
        let key_str = match key {
            mlua::Value::String(s) => s.to_str()?.to_string(),
            mlua::Value::Integer(i) => i.to_string(),
            mlua::Value::Number(n) => n.to_string(),
            _ => continue, // Skip non-string/numeric keys
        };

        // Convert value to JSON
        let json_value = lua_value_to_json(lua, value)?;
        map.insert(key_str, json_value);
    }

    Ok(Value::Object(map))
}

/// Convert any Lua value to serde_json::Value
fn lua_value_to_json(lua: &Lua, value: mlua::Value) -> LuaResult<Value> {
    match value {
        mlua::Value::Nil => Ok(Value::Null),
        mlua::Value::Boolean(b) => Ok(Value::Bool(b)),
        mlua::Value::Integer(i) => Ok(serde_json::json!(i)),
        mlua::Value::Number(n) => Ok(serde_json::json!(n)),
        mlua::Value::String(s) => Ok(Value::String(s.to_str()?.to_string())),
        mlua::Value::Table(t) => {
            // Check if it's an array or object
            let len = t.len()?;
            if len > 0 {
                // Looks like an array
                let mut arr = Vec::new();
                for i in 1..=len {
                    let val: mlua::Value = t.get(i)?;
                    arr.push(lua_value_to_json(lua, val)?);
                }
                Ok(Value::Array(arr))
            } else {
                // Object
                lua_table_to_json(lua, t)
            }
        }
        _ => Ok(Value::Null), // Unsupported types become null
    }
}

/// Convert serde_json::Value to mlua::Value
fn json_value_to_lua(lua: &Lua, value: &Value) -> LuaResult<mlua::Value> {
    match value {
        Value::Null => Ok(mlua::Value::Nil),
        Value::Bool(b) => Ok(mlua::Value::Boolean(*b)),
        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                Ok(mlua::Value::Integer(i))
            } else if let Some(f) = n.as_f64() {
                Ok(mlua::Value::Number(f))
            } else {
                Ok(mlua::Value::Nil)
            }
        }
        Value::String(s) => Ok(mlua::Value::String(lua.create_string(s)?)),
        Value::Array(arr) => {
            let table = lua.create_table()?;
            for (i, item) in arr.iter().enumerate() {
                table.set(i + 1, json_value_to_lua(lua, item)?)?; // Lua arrays are 1-indexed
            }
            Ok(mlua::Value::Table(table))
        }
        Value::Object(obj) => {
            let table = lua.create_table()?;
            for (key, val) in obj.iter() {
                table.set(key.as_str(), json_value_to_lua(lua, val)?)?;
            }
            Ok(mlua::Value::Table(table))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use std::f32::consts::{FRAC_PI_2, FRAC_PI_4};
    use vibe_scene::{Entity, Metadata, Scene};

    /// Helper: Create a test scene with a single entity
    fn create_test_scene(entity_id: u64, entity_name: &str) -> Arc<Scene> {
        let mut components = HashMap::new();
        components.insert(
            "Transform".to_string(),
            serde_json::json!({
                "position": [1.0, 2.0, 3.0],
                "rotation": [90.0, 45.0, 0.0],
                "scale": [2.0, 2.0, 2.0]
            }),
        );
        components.insert(
            "MeshRenderer".to_string(),
            serde_json::json!({
                "meshId": "mesh-123",
                "materialId": "material-456"
            }),
        );

        let entity = Entity {
            id: Some(entity_id as u32),
            persistent_id: None,
            name: Some(entity_name.to_string()),
            parent_persistent_id: None,
            tags: vec![],
            components,
        };

        Arc::new(Scene {
            version: 1,
            name: "Test Scene".to_string(),
            entities: vec![entity],
            materials: vec![],
            meshes: None,
            metadata: None,
            inputAssets: None,
            lockedEntityIds: None,
        })
    }

    /// Helper: Create a test scene with parent-child hierarchy
    fn create_hierarchy_scene() -> Arc<Scene> {
        // Parent entity (ID 1, persistentId "parent-1")
        let mut parent_components = HashMap::new();
        parent_components.insert("Transform".to_string(), serde_json::json!({}));

        let parent = Entity {
            id: Some(1),
            persistent_id: Some("parent-1".to_string()),
            name: Some("Parent".to_string()),
            parent_persistent_id: None,
            tags: vec![],
            components: parent_components,
        };

        // Child entity (ID 2, points to parent via persistentId)
        let mut child_components = HashMap::new();
        child_components.insert("Transform".to_string(), serde_json::json!({}));

        let child = Entity {
            id: Some(2),
            persistent_id: Some("child-2".to_string()),
            name: Some("Child".to_string()),
            parent_persistent_id: Some("parent-1".to_string()), // Points to parent's persistentId
            tags: vec![],
            components: child_components,
        };

        // Second child (ID 3, also points to parent)
        let mut child2_components = HashMap::new();
        child2_components.insert("Transform".to_string(), serde_json::json!({}));

        let child2 = Entity {
            id: Some(3),
            persistent_id: Some("child-3".to_string()),
            name: Some("ChildTwo".to_string()),
            parent_persistent_id: Some("parent-1".to_string()),
            tags: vec![],
            components: child2_components,
        };

        Arc::new(Scene {
            version: 1,
            name: "Test Scene".to_string(),
            entities: vec![parent, child, child2],
            materials: vec![],
            meshes: None,
            metadata: None,
            inputAssets: None,
            lockedEntityIds: None,
        })
    }

    #[test]
    fn test_register_entity_api() {
        let lua = Lua::new();
        let transform_state = Arc::new(Mutex::new(EntityTransformState::default()));
        let scene = create_test_scene(42, "TestEntity");
        let mutation_buffer = EntityMutationBuffer::new();

        register_entity_api(
            &lua,
            42,
            "TestEntity".to_string(),
            transform_state.clone(),
            scene,
            mutation_buffer,
        )
        .unwrap();

        // Test entity.id
        let id: u32 = lua.load("return entity.id").eval().unwrap();
        assert_eq!(id, 42);

        // Test entity.name
        let name: String = lua.load("return entity.name").eval().unwrap();
        assert_eq!(name, "TestEntity");
    }

    #[test]
    fn test_transform_getters() {
        let lua = Lua::new();
        let mut state = EntityTransformState::default();
        state.position = Vec3::new(1.0, 2.0, 3.0);
        state.rotation = Vec3::new(90.0, 45.0, 0.0);
        state.scale = Vec3::new(2.0, 2.0, 2.0);

        let transform_state = Arc::new(Mutex::new(state));
        let scene = create_test_scene(1, "Test");
        let mutation_buffer = EntityMutationBuffer::new();
        register_entity_api(
            &lua,
            1,
            "Test".to_string(),
            transform_state,
            scene,
            mutation_buffer,
        )
        .unwrap();

        // Test position getter
        let (x, y, z): (f32, f32, f32) = lua
            .load("return entity.transform.position()")
            .eval()
            .unwrap();
        assert_eq!((x, y, z), (1.0, 2.0, 3.0));

        // Test rotation getter
        let (rx, ry, rz): (f32, f32, f32) = lua
            .load("return entity.transform.rotation()")
            .eval()
            .unwrap();
        assert!((rx - FRAC_PI_2).abs() < 1e-4);
        assert!((ry - FRAC_PI_4).abs() < 1e-4);
        assert!(rz.abs() < 1e-4);

        // Test scale getter
        let (sx, sy, sz): (f32, f32, f32) =
            lua.load("return entity.transform.scale()").eval().unwrap();
        assert_eq!((sx, sy, sz), (2.0, 2.0, 2.0));
    }

    #[test]
    fn test_transform_setters() {
        let lua = Lua::new();
        let transform_state = Arc::new(Mutex::new(EntityTransformState::default()));
        let scene = create_test_scene(1, "Test");
        let mutation_buffer = EntityMutationBuffer::new();
        register_entity_api(
            &lua,
            1,
            "Test".to_string(),
            transform_state.clone(),
            scene,
            mutation_buffer,
        )
        .unwrap();

        // Test setPosition
        lua.load("entity.transform:setPosition(5, 10, 15)")
            .exec()
            .unwrap();
        let state = transform_state.lock().unwrap();
        assert_eq!(state.position, Vec3::new(5.0, 10.0, 15.0));
        drop(state);

        // Test setRotation
        lua.load("entity.transform:setRotation(math.rad(90), 0, math.rad(45))")
            .exec()
            .unwrap();
        let state = transform_state.lock().unwrap();
        assert_eq!(state.rotation, Vec3::new(90.0, 0.0, 45.0));
        drop(state);

        // Test setScale
        lua.load("entity.transform:setScale(2, 3, 4)")
            .exec()
            .unwrap();
        let state = transform_state.lock().unwrap();
        assert_eq!(state.scale, Vec3::new(2.0, 3.0, 4.0));
    }

    #[test]
    fn test_transform_delta_methods() {
        let lua = Lua::new();
        let mut state = EntityTransformState::default();
        state.position = Vec3::new(1.0, 2.0, 3.0);
        state.rotation = Vec3::new(0.0, 0.0, 0.0);

        let transform_state = Arc::new(Mutex::new(state));
        let scene = create_test_scene(1, "Test");
        let mutation_buffer = EntityMutationBuffer::new();
        register_entity_api(
            &lua,
            1,
            "Test".to_string(),
            transform_state.clone(),
            scene,
            mutation_buffer,
        )
        .unwrap();

        // Test translate
        lua.load("entity.transform:translate(5, 10, 15)")
            .exec()
            .unwrap();
        let state = transform_state.lock().unwrap();
        assert_eq!(state.position, Vec3::new(6.0, 12.0, 18.0));
        drop(state);

        // Test rotate
        lua.load("entity.transform:rotate(math.rad(90), math.rad(45), 0)")
            .exec()
            .unwrap();
        let state = transform_state.lock().unwrap();
        assert_eq!(state.rotation, Vec3::new(90.0, 45.0, 0.0));
    }

    #[test]
    fn test_transform_state_conversion() {
        // Test from_transform
        let transform = Transform {
            position: Some([1.0, 2.0, 3.0]),
            rotation: Some(vec![90.0, 45.0, 0.0]),
            scale: Some([2.0, 3.0, 4.0]),
        };

        let state = EntityTransformState::from_transform(&transform);
        assert_eq!(state.position, Vec3::new(1.0, 2.0, 3.0));
        assert_eq!(state.rotation, Vec3::new(90.0, 45.0, 0.0));
        assert_eq!(state.scale, Vec3::new(2.0, 3.0, 4.0));

        // Test to_transform
        let back_to_transform = state.to_transform();
        assert_eq!(back_to_transform.position, Some([1.0, 2.0, 3.0]));
        assert_eq!(back_to_transform.rotation, Some(vec![90.0, 45.0, 0.0]));
        assert_eq!(back_to_transform.scale, Some([2.0, 3.0, 4.0]));
    }

    #[test]
    fn test_has_component() {
        let lua = Lua::new();
        let transform_state = Arc::new(Mutex::new(EntityTransformState::default()));
        let scene = create_test_scene(1, "Test");
        let mutation_buffer = EntityMutationBuffer::new();

        register_entity_api(
            &lua,
            1,
            "Test".to_string(),
            transform_state,
            scene,
            mutation_buffer,
        )
        .unwrap();

        // Test hasComponent for existing component
        let has_transform: bool = lua
            .load("return entity:hasComponent('Transform')")
            .eval()
            .unwrap();
        assert!(has_transform);

        let has_mesh: bool = lua
            .load("return entity:hasComponent('MeshRenderer')")
            .eval()
            .unwrap();
        assert!(has_mesh);

        // Test hasComponent for non-existing component
        let has_camera: bool = lua
            .load("return entity:hasComponent('Camera')")
            .eval()
            .unwrap();
        assert!(!has_camera);
    }

    #[test]
    fn test_get_component() {
        let lua = Lua::new();
        let transform_state = Arc::new(Mutex::new(EntityTransformState::default()));
        let scene = create_test_scene(1, "Test");
        let mutation_buffer = EntityMutationBuffer::new();

        register_entity_api(
            &lua,
            1,
            "Test".to_string(),
            transform_state,
            scene,
            mutation_buffer,
        )
        .unwrap();

        // Test getComponent for Transform
        lua.load(
            r#"
            local transform = entity:getComponent('Transform')
            assert(transform ~= nil, "Transform should not be nil")
            assert(transform.position ~= nil, "Position should exist")
            assert(transform.position[1] == 1.0, "Position X should be 1.0")
            assert(transform.position[2] == 2.0, "Position Y should be 2.0")
            assert(transform.position[3] == 3.0, "Position Z should be 3.0")
        "#,
        )
        .exec()
        .unwrap();

        // Test getComponent for MeshRenderer
        lua.load(
            r#"
            local mesh = entity:getComponent('MeshRenderer')
            assert(mesh ~= nil, "MeshRenderer should not be nil")
            assert(mesh.meshId == "mesh-123", "Mesh ID should match")
            assert(mesh.materialId == "material-456", "Material ID should match")
        "#,
        )
        .exec()
        .unwrap();

        // Test getComponent for non-existing component
        lua.load(
            r#"
            local camera = entity:getComponent('Camera')
            assert(camera == nil, "Camera component should be nil")
        "#,
        )
        .exec()
        .unwrap();
    }

    #[test]
    fn test_json_value_to_lua_conversion() {
        let lua = Lua::new();

        // Test null
        let result = json_value_to_lua(&lua, &serde_json::Value::Null).unwrap();
        assert!(matches!(result, mlua::Value::Nil));

        // Test boolean
        let result = json_value_to_lua(&lua, &serde_json::Value::Bool(true)).unwrap();
        assert!(matches!(result, mlua::Value::Boolean(true)));

        // Test number (integer)
        let result = json_value_to_lua(&lua, &serde_json::json!(42)).unwrap();
        if let mlua::Value::Integer(n) = result {
            assert_eq!(n, 42);
        } else {
            panic!("Expected integer");
        }

        // Test number (float)
        let result = json_value_to_lua(&lua, &serde_json::json!(3.14)).unwrap();
        if let mlua::Value::Number(n) = result {
            assert!((n - 3.14).abs() < 1e-6);
        } else {
            panic!("Expected number");
        }

        // Test string
        let result = json_value_to_lua(&lua, &serde_json::json!("hello")).unwrap();
        if let mlua::Value::String(s) = result {
            assert_eq!(s.to_str().unwrap(), "hello");
        } else {
            panic!("Expected string");
        }

        // Test array
        let result = json_value_to_lua(&lua, &serde_json::json!([1, 2, 3])).unwrap();
        if let mlua::Value::Table(t) = result {
            let v1: i64 = t.get(1).unwrap();
            let v2: i64 = t.get(2).unwrap();
            let v3: i64 = t.get(3).unwrap();
            assert_eq!(v1, 1);
            assert_eq!(v2, 2);
            assert_eq!(v3, 3);
        } else {
            panic!("Expected table");
        }

        // Test object
        let result = json_value_to_lua(&lua, &serde_json::json!({"key": "value"})).unwrap();
        if let mlua::Value::Table(t) = result {
            let val: String = t.get("key").unwrap();
            assert_eq!(val, "value");
        } else {
            panic!("Expected table");
        }
    }

    // ====== Mutation Tests ======

    #[test]
    fn test_set_component_mutation() {
        let lua = Lua::new();
        let transform_state = Arc::new(Mutex::new(EntityTransformState::default()));
        let scene = create_test_scene(1, "Test");
        let mutation_buffer = EntityMutationBuffer::new();

        register_entity_api(
            &lua,
            1,
            "Test".to_string(),
            transform_state,
            scene,
            mutation_buffer.clone(),
        )
        .unwrap();

        // Queue a setComponent mutation
        lua.load(
            r#"
            entity:setComponent('Camera', {
                fov = 60,
                near = 0.1,
                far = 1000
            })
        "#,
        )
        .exec()
        .unwrap();

        // Verify mutation was queued
        let mutations = mutation_buffer.drain();
        assert_eq!(mutations.len(), 1);

        match &mutations[0] {
            EntityMutation::SetComponent {
                entity_id,
                component_type,
                data,
            } => {
                assert_eq!(entity_id.as_u64(), 1);
                assert_eq!(component_type, "Camera");
                assert_eq!(data["fov"], 60);
                assert_eq!(data["near"], 0.1);
                assert_eq!(data["far"], 1000);
            }
            _ => panic!("Expected SetComponent mutation"),
        }
    }

    #[test]
    fn test_remove_component_mutation() {
        let lua = Lua::new();
        let transform_state = Arc::new(Mutex::new(EntityTransformState::default()));
        let scene = create_test_scene(1, "Test");
        let mutation_buffer = EntityMutationBuffer::new();

        register_entity_api(
            &lua,
            1,
            "Test".to_string(),
            transform_state,
            scene,
            mutation_buffer.clone(),
        )
        .unwrap();

        // Queue a removeComponent mutation
        lua.load("entity:removeComponent('MeshRenderer')")
            .exec()
            .unwrap();

        // Verify mutation was queued
        let mutations = mutation_buffer.drain();
        assert_eq!(mutations.len(), 1);

        match &mutations[0] {
            EntityMutation::RemoveComponent {
                entity_id,
                component_type,
            } => {
                assert_eq!(entity_id.as_u64(), 1);
                assert_eq!(component_type, "MeshRenderer");
            }
            _ => panic!("Expected RemoveComponent mutation"),
        }
    }

    #[test]
    fn test_destroy_entity_mutation() {
        let lua = Lua::new();
        let transform_state = Arc::new(Mutex::new(EntityTransformState::default()));
        let scene = create_test_scene(1, "Test");
        let mutation_buffer = EntityMutationBuffer::new();

        register_entity_api(
            &lua,
            1,
            "Test".to_string(),
            transform_state,
            scene,
            mutation_buffer.clone(),
        )
        .unwrap();

        // Queue a destroy mutation
        lua.load("entity:destroy()").exec().unwrap();

        // Verify mutation was queued
        let mutations = mutation_buffer.drain();
        assert_eq!(mutations.len(), 1);

        match &mutations[0] {
            EntityMutation::DestroyEntity { entity_id } => {
                assert_eq!(entity_id.as_u64(), 1);
            }
            _ => panic!("Expected DestroyEntity mutation"),
        }
    }

    #[test]
    fn test_set_active_mutation() {
        let lua = Lua::new();
        let transform_state = Arc::new(Mutex::new(EntityTransformState::default()));
        let scene = create_test_scene(1, "Test");
        let mutation_buffer = EntityMutationBuffer::new();

        register_entity_api(
            &lua,
            1,
            "Test".to_string(),
            transform_state,
            scene,
            mutation_buffer.clone(),
        )
        .unwrap();

        // Queue a setActive mutation
        lua.load("entity:setActive(false)").exec().unwrap();

        // Verify mutation was queued
        let mutations = mutation_buffer.drain();
        assert_eq!(mutations.len(), 1);

        match &mutations[0] {
            EntityMutation::SetActive { entity_id, active } => {
                assert_eq!(entity_id.as_u64(), 1);
                assert_eq!(*active, false);
            }
            _ => panic!("Expected SetActive mutation"),
        }
    }

    #[test]
    fn test_is_active() {
        let lua = Lua::new();
        let transform_state = Arc::new(Mutex::new(EntityTransformState::default()));
        let scene = create_test_scene(1, "Test");
        let mutation_buffer = EntityMutationBuffer::new();

        register_entity_api(
            &lua,
            1,
            "Test".to_string(),
            transform_state,
            scene,
            mutation_buffer,
        )
        .unwrap();

        // Test isActive (always returns true for now)
        let is_active: bool = lua.load("return entity:isActive()").eval().unwrap();
        assert!(is_active);
    }

    #[test]
    fn test_multiple_mutations_queued() {
        let lua = Lua::new();
        let transform_state = Arc::new(Mutex::new(EntityTransformState::default()));
        let scene = create_test_scene(1, "Test");
        let mutation_buffer = EntityMutationBuffer::new();

        register_entity_api(
            &lua,
            1,
            "Test".to_string(),
            transform_state,
            scene,
            mutation_buffer.clone(),
        )
        .unwrap();

        // Queue multiple mutations
        lua.load(
            r#"
            entity:setComponent('Camera', { fov = 60 })
            entity:removeComponent('MeshRenderer')
            entity:setActive(false)
        "#,
        )
        .exec()
        .unwrap();

        // Verify all mutations were queued
        let mutations = mutation_buffer.drain();
        assert_eq!(mutations.len(), 3);

        assert!(matches!(mutations[0], EntityMutation::SetComponent { .. }));
        assert!(matches!(
            mutations[1],
            EntityMutation::RemoveComponent { .. }
        ));
        assert!(matches!(mutations[2], EntityMutation::SetActive { .. }));
    }

    // ====== Hierarchy Tests ======

    #[test]
    fn test_get_parent() {
        let lua = Lua::new();
        let transform_state = Arc::new(Mutex::new(EntityTransformState::default()));
        let scene = create_hierarchy_scene();
        let mutation_buffer = EntityMutationBuffer::new();

        // Get the actual EntityId for child (from persistentId "child-2")
        let child_entity = scene
            .entities
            .iter()
            .find(|e| e.name.as_deref() == Some("Child"))
            .unwrap();
        let child_id = child_entity.entity_id().unwrap();

        // Register API with child's actual EntityId
        register_entity_api(
            &lua,
            child_id.as_u64(),
            "Child".to_string(),
            transform_state,
            scene,
            mutation_buffer,
        )
        .unwrap();

        // Child should return some parent ID
        let parent_id: Option<u64> = lua.load("return entity:getParent()").eval().unwrap();
        assert!(parent_id.is_some(), "Child entity should have a parent");
    }

    #[test]
    fn test_get_parent_returns_nil_for_root() {
        let lua = Lua::new();
        let transform_state = Arc::new(Mutex::new(EntityTransformState::default()));
        let scene = create_hierarchy_scene();
        let mutation_buffer = EntityMutationBuffer::new();

        // Get the actual EntityId for parent (from persistentId "parent-1")
        let parent_entity = scene
            .entities
            .iter()
            .find(|e| e.name.as_deref() == Some("Parent"))
            .unwrap();
        let parent_id = parent_entity.entity_id().unwrap();

        // Test parent entity which has no parent
        register_entity_api(
            &lua,
            parent_id.as_u64(),
            "Parent".to_string(),
            transform_state,
            scene,
            mutation_buffer,
        )
        .unwrap();

        // Parent should return nil
        let result_parent_id: Option<u64> = lua.load("return entity:getParent()").eval().unwrap();
        assert_eq!(result_parent_id, None);
    }

    #[test]
    fn test_get_children() {
        let lua = Lua::new();
        let transform_state = Arc::new(Mutex::new(EntityTransformState::default()));
        let scene = create_hierarchy_scene();
        let mutation_buffer = EntityMutationBuffer::new();

        // Get the actual EntityId for parent (from persistentId "parent-1")
        let parent_entity = scene
            .entities
            .iter()
            .find(|e| e.name.as_deref() == Some("Parent"))
            .unwrap();
        let parent_id = parent_entity.entity_id().unwrap();

        // Test parent entity which has 2 children
        register_entity_api(
            &lua,
            parent_id.as_u64(),
            "Parent".to_string(),
            transform_state,
            scene,
            mutation_buffer,
        )
        .unwrap();

        // Parent should return array of 2 child IDs
        lua.load(
            r#"
            local children = entity:getChildren()
            assert(#children == 2, "Should have 2 children")
        "#,
        )
        .exec()
        .unwrap();
    }

    #[test]
    fn test_get_children_returns_empty_for_leaf() {
        let lua = Lua::new();
        let transform_state = Arc::new(Mutex::new(EntityTransformState::default()));
        let scene = create_hierarchy_scene();
        let mutation_buffer = EntityMutationBuffer::new();

        // Get the actual EntityId for child (from persistentId "child-2")
        let child_entity = scene
            .entities
            .iter()
            .find(|e| e.name.as_deref() == Some("Child"))
            .unwrap();
        let child_id = child_entity.entity_id().unwrap();

        // Test child entity which has no children
        register_entity_api(
            &lua,
            child_id.as_u64(),
            "Child".to_string(),
            transform_state,
            scene,
            mutation_buffer,
        )
        .unwrap();

        // Child should return empty array
        lua.load(
            r#"
            local children = entity:getChildren()
            assert(#children == 0, "Should have no children")
        "#,
        )
        .exec()
        .unwrap();
    }

    #[test]
    fn test_find_child() {
        let lua = Lua::new();
        let transform_state = Arc::new(Mutex::new(EntityTransformState::default()));
        let scene = create_hierarchy_scene();
        let mutation_buffer = EntityMutationBuffer::new();

        // Get the actual EntityId for parent (from persistentId "parent-1")
        let parent_entity = scene
            .entities
            .iter()
            .find(|e| e.name.as_deref() == Some("Parent"))
            .unwrap();
        let parent_id = parent_entity.entity_id().unwrap();

        // Test parent entity
        register_entity_api(
            &lua,
            parent_id.as_u64(),
            "Parent".to_string(),
            transform_state,
            scene,
            mutation_buffer,
        )
        .unwrap();

        // Find child by name - should return some ID (exact value depends on hash)
        let child_id: Option<u64> = lua.load("return entity:findChild('Child')").eval().unwrap();
        assert!(child_id.is_some(), "Should find child named 'Child'");

        let child2_id: Option<u64> = lua
            .load("return entity:findChild('ChildTwo')")
            .eval()
            .unwrap();
        assert!(child2_id.is_some(), "Should find child named 'ChildTwo'");

        // Ensure they are different children
        assert_ne!(
            child_id, child2_id,
            "Child and ChildTwo should have different IDs"
        );

        // Non-existent child should return nil
        let not_found: Option<u64> = lua
            .load("return entity:findChild('NonExistent')")
            .eval()
            .unwrap();
        assert_eq!(not_found, None);
    }

    // ====== Lua-to-JSON Conversion Tests ======

    #[test]
    fn test_lua_to_json_conversion() {
        let lua = Lua::new();

        // Test simple object
        let table = lua
            .load(
                r#"
            return {
                name = "TestEntity",
                health = 100,
                active = true
            }
        "#,
            )
            .eval::<mlua::Table>()
            .unwrap();

        let json = lua_table_to_json(&lua, table).unwrap();
        assert_eq!(json["name"], "TestEntity");
        assert_eq!(json["health"], 100);
        assert_eq!(json["active"], true);

        // Test nested object
        let table = lua
            .load(
                r#"
            return {
                position = {
                    x = 1.0,
                    y = 2.0,
                    z = 3.0
                }
            }
        "#,
            )
            .eval::<mlua::Table>()
            .unwrap();

        let json = lua_table_to_json(&lua, table).unwrap();
        assert_eq!(json["position"]["x"], 1.0);
        assert_eq!(json["position"]["y"], 2.0);
        assert_eq!(json["position"]["z"], 3.0);

        // Test array
        let table = lua.load("return {1, 2, 3}").eval::<mlua::Table>().unwrap();
        let value = mlua::Value::Table(table);
        let json = lua_value_to_json(&lua, value).unwrap();
        if let Value::Array(arr) = json {
            assert_eq!(arr.len(), 3);
            assert_eq!(arr[0], 1);
            assert_eq!(arr[1], 2);
            assert_eq!(arr[2], 3);
        } else {
            panic!("Expected array");
        }
    }
}
