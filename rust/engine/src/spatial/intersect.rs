use crate::spatial::primitives::{Ray, Aabb, Triangle};
use glam::Vec3;

/// Small epsilon to avoid numerical precision issues
const EPSILON: f32 = 1e-6;

/// Result of a ray intersection
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct RayHit {
    /// Distance from ray origin to hit point
    pub distance: f32,
    /// Barycentric coordinates on the triangle (u, v, w where u+v+w=1)
    pub barycentric: (f32, f32, f32),
    /// Hit point in world space
    pub point: Vec3,
}

/// Test if a ray intersects an AABB (slab method)
/// Returns true if intersecting, false otherwise
pub fn ray_intersects_aabb(ray: &Ray, aabb: &Aabb, max_distance: f32) -> bool {
    // Ray direction component-wise reciprocal
    let inv_dir = Vec3::new(
        if ray.dir.x.abs() < EPSILON { f32::INFINITY } else { 1.0 / ray.dir.x },
        if ray.dir.y.abs() < EPSILON { f32::INFINITY } else { 1.0 / ray.dir.y },
        if ray.dir.z.abs() < EPSILON { f32::INFINITY } else { 1.0 / ray.dir.z },
    );

    let mut t_min: f32 = 0.0;
    let mut t_max = max_distance;

    // Check each axis (X, Y, Z)
    for i in 0..3 {
        let (min_bound, max_bound) = if i == 0 {
            (aabb.min.x, aabb.max.x)
        } else if i == 1 {
            (aabb.min.y, aabb.max.y)
        } else {
            (aabb.min.z, aabb.max.z)
        };

        let t1 = (min_bound - ray.origin[i]) * inv_dir[i];
        let t2 = (max_bound - ray.origin[i]) * inv_dir[i];

        let (t_near, t_far) = if t1 <= t2 { (t1, t2) } else { (t2, t1) };

        t_min = t_min.max(t_near);
        t_max = t_max.min(t_far);

        if t_min > t_max {
            return false;
        }
    }

    true
}

/// Test if a ray intersects an AABB and return the distance range
/// Returns Some((t_min, t_max)) if intersecting, None otherwise
pub fn ray_aabb_intersection_range(ray: &Ray, aabb: &Aabb) -> Option<(f32, f32)> {
    let inv_dir = Vec3::new(
        if ray.dir.x.abs() < EPSILON { f32::INFINITY } else { 1.0 / ray.dir.x },
        if ray.dir.y.abs() < EPSILON { f32::INFINITY } else { 1.0 / ray.dir.y },
        if ray.dir.z.abs() < EPSILON { f32::INFINITY } else { 1.0 / ray.dir.z },
    );

    let mut t_min = f32::NEG_INFINITY;
    let mut t_max = f32::INFINITY;

    for i in 0..3 {
        let (min_bound, max_bound) = if i == 0 {
            (aabb.min.x, aabb.max.x)
        } else if i == 1 {
            (aabb.min.y, aabb.max.y)
        } else {
            (aabb.min.z, aabb.max.z)
        };

        let t1 = (min_bound - ray.origin[i]) * inv_dir[i];
        let t2 = (max_bound - ray.origin[i]) * inv_dir[i];

        let (t_near, t_far) = if t1 <= t2 { (t1, t2) } else { (t2, t1) };

        t_min = t_min.max(t_near);
        t_max = t_max.min(t_far);

        if t_min > t_max {
            return None;
        }
    }

    Some((t_min, t_max))
}

