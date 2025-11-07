use crate::spatial::primitives::{Aabb, Ray};
use crate::spatial::intersect::ray_intersects_aabb;
use glam::Vec3;
use std::cmp::Ordering;

/// Scene reference containing entity ID and world-space AABB
#[derive(Debug, Clone, Copy)]
pub struct SceneRef {
    pub entity_id: u64,
    pub aabb: Aabb,
}

/// Scene BVH node type
#[derive(Debug, Clone, Copy)]
pub enum SceneBvhNodeType {
    /// Internal node with left and right children
    Internal {
        left: u32,
        right: u32,
    },
    /// Leaf node containing scene references
    Leaf {
        ref_start: u32,
        ref_count: u32,
    },
}

/// Scene BVH node
#[derive(Debug, Clone)]
pub struct SceneBvhNode {
    /// Bounding volume of this node
    pub aabb: Aabb,
    /// Node type and data
    pub node_type: SceneBvhNodeType,
}

/// Scene BVH for culling mesh/world AABBs
#[derive(Debug, Clone)]
pub struct SceneBvh {
    /// BVH nodes
    pub nodes: Vec<SceneBvhNode>,
    /// Scene references (flattened for cache efficiency)
    pub refs: Vec<SceneRef>,
    /// Maximum references per leaf
    pub max_leaf_refs: u32,
}

/// Frustum represented by 6 planes
#[derive(Debug, Clone, Copy)]
pub struct Frustum {
    pub planes: [Plane; 6],
}

/// Plane equation: ax + by + cz + d = 0
#[derive(Debug, Clone, Copy)]
pub struct Plane {
    pub normal: Vec3,
    pub distance: f32,
}

impl Plane {
    /// Create a plane from normal and distance
    pub fn new(normal: Vec3, distance: f32) -> Self {
        Self {
            normal: normal.normalize(),
            distance,
        }
    }

    /// Create a plane from normal and a point on the plane
    pub fn from_point_normal(point: Vec3, normal: Vec3) -> Self {
        let normal = normal.normalize();
        Self {
            normal,
            distance: -normal.dot(point),
        }
    }

    /// Get signed distance from point to plane
    pub fn distance_to_point(&self, point: Vec3) -> f32 {
        self.normal.dot(point) + self.distance
    }
}

impl Frustum {
    /// Create a frustum from 6 plane equations (a, b, c, d) for each plane
    pub fn from_planes(planes: [[f32; 4]; 6]) -> Self {
        let frustum_planes = planes.map(|plane| {
            Plane::new(Vec3::new(plane[0], plane[1], plane[2]), plane[3])
        });
        Self { planes: frustum_planes }
    }

    /// Test if an AABB is inside or intersects the frustum
    pub fn intersects_aabb(&self, aabb: &Aabb) -> bool {
        // For each plane, check if the AABB is completely outside
        for plane in &self.planes {
            // Find the most positive vertex (furthest in the plane's normal direction)
            let positive_vertex = Vec3::new(
                if plane.normal.x >= 0.0 { aabb.max.x } else { aabb.min.x },
                if plane.normal.y >= 0.0 { aabb.max.y } else { aabb.min.y },
                if plane.normal.z >= 0.0 { aabb.max.z } else { aabb.min.z },
            );

            // If the most positive vertex is behind the plane, the AABB is outside
            if plane.distance_to_point(positive_vertex) < 0.0 {
                return false;
            }
        }
        true
    }
}

impl SceneBvh {
    /// Create a new empty SceneBVH
    pub fn new(max_leaf_refs: u32) -> Self {
        Self {
            nodes: Vec::new(),
            refs: Vec::new(),
            max_leaf_refs,
        }
    }

    /// Build the SceneBVH from a list of scene references
    pub fn build(&mut self, refs: &[SceneRef]) {
        self.refs.clear();
        self.nodes.clear();

        if refs.is_empty() {
            return;
        }

        // Copy references to internal storage
        self.refs.extend_from_slice(refs);

        // Build the tree
        if !self.refs.is_empty() {
            self.build_node(0, self.refs.len());
        }

        self.refs.shrink_to_fit();
        self.nodes.shrink_to_fit();
    }

    /// Rebuild the BVH (same as build, but more descriptive name)
    pub fn rebuild(&mut self, refs: &[SceneRef]) {
        self.build(refs);
    }

