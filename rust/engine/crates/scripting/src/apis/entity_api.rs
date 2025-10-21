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

use glam::{Quat, Vec3};
use mlua::prelude::*;
use std::sync::{Arc, Mutex};
use vibe_ecs_bridge::Transform;
use vibe_ecs_bridge::{position_to_vec3_opt, scale_to_vec3_opt};

/// Transform state that can be shared between Lua and Rust
///
/// Uses Arc<Mutex> for thread-safe interior mutability (required by mlua's Send constraint)
#[derive(Debug, Clone)]
pub struct EntityTransformState {
    pub position: Vec3,
    pub rotation: Vec3, // Stored as Euler degrees for TS compatibility
    pub scale: Vec3,
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
        }
    }

    pub fn to_transform(&self) -> Transform {
        Transform {
            position: Some([self.position.x, self.position.y, self.position.z]),
            rotation: Some(vec![self.rotation.x, self.rotation.y, self.rotation.z]),
            scale: Some([self.scale.x, self.scale.y, self.scale.z]),
        }
    }
}

impl Default for EntityTransformState {
    fn default() -> Self {
        Self {
            position: Vec3::ZERO,
            rotation: Vec3::ZERO,
            scale: Vec3::ONE,
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
///
/// # Lua API
///
/// Creates a global `entity` table with:
/// - `entity.id` - Entity ID (read-only number)
/// - `entity.name` - Entity name (read-only string)
/// - `entity.transform` - Transform table with getters and setters
pub fn register_entity_api(
    lua: &Lua,
    entity_id: u64,
    entity_name: String,
    transform_state: Arc<Mutex<EntityTransformState>>,
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
                    s.rotation += Vec3::new(
                        dx.to_degrees(),
                        dy.to_degrees(),
                        dz.to_degrees(),
                    ); // Add radians converted to degrees
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

    // Set as global 'entity'
    lua.globals().set("entity", entity_table)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f32::consts::{FRAC_PI_2, FRAC_PI_4};

    #[test]
    fn test_register_entity_api() {
        let lua = Lua::new();
        let transform_state = Arc::new(Mutex::new(EntityTransformState::default()));

        register_entity_api(&lua, 42, "TestEntity".to_string(), transform_state.clone()).unwrap();

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
        register_entity_api(&lua, 1, "Test".to_string(), transform_state).unwrap();

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
        register_entity_api(&lua, 1, "Test".to_string(), transform_state.clone()).unwrap();

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
        register_entity_api(&lua, 1, "Test".to_string(), transform_state.clone()).unwrap();

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
}