/// Möller–Trumbore ray-triangle intersection algorithm
/// Returns Some(RayHit) if intersecting, None otherwise
pub fn ray_intersect_triangle(ray: &Ray, triangle: &Triangle, max_distance: f32) -> Option<RayHit> {
    let edge1 = triangle.b - triangle.a;
    let edge2 = triangle.c - triangle.a;
    let h = ray.dir.cross(edge2);
    let a = edge1.dot(h);

    // Ray is parallel to triangle plane
    if a.abs() < EPSILON {
        return None;
    }

    let f = 1.0 / a;
    let s = ray.origin - triangle.a;
    let u = f * s.dot(h);

    // Check if intersection is outside triangle
    if u < 0.0 || u > 1.0 {
        return None;
    }

    let q = s.cross(edge1);
    let v = f * ray.dir.dot(q);

    if v < 0.0 || u + v > 1.0 {
        return None;
    }

    let t = f * edge2.dot(q);

    // Check if intersection is within valid range
    if t > EPSILON && t <= max_distance {
        let w = 1.0 - u - v;
        let point = ray.point_at(t);
        Some(RayHit {
            distance: t,
            barycentric: (u, v, w),
            point,
        })
    } else {
        None
    }
}

/// Find the closest triangle intersected by a ray from a list of triangles
/// Returns Some((triangle_index, RayHit)) if any intersection found
pub fn ray_intersect_closest_triangle(
    ray: &Ray,
    triangles: &[Triangle],
    max_distance: f32,
) -> Option<(usize, RayHit)> {
    let mut closest_hit: Option<(usize, RayHit)> = None;

    for (i, triangle) in triangles.iter().enumerate() {
        if let Some(hit) = ray_intersect_triangle(ray, triangle, max_distance) {
            match &closest_hit {
                Some((_, closest)) => {
                    if hit.distance < closest.distance {
                        closest_hit = Some((i, hit));
                    }
                }
                None => {
                    closest_hit = Some((i, hit));
                }
            }
        }
    }

    closest_hit
}

/// Find all triangles intersected by a ray from a list of triangles
/// Results are sorted by distance from ray origin
pub fn ray_intersect_all_triangles(
    ray: &Ray,
    triangles: &[Triangle],
    max_distance: f32,
    hits: &mut Vec<(usize, RayHit)>,
) {
    hits.clear();

    for (i, triangle) in triangles.iter().enumerate() {
        if let Some(hit) = ray_intersect_triangle(ray, triangle, max_distance) {
            hits.push((i, hit));
        }
    }

    // Sort by distance
    hits.sort_by(|a, b| a.1.distance.partial_cmp(&b.1.distance).unwrap());
}

/// Test if two AABBs intersect
pub fn aabb_intersects_aabb(a: &Aabb, b: &Aabb) -> bool {
    a.min.x <= b.max.x && a.max.x >= b.min.x &&
    a.min.y <= b.max.y && a.max.y >= b.min.y &&
    a.min.z <= b.max.z && a.max.z >= b.min.z
}

/// Test if a point is inside an AABB
pub fn point_in_aabb(point: Vec3, aabb: &Aabb) -> bool {
    aabb.contains(point)
}