    /// Fast refit update - only updates AABB bounds, doesn't rebuild structure
    pub fn refit(&mut self, refs: &[SceneRef]) {
        if refs.len() != self.refs.len() {
            // Different number of refs, need full rebuild
            self.rebuild(refs);
            return;
        }

        // Update the stored references
        self.refs.copy_from_slice(refs);

        // Recompute all AABB bounds from bottom up
        if !self.nodes.is_empty() {
            self.refit_node(0, refs);
        }
    }

    /// Refit a node and its children
    fn refit_node(&mut self, node_index: usize, refs: &[SceneRef]) -> Aabb {
        let node_type = std::mem::replace(&mut self.nodes[node_index].node_type, SceneBvhNodeType::Leaf { ref_start: 0, ref_count: 0 });

        let aabb = match node_type {
            SceneBvhNodeType::Internal { left, right } => {
                let left_aabb = self.refit_node(left as usize, refs);
                let right_aabb = self.refit_node(right as usize, refs);
                let merged_aabb = left_aabb.merge(&right_aabb);
                self.nodes[node_index].node_type = SceneBvhNodeType::Internal { left, right };
                merged_aabb
            }
            SceneBvhNodeType::Leaf { ref_start, ref_count } => {
                let start = ref_start as usize;
                let end = start + ref_count as usize;

                let mut aabb = Aabb::empty();
                for scene_ref in &refs[start..end] {
                    aabb = aabb.merge(&scene_ref.aabb);
                }
                self.nodes[node_index].node_type = SceneBvhNodeType::Leaf { ref_start, ref_count };
                aabb
            }
        };

        self.nodes[node_index].aabb = aabb;
        aabb
    }

    /// Build a BVH node recursively covering `count` refs starting at `start`
    fn build_node(&mut self, start: usize, count: usize) -> u32 {
        let node_index = self.nodes.len() as u32;
        let aabb = self.compute_refs_aabb(start, count);

        // Check if we should create a leaf node
        if count <= self.max_leaf_refs as usize {
            let ref_start = start as u32;

            self.nodes.push(SceneBvhNode {
                aabb,
                node_type: SceneBvhNodeType::Leaf {
                    ref_start,
                    ref_count: count as u32,
                },
            });
        } else {
            // Determine split axis by largest extent
            let size = aabb.size();
            let axis = if size.x >= size.y && size.x >= size.z {
                0
            } else if size.y >= size.z {
                1
            } else {
                2
            };

            // Sort refs in-place along chosen axis and split at median
            let end = start + count;
            self.refs[start..end].sort_by(|a, b| {
                let a_val = Self::axis_value(&a.aabb, axis);
                let b_val = Self::axis_value(&b.aabb, axis);
                a_val
                    .partial_cmp(&b_val)
                    .unwrap_or(Ordering::Equal)
            });
            let mid = start + count / 2;

            self.nodes.push(SceneBvhNode {
                aabb,
                node_type: SceneBvhNodeType::Internal { left: 0, right: 0 },
            });

            let left_index = self.build_node(start, mid - start);
            let right_index = self.build_node(mid, end - mid);

            self.nodes[node_index as usize].node_type = SceneBvhNodeType::Internal {
                left: left_index,
                right: right_index,
            };
        }

        node_index
    }

    /// Compute the AABB that contains a range of scene references
    fn compute_refs_aabb(&self, start: usize, count: usize) -> Aabb {
        let mut aabb = Aabb::empty();
        let end = (start + count).min(self.refs.len());

        for scene_ref in &self.refs[start..end] {
            aabb = aabb.merge(&scene_ref.aabb);
        }
        aabb
    }

    fn axis_value(aabb: &Aabb, axis: usize) -> f32 {
        match axis {
            0 => aabb.center().x,
            1 => aabb.center().y,
            _ => aabb.center().z,
        }
    }

    /// Query the frustum and return visible entity IDs
    pub fn query_frustum(&self, frustum: &Frustum, out: &mut Vec<u64>) {
        out.clear();
        if !self.nodes.is_empty() {
            self.query_frustum_recursive(frustum, 0, out);
        }
    }

