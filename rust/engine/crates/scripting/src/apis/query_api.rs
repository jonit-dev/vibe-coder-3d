//! Query API for Lua scripts
//!
//! Provides entity querying capabilities for game scripts.
//! - Find entities by name
//! - Find entities by tag
//! - Raycast operations (TODO: requires physics integration)

use glam::Vec3;
use mlua::prelude::*;
use std::sync::Arc;
use vibe_scene::Scene;

use crate::apis::query_helpers::{create_hit_table, parse_vec3_from_table};

/// Trait for BVH raycasting functionality
pub trait BvhRaycaster: Send + Sync {
    /// Perform raycast and return the closest hit
    fn raycast_first(&mut self, origin: Vec3, dir: Vec3, max_distance: f32) -> Option<RaycastHit>;

    /// Perform raycast and return all hits (sorted by distance)
    fn raycast_all(&mut self, origin: Vec3, dir: Vec3, max_distance: f32) -> Vec<RaycastHit>;
}

/// Raycast hit result that can be passed to Lua
#[derive(Debug, Clone)]
pub struct RaycastHit {
    /// Entity ID that was hit
    pub entity_id: u64,
    /// Distance from ray origin to hit point
    pub distance: f32,
    /// Hit point in world space
    pub point: Vec3,
    /// Barycentric coordinates on the triangle (u, v, w where u+v+w=1)
    pub barycentric: (f32, f32, f32),
    /// Triangle index within the mesh
    pub triangle_index: usize,
}

/// Register query API in Lua global scope
///
/// Provides:
/// - `query.findByName(name: string): number[]` - Find entities by name
/// - `query.findByTag(tag: string): number[]` - Find entities by tag
/// - `query.raycastFirst(origin: table, dir: table, max_distance?: number): table|nil` - Raycast for closest hit
/// - `query.raycastAll(origin: table, dir: table, max_distance?: number): table[]` - Raycast for all hits
///
/// # Arguments
///
/// * `lua` - The Lua VM
/// * `scene` - The loaded scene to query
/// * `bvh_manager` - Optional BVH manager for accelerated raycasting
///
/// # Example Lua usage
///
/// ```lua
/// -- Find all entities named "Player"
/// local playerIds = query.findByName("Player")
/// for i, id in ipairs(playerIds) do
///     console.log("Found player: " .. id)
/// end
///
/// -- Raycast from camera position
/// local cameraPos = {0, 2, 5}
/// local cameraDir = {0, 0, -1}
/// local hit = query.raycastFirst(cameraPos, cameraDir, 100)
/// if hit then
///     console.log("Hit entity: " .. hit.entityId .. " at distance: " .. hit.distance)
/// end
/// ```
pub fn register_query_api(lua: &Lua, scene: Arc<Scene>) -> LuaResult<()> {
    register_query_api_with_bvh(lua, scene, None)
}