/// Get the signed distance from a point to the closest point on an AABB
/// Positive means outside, negative means inside
pub fn point_distance_to_aabb(point: Vec3, aabb: &Aabb) -> f32 {
    let closest = point.clamp(aabb.min, aabb.max);
    (point - closest).length() * if aabb.contains(point) { -1.0 } else { 1.0 }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ray_aabb_intersection_simple() {
        let ray = Ray::new(Vec3::new(-5.0, 0.0, 0.0), Vec3::X);
        let aabb = Aabb::new(
            Vec3::new(-1.0, -1.0, -1.0),
            Vec3::new(1.0, 1.0, 1.0),
        );
        assert!(ray_intersects_aabb(&ray, &aabb, 100.0));
    }

    #[test]
    fn test_ray_aabb_intersection_miss() {
        let ray = Ray::new(Vec3::new(-5.0, 5.0, 0.0), Vec3::X);
        let aabb = Aabb::new(
            Vec3::new(-1.0, -1.0, -1.0),
            Vec3::new(1.0, 1.0, 1.0),
        );
        assert!(!ray_intersects_aabb(&ray, &aabb, 100.0));
    }

    #[test]
    fn test_ray_aabb_intersection_range() {
        let ray = Ray::new(Vec3::new(-5.0, 0.0, 0.0), Vec3::X);
        let aabb = Aabb::new(
            Vec3::new(-1.0, -1.0, -1.0),
            Vec3::new(1.0, 1.0, 1.0),
        );
        let range = ray_aabb_intersection_range(&ray, &aabb);
        assert!(range.is_some());
        let (t_min, t_max) = range.unwrap();
        assert!(t_min < t_max);
    }

    #[test]
    fn test_ray_triangle_intersection_hit() {
        let ray = Ray::new(Vec3::new(0.0, 0.5, -1.0), Vec3::Z);
        let triangle = Triangle::new(
            Vec3::new(-1.0, 0.0, 0.0),
            Vec3::new(1.0, 0.0, 0.0),
            Vec3::new(0.0, 1.0, 0.0),
        );
        let hit = ray_intersect_triangle(&ray, &triangle, 100.0);
        assert!(hit.is_some());
        let hit = hit.unwrap();
        assert!((hit.distance - 1.0).abs() < EPSILON);
        assert_eq!(hit.point, Vec3::new(0.0, 0.5, 0.0));
    }

    #[test]
    fn test_ray_triangle_intersection_miss() {
        let ray = Ray::new(Vec3::new(2.0, 2.0, -1.0), Vec3::Z);
        let triangle = Triangle::new(
            Vec3::new(-1.0, 0.0, 0.0),
            Vec3::new(1.0, 0.0, 0.0),
            Vec3::new(0.0, 1.0, 0.0),
        );
        let hit = ray_intersect_triangle(&ray, &triangle, 100.0);
        assert!(hit.is_none());
    }

    #[test]
    fn test_ray_triangle_parallel() {
        let ray = Ray::new(Vec3::new(0.0, 0.0, 1.0), Vec3::X);
        let triangle = Triangle::new(
            Vec3::new(-1.0, 0.0, 0.0),
            Vec3::new(1.0, 0.0, 0.0),
            Vec3::new(0.0, 1.0, 0.0),
        );
        let hit = ray_intersect_triangle(&ray, &triangle, 100.0);
        assert!(hit.is_none());
    }

    #[test]
    fn test_ray_intersect_closest_triangle() {
        let ray = Ray::new(Vec3::new(0.0, 0.0, -2.0), Vec3::Z);
        let triangles = [
            Triangle::new(
                Vec3::new(-1.0, -1.0, 0.0),
                Vec3::new(1.0, -1.0, 0.0),
                Vec3::new(0.0, 1.0, 0.0),
            ),
            Triangle::new(
                Vec3::new(-0.5, -0.5, -1.0),
                Vec3::new(0.5, -0.5, -1.0),
                Vec3::new(0.0, 0.5, -1.0),
            ),
        ];
        let result = ray_intersect_closest_triangle(&ray, &triangles, 100.0);
        assert!(result.is_some());
        let (index, hit) = result.unwrap();
        assert_eq!(index, 1); // Second triangle (closer)
        assert!((hit.distance - 1.0).abs() < EPSILON);
    }

    #[test]
    fn test_aabb_intersects_aabb() {
        let aabb1 = Aabb::new(
            Vec3::new(-1.0, -1.0, -1.0),
            Vec3::new(1.0, 1.0, 1.0),
        );
        let aabb2 = Aabb::new(
            Vec3::new(0.0, 0.0, 0.0),
            Vec3::new(2.0, 2.0, 2.0),
        );
        assert!(aabb_intersects_aabb(&aabb1, &aabb2));

        let aabb3 = Aabb::new(
            Vec3::new(2.0, 2.0, 2.0),
            Vec3::new(3.0, 3.0, 3.0),
        );
        assert!(!aabb_intersects_aabb(&aabb1, &aabb3));
    }

    #[test]
    fn test_point_distance_to_aabb() {
        let aabb = Aabb::new(
            Vec3::new(-1.0, -1.0, -1.0),
            Vec3::new(1.0, 1.0, 1.0),
        );

        // Point inside
        let distance = point_distance_to_aabb(Vec3::new(0.0, 0.0, 0.0), &aabb);
        assert!(distance < 0.0);

        // Point outside
        let distance = point_distance_to_aabb(Vec3::new(2.0, 0.0, 0.0), &aabb);
        assert_eq!(distance, 1.0);
    }
}