    /// Recursive frustum query
    fn query_frustum_recursive(&self, frustum: &Frustum, node_index: usize, out: &mut Vec<u64>) {
        let node = &self.nodes[node_index];

        // Check if this node's AABB intersects the frustum
        if !frustum.intersects_aabb(&node.aabb) {
            return;
        }

        match &node.node_type {
            SceneBvhNodeType::Internal { left, right } => {
                self.query_frustum_recursive(frustum, *left as usize, out);
                self.query_frustum_recursive(frustum, *right as usize, out);
            }
            SceneBvhNodeType::Leaf { ref_start, ref_count } => {
                let start = *ref_start as usize;
                let end = start + *ref_count as usize;

                for scene_ref in &self.refs[start..end] {
                    if frustum.intersects_aabb(&scene_ref.aabb) {
                        out.push(scene_ref.entity_id);
                    }
                }
            }
        }
    }

    /// Query with a ray and return candidate entity IDs
    pub fn query_ray(&self, ray: &Ray, max_distance: f32, out: &mut Vec<u64>) {
        out.clear();
        if !self.nodes.is_empty() {
            self.query_ray_recursive(ray, max_distance, 0, out);
        }
    }

    /// Recursive ray query
    fn query_ray_recursive(&self, ray: &Ray, max_distance: f32, node_index: usize, out: &mut Vec<u64>) {
        let node = &self.nodes[node_index];

        // Check if ray intersects this node's AABB
        if !ray_intersects_aabb(ray, &node.aabb, max_distance) {
            return;
        }

        match &node.node_type {
            SceneBvhNodeType::Internal { left, right } => {
                self.query_ray_recursive(ray, max_distance, *left as usize, out);
                self.query_ray_recursive(ray, max_distance, *right as usize, out);
            }
            SceneBvhNodeType::Leaf { ref_start, ref_count } => {
                let start = *ref_start as usize;
                let end = start + *ref_count as usize;

                for scene_ref in &self.refs[start..end] {
                    if ray_intersects_aabb(ray, &scene_ref.aabb, max_distance) {
                        out.push(scene_ref.entity_id);
                    }
                }
            }
        }
    }

    /// Get statistics about the SceneBVH
    pub fn get_stats(&self) -> SceneBvhStats {
        let mut stats = SceneBvhStats::default();
        if !self.nodes.is_empty() {
            self.calculate_node_stats(0, &mut stats);
        }
        stats.total_refs = self.refs.len();
        stats
    }

    /// Calculate statistics recursively
    fn calculate_node_stats(&self, node_index: usize, stats: &mut SceneBvhStats) {
        stats.node_count += 1;
        let node = &self.nodes[node_index];

        match &node.node_type {
            SceneBvhNodeType::Internal { left, right } => {
                stats.internal_node_count += 1;
                self.calculate_node_stats(*left as usize, stats);
                self.calculate_node_stats(*right as usize, stats);
            }
            SceneBvhNodeType::Leaf { ref_count, .. } => {
                stats.leaf_node_count += 1;
                stats.max_refs_per_leaf = stats.max_refs_per_leaf.max(*ref_count);
                stats.min_refs_per_leaf = if stats.leaf_node_count == 1 {
                    *ref_count
                } else {
                    stats.min_refs_per_leaf.min(*ref_count)
                };
            }
        }

        stats.max_depth = stats.max_depth.max(stats.current_depth);
        stats.current_depth += 1;
    }
}

/// SceneBVH statistics
#[derive(Debug, Default, Clone)]
pub struct SceneBvhStats {
    pub node_count: usize,
    pub internal_node_count: usize,
    pub leaf_node_count: usize,
    pub total_refs: usize,
    pub max_refs_per_leaf: u32,
    pub min_refs_per_leaf: u32,
    pub max_depth: usize,
    current_depth: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_scene_refs() -> Vec<SceneRef> {
        vec![
            SceneRef {
                entity_id: 1,
                aabb: Aabb::new(Vec3::new(-2.0, -2.0, -2.0), Vec3::new(-1.0, -1.0, -1.0)),
            },
            SceneRef {
                entity_id: 2,
                aabb: Aabb::new(Vec3::new(1.0, 1.0, 1.0), Vec3::new(2.0, 2.0, 2.0)),
            },
            SceneRef {
                entity_id: 3,
                aabb: Aabb::new(Vec3::new(-1.0, -1.0, 1.0), Vec3::new(1.0, 1.0, 3.0)),
            },
        ]
    }