/// Register query API with BVH raycaster for accelerated raycasting
pub fn register_query_api_with_bvh(
    lua: &Lua,
    scene: Arc<Scene>,
    bvh_raycasters: Option<Arc<std::sync::Mutex<dyn BvhRaycaster>>>,
) -> LuaResult<()> {
    let globals = lua.globals();
    let query = lua.create_table()?;

    // findByName - Find entities by name
    {
        let scene_clone = Arc::clone(&scene);
        query.set(
            "findByName",
            lua.create_function(move |lua, name: String| {
                log::debug!("Query: Finding entities by name: {}", name);

                let mut found_ids = Vec::new();

                for entity in &scene_clone.entities {
                    if let Some(entity_name) = &entity.name {
                        if entity_name == &name {
                            // Return the entity's numeric ID or persistent ID hash
                            if let Some(entity_id) = entity.entity_id() {
                                found_ids.push(entity_id.as_u64());
                            }
                        }
                    }
                }

                log::debug!("Found {} entities with name '{}'", found_ids.len(), name);

                // Convert to Lua table
                let result = lua.create_table()?;
                for (i, id) in found_ids.iter().enumerate() {
                    result.set(i + 1, *id)?; // Lua arrays are 1-indexed
                }

                Ok(result)
            })?,
        )?;
    }

    // findByTag - Find entities by tag
    {
        let scene_clone = Arc::clone(&scene);
        query.set(
            "findByTag",
            lua.create_function(move |lua, tag: String| {
                log::debug!("Query: Finding entities by tag: {}", tag);
                let mut found_ids = Vec::new();

                // Normalize tag for comparison (lowercase)
                let normalized_tag = tag.to_lowercase();

                for entity in &scene_clone.entities {
                    // Check if entity has the tag
                    if entity
                        .tags
                        .iter()
                        .any(|t| t.to_lowercase() == normalized_tag)
                    {
                        if let Some(entity_id) = entity.entity_id() {
                            found_ids.push(entity_id.as_u64());
                        }
                    }
                }

                // Convert to Lua table (1-indexed)
                let result = lua.create_table()?;
                for (i, id) in found_ids.iter().enumerate() {
                    result.set(i + 1, *id)?;
                }

                log::debug!("Found {} entities with tag '{}'", found_ids.len(), tag);
                Ok(result)
            })?,
        )?;
    }

    // raycastFirst - Raycast and find first hit
    {
        let scene_clone = Arc::clone(&scene);
        let bvh_clone = bvh_raycasters.clone();
        query.set(
            "raycastFirst",
            lua.create_function(
                move |lua, (origin, dir, max_distance): (LuaTable, LuaTable, Option<f32>)| {
                    log::debug!("Query: raycastFirst called");

                    // Parse origin and direction from Lua tables
                    let origin_vec = parse_vec3_from_table(&origin)?;
                    let dir_vec = parse_vec3_from_table(&dir)?;
                    let max_dist = max_distance.unwrap_or(1000.0);

                    // Use BVH accelerated raycasting if available
                    if let Some(bvh_raycasters) = &bvh_clone {
                        let mut raycaster = bvh_raycasters.lock().unwrap();
                        if let Some(hit) = raycaster.raycast_first(origin_vec, dir_vec, max_dist) {
                            return create_hit_table(lua, &hit);
                        }
                    }

                    // Fallback: simple scene-based raycasting (stub)
                    log::warn!("BVH raycasting not available, using stub implementation");
                    Ok(lua.create_table()?) // Return empty table instead of nil
                },
            )?,
        )?;
    }

    // raycastAll - Raycast and find all hits
    {
        let scene_clone = Arc::clone(&scene);
        let bvh_clone = bvh_raycasters.clone();
        query.set(
            "raycastAll",
            lua.create_function(
                move |lua, (origin, dir, max_distance): (LuaTable, LuaTable, Option<f32>)| {
                    log::debug!("Query: raycastAll called");

                    // Parse origin and direction from Lua tables
                    let origin_vec = parse_vec3_from_table(&origin)?;
                    let dir_vec = parse_vec3_from_table(&dir)?;
                    let max_dist = max_distance.unwrap_or(1000.0);

                    // Use BVH accelerated raycasting if available
                    if let Some(bvh_raycasters) = &bvh_clone {
                        let mut raycaster = bvh_raycasters.lock().unwrap();
                        let hits = raycaster.raycast_all(origin_vec, dir_vec, max_dist);

                        let result = lua.create_table()?;
                        for (i, hit) in hits.iter().enumerate() {
                            let hit_table = create_hit_table(lua, &hit)?;
                            result.set(i + 1, hit_table)?; // Lua arrays are 1-indexed
                        }
                        return Ok(result);
                    }

                    // Fallback: simple scene-based raycasting (stub)
                    log::warn!("BVH raycasting not available, using stub implementation");
                    lua.create_table()
                },
            )?,
        )?;
    }

    globals.set("query", query)?;
    log::debug!("Query API registered");
    Ok(())
}

#[cfg(test)]
mod query_api_test;
