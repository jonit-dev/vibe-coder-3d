#[cfg(feature = "scripting-support")]
use vibe_scripting::apis::query_api::{
    BvhRaycaster as ScriptingBvhRaycaster, RaycastHit as ScriptingRaycastHit,
};

use crate::spatial::bvh_manager::{BvhManager, RaycastHit};
use glam::Vec3;

#[cfg(feature = "scripting-support")]
/// Adapter that implements the scripting BvhRaycaster trait for our BVH manager
pub struct BvhScriptingAdapter {
    bvh_manager: std::sync::Arc<std::sync::Mutex<BvhManager>>,
}

#[cfg(feature = "scripting-support")]
impl BvhScriptingAdapter {
    /// Create a new adapter around a BVH manager
    pub fn new(bvh_manager: std::sync::Arc<std::sync::Mutex<BvhManager>>) -> Self {
        Self { bvh_manager }
    }
}

#[cfg(feature = "scripting-support")]
impl ScriptingBvhRaycaster for BvhScriptingAdapter {
    fn raycast_first(
        &mut self,
        origin: Vec3,
        dir: Vec3,
        max_distance: f32,
    ) -> Option<ScriptingRaycastHit> {
        let mut manager = self.bvh_manager.lock().unwrap();
        manager
            .raycast_first(origin, dir, max_distance)
            .map(convert_raycast_hit)
    }

    fn raycast_all(
        &mut self,
        origin: Vec3,
        dir: Vec3,
        max_distance: f32,
    ) -> Vec<ScriptingRaycastHit> {
        let mut manager = self.bvh_manager.lock().unwrap();
        manager
            .raycast_all(origin, dir, max_distance)
            .into_iter()
            .map(convert_raycast_hit)
            .collect()
    }
}

/// Convert internal RaycastHit to scripting RaycastHit
fn convert_raycast_hit(hit: RaycastHit) -> ScriptingRaycastHit {
    ScriptingRaycastHit {
        entity_id: hit.entity_id,
        distance: hit.distance,
        point: hit.point,
        barycentric: hit.barycentric,
        triangle_index: hit.triangle_index,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_adapter_creation() {
        let bvh_manager = std::sync::Arc::new(std::sync::Mutex::new(BvhManager::new()));
        let adapter = BvhScriptingAdapter::new(bvh_manager);
        // Just test creation - actual raycasting requires BVH data
    }

    #[test]
    fn test_raycast_hit_conversion() {
        let internal_hit = RaycastHit {
            entity_id: 42,
            distance: 5.5,
            point: Vec3::new(1.0, 2.0, 3.0),
            barycentric: (0.2, 0.3, 0.5),
            triangle_index: 7,
        };

        let scripting_hit = convert_raycast_hit(internal_hit);

        assert_eq!(scripting_hit.entity_id, 42);
        assert_eq!(scripting_hit.distance, 5.5);
        assert_eq!(scripting_hit.point, Vec3::new(1.0, 2.0, 3.0));
        assert_eq!(scripting_hit.barycentric, (0.2, 0.3, 0.5));
        assert_eq!(scripting_hit.triangle_index, 7);
    }
}