    #[test]
    fn test_scene_bvh_build() {
        let refs = create_test_scene_refs();
        let mut bvh = SceneBvh::new(4);
        bvh.build(&refs);

        assert!(!bvh.nodes.is_empty());
        assert_eq!(bvh.refs.len(), 3);
    }

    #[test]
    fn test_scene_bvh_frustum_query() {
        let refs = create_test_scene_refs();
        let mut bvh = SceneBvh::new(4);
        bvh.build(&refs);

        // Create a frustum that should see entity 2 (in the positive quadrant)
        let planes = [
            // Left plane (x = 0)
            [1.0, 0.0, 0.0, 0.0],
            // Right plane (x = 10)
            [-1.0, 0.0, 0.0, 10.0],
            // Bottom plane (y = 0)
            [0.0, 1.0, 0.0, 0.0],
            // Top plane (y = 10)
            [0.0, -1.0, 0.0, 10.0],
            // Near plane (z = 0)
            [0.0, 0.0, 1.0, 0.0],
            // Far plane (z = 10)
            [0.0, 0.0, -1.0, 10.0],
        ];
        let frustum = Frustum::from_planes(planes);

        let mut visible = Vec::new();
        bvh.query_frustum(&frustum, &mut visible);

        assert!(visible.contains(&2)); // Should see entity 2
    }

    #[test]
    fn test_scene_bvh_ray_query() {
        let refs = create_test_scene_refs();
        let mut bvh = SceneBvh::new(4);
        bvh.build(&refs);

        // Ray pointing towards positive quadrant
        let ray = Ray::new(Vec3::new(0.0, 0.0, 0.0), Vec3::new(1.0, 1.0, 1.0));

        let mut candidates = Vec::new();
        bvh.query_ray(&ray, 100.0, &mut candidates);

        assert!(candidates.len() > 0);
    }

    #[test]
    fn test_scene_bvh_refit() {
        let refs = create_test_scene_refs();
        let mut bvh = SceneBvh::new(4);
        bvh.build(&refs);

        // Move entity 1 closer to origin
        let mut modified_refs = refs.clone();
        modified_refs[0].aabb = Aabb::new(Vec3::new(-0.5, -0.5, -0.5), Vec3::new(0.5, 0.5, 0.5));

        bvh.refit(&modified_refs);
        assert_eq!(bvh.refs.len(), 3);

        // The root AABB should have changed
        assert!(!bvh.nodes.is_empty());
        let root_aabb = bvh.nodes[0].aabb;
        assert!(root_aabb.contains(Vec3::new(0.5, 0.5, 0.5)));
    }

    #[test]
    fn test_scene_bvh_stats() {
        let refs = create_test_scene_refs();
        let mut bvh = SceneBvh::new(4);
        bvh.build(&refs);

        let stats = bvh.get_stats();
        assert!(stats.node_count > 0);
        assert_eq!(stats.total_refs, 3);
        assert!(stats.leaf_node_count > 0);
    }

    #[test]
    fn test_plane() {
        let plane = Plane::from_point_normal(Vec3::new(0.0, 0.0, 0.0), Vec3::Z);
        assert_eq!(plane.normal, Vec3::Z);
        assert_eq!(plane.distance, 0.0);

        let distance = plane.distance_to_point(Vec3::new(0.0, 0.0, 5.0));
        assert_eq!(distance, 5.0);
    }

    #[test]
    fn test_frustum_intersects_aabb() {
        let planes = [
            [1.0, 0.0, 0.0, 0.0],   // Left: x >= 0
            [-1.0, 0.0, 0.0, 10.0], // Right: x <= 10
            [0.0, 1.0, 0.0, 0.0],   // Bottom: y >= 0
            [0.0, -1.0, 0.0, 10.0], // Top: y <= 10
            [0.0, 0.0, 1.0, 0.0],   // Near: z >= 0
            [0.0, 0.0, -1.0, 10.0], // Far: z <= 10
        ];
        let frustum = Frustum::from_planes(planes);

        // AABB inside frustum
        let inside_aabb = Aabb::new(Vec3::new(1.0, 1.0, 1.0), Vec3::new(2.0, 2.0, 2.0));
        assert!(frustum.intersects_aabb(&inside_aabb));

        // AABB outside frustum
        let outside_aabb = Aabb::new(Vec3::new(-5.0, 1.0, 1.0), Vec3::new(-4.0, 2.0, 2.0));
        assert!(!frustum.intersects_aabb(&outside_aabb));
    }
}
