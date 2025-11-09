//! Helper functions for Query API
//!
//! Provides utility functions for parsing Lua tables and creating hit results.

use super::query_api::RaycastHit;
use glam::Vec3;
use mlua::prelude::*;

/// Parse Vec3 from Lua table with indices 1, 2, 3 or keys x, y, z
pub fn parse_vec3_from_table(table: &LuaTable) -> LuaResult<Vec3> {
    // Try array format first: {x, y, z}
    if let Ok(x) = table.get::<f32>(1) {
        let y = table.get::<f32>(2)?;
        let z = table.get::<f32>(3)?;
        return Ok(Vec3::new(x, y, z));
    }

    // Try object format: {x = 0, y = 1, z = 2}
    if let Ok(x) = table.get::<f32>("x") {
        let y = table.get::<f32>("y")?;
        let z = table.get::<f32>("z")?;
        return Ok(Vec3::new(x, y, z));
    }

    Err(LuaError::runtime(
        "Invalid Vec3 table format. Expected {x, y, z} or {x=0, y=1, z=2}",
    ))
}

/// Create a Lua table representing a raycast hit result
pub fn create_hit_table(lua: &Lua, hit: &RaycastHit) -> LuaResult<LuaTable> {
    let result = lua.create_table()?;

    // Entity ID that was hit
    result.set("entityId", hit.entity_id)?;

    // Distance from ray origin to hit point
    result.set("distance", hit.distance)?;

    // Hit point in world space
    let point_table = lua.create_table()?;
    point_table.set(1, hit.point.x)?;
    point_table.set(2, hit.point.y)?;
    point_table.set(3, hit.point.z)?;
    result.set("point", point_table)?;

    // Barycentric coordinates on the triangle
    let barycentric_table = lua.create_table()?;
    barycentric_table.set(1, hit.barycentric.0)?;
    barycentric_table.set(2, hit.barycentric.1)?;
    barycentric_table.set(3, hit.barycentric.2)?;
    result.set("barycentric", barycentric_table)?;

    // Triangle index within the mesh
    result.set("triangleIndex", hit.triangle_index)?;

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use mlua::Lua;

    #[test]
    fn test_parse_vec3_array_format() {
        let lua = Lua::new();
        let table = lua.create_table().unwrap();
        table.set(1, 1.0).unwrap();
        table.set(2, 2.0).unwrap();
        table.set(3, 3.0).unwrap();

        let result = parse_vec3_from_table(&table).unwrap();
        assert_eq!(result, Vec3::new(1.0, 2.0, 3.0));
    }

    #[test]
    fn test_parse_vec3_object_format() {
        let lua = Lua::new();
        let table = lua.create_table().unwrap();
        table.set("x", 1.0).unwrap();
        table.set("y", 2.0).unwrap();
        table.set("z", 3.0).unwrap();

        let result = parse_vec3_from_table(&table).unwrap();
        assert_eq!(result, Vec3::new(1.0, 2.0, 3.0));
    }

    #[test]
    fn test_parse_vec3_invalid_format() {
        let lua = Lua::new();
        let table = lua.create_table().unwrap();
        table.set("invalid", 1.0).unwrap();

        let result = parse_vec3_from_table(&table);
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_vec3_empty_table() {
        let lua = Lua::new();
        let table = lua.create_table().unwrap();

        let result = parse_vec3_from_table(&table);
        assert!(result.is_err());
    }

    #[test]
    fn test_create_hit_table() {
        let lua = Lua::new();
        let hit = RaycastHit {
            entity_id: 42,
            distance: 5.5,
            point: Vec3::new(1.0, 2.0, 3.0),
            barycentric: (0.2, 0.3, 0.5),
            triangle_index: 7,
        };

        let result = create_hit_table(&lua, &hit).unwrap();

        assert_eq!(result.get::<_, u64>("entityId").unwrap(), 42);
        assert_eq!(result.get::<_, f32>("distance").unwrap(), 5.5);
        assert_eq!(result.get::<_, usize>("triangleIndex").unwrap(), 7);

        let point: LuaTable = result.get("point").unwrap();
        assert_eq!(point.get::<_, f32>(1).unwrap(), 1.0);
        assert_eq!(point.get::<_, f32>(2).unwrap(), 2.0);
        assert_eq!(point.get::<_, f32>(3).unwrap(), 3.0);

        let barycentric: LuaTable = result.get("barycentric").unwrap();
        assert_eq!(barycentric.get::<_, f32>(1).unwrap(), 0.2);
        assert_eq!(barycentric.get::<_, f32>(2).unwrap(), 0.3);
        assert_eq!(barycentric.get::<_, f32>(3).unwrap(), 0.5);
    }
}
