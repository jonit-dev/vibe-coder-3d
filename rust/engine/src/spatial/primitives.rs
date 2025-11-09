use glam::{Mat4, Vec3};

/// Ray with origin and direction (direction should be normalized)
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Ray {
    pub origin: Vec3,
    pub dir: Vec3,
}

impl Ray {
    /// Create a new ray. Direction will be normalized.
    pub fn new(origin: Vec3, dir: Vec3) -> Self {
        Self {
            origin,
            dir: dir.normalize(),
        }
    }

    /// Get a point along the ray at distance t from origin
    pub fn point_at(&self, t: f32) -> Vec3 {
        self.origin + self.dir * t
    }
}

/// Axis-aligned bounding box
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Aabb {
    pub min: Vec3,
    pub max: Vec3,
}

impl Aabb {
    /// Create a new AABB from min and max points
    pub fn new(min: Vec3, max: Vec3) -> Self {
        Self { min, max }
    }

    /// Create an empty AABB that contains no points
    pub fn empty() -> Self {
        Self {
            min: Vec3::new(f32::INFINITY, f32::INFINITY, f32::INFINITY),
            max: Vec3::new(f32::NEG_INFINITY, f32::NEG_INFINITY, f32::NEG_INFINITY),
        }
    }

    /// Create an AABB that encloses a single point
    pub fn from_point(point: Vec3) -> Self {
        Self {
            min: point,
            max: point,
        }
    }

    /// Expand the AABB to include another point
    pub fn include_point(&mut self, point: Vec3) {
        self.min = self.min.min(point);
        self.max = self.max.max(point);
    }

    /// Get the center of the AABB
    pub fn center(&self) -> Vec3 {
        (self.min + self.max) * 0.5
    }

    /// Get the size (dimensions) of the AABB
    pub fn size(&self) -> Vec3 {
        self.max - self.min
    }

    /// Get the surface area of the AABB
    pub fn surface_area(&self) -> f32 {
        let size = self.size();
        2.0 * (size.x * size.y + size.y * size.z + size.z * size.x)
    }

    /// Get the volume of the AABB
    pub fn volume(&self) -> f32 {
        let size = self.size();
        size.x * size.y * size.z
    }

    /// Check if a point is inside the AABB
    pub fn contains(&self, point: Vec3) -> bool {
        point.x >= self.min.x
            && point.x <= self.max.x
            && point.y >= self.min.y
            && point.y <= self.max.y
            && point.z >= self.min.z
            && point.z <= self.max.z
    }

    /// Transform the AABB by a matrix and return a new AABB that encloses the transformed box
    pub fn transformed(&self, matrix: Mat4) -> Self {
        // Transform all 8 corners of the box and compute the new AABB
        let corners = [
            Vec3::new(self.min.x, self.min.y, self.min.z),
            Vec3::new(self.max.x, self.min.y, self.min.z),
            Vec3::new(self.min.x, self.max.y, self.min.z),
            Vec3::new(self.max.x, self.max.y, self.min.z),
            Vec3::new(self.min.x, self.min.y, self.max.z),
            Vec3::new(self.max.x, self.min.y, self.max.z),
            Vec3::new(self.min.x, self.max.y, self.max.z),
            Vec3::new(self.max.x, self.max.y, self.max.z),
        ];

        let mut result = Aabb::empty();
        for corner in corners {
            let transformed = matrix.transform_point3(corner);
            result.include_point(transformed);
        }
        result
    }

    /// Merge two AABBs into a new AABB that contains both
    pub fn merge(&self, other: &Aabb) -> Aabb {
        Aabb {
            min: self.min.min(other.min),
            max: self.max.max(other.max),
        }
    }
}

/// Triangle with three vertices
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Triangle {
    pub a: Vec3,
    pub b: Vec3,
    pub c: Vec3,
}

impl Triangle {
    /// Create a new triangle from three vertices
    pub fn new(a: Vec3, b: Vec3, c: Vec3) -> Self {
        Self { a, b, c }
    }

    /// Get the normal vector of the triangle (not normalized)
    pub fn normal(&self) -> Vec3 {
        (self.b - self.a).cross(self.c - self.a)
    }

    /// Get the normalized normal vector of the triangle
    pub fn normal_normalized(&self) -> Vec3 {
        self.normal().normalize()
    }

    /// Get the area of the triangle
    pub fn area(&self) -> f32 {
        0.5 * self.normal().length()
    }

    /// Get the centroid of the triangle
    pub fn centroid(&self) -> Vec3 {
        (self.a + self.b + self.c) / 3.0
    }

    /// Get the AABB that encloses this triangle
    pub fn aabb(&self) -> Aabb {
        let mut result = Aabb::empty();
        result.include_point(self.a);
        result.include_point(self.b);
        result.include_point(self.c);
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ray_new_normalizes_direction() {
        let ray = Ray::new(Vec3::ZERO, Vec3::new(2.0, 0.0, 0.0));
        assert_eq!(ray.dir, Vec3::X);
    }

    #[test]
    fn test_ray_point_at() {
        let ray = Ray::new(Vec3::ZERO, Vec3::X);
        let point = ray.point_at(5.0);
        assert_eq!(point, Vec3::new(5.0, 0.0, 0.0));
    }

    #[test]
    fn test_aabb_from_point() {
        let point = Vec3::new(1.0, 2.0, 3.0);
        let aabb = Aabb::from_point(point);
        assert_eq!(aabb.min, point);
        assert_eq!(aabb.max, point);
    }

    #[test]
    fn test_aabb_include_point() {
        let mut aabb = Aabb::from_point(Vec3::ZERO);
        aabb.include_point(Vec3::new(1.0, 1.0, 1.0));
        assert_eq!(aabb.min, Vec3::ZERO);
        assert_eq!(aabb.max, Vec3::new(1.0, 1.0, 1.0));
    }

    #[test]
    fn test_aabb_center() {
        let aabb = Aabb::new(Vec3::ZERO, Vec3::new(2.0, 2.0, 2.0));
        assert_eq!(aabb.center(), Vec3::new(1.0, 1.0, 1.0));
    }

    #[test]
    fn test_aabb_contains() {
        let aabb = Aabb::new(Vec3::ZERO, Vec3::new(1.0, 1.0, 1.0));
        assert!(aabb.contains(Vec3::new(0.5, 0.5, 0.5)));
        assert!(!aabb.contains(Vec3::new(1.5, 0.5, 0.5)));
    }

    #[test]
    fn test_aabb_merge() {
        let aabb1 = Aabb::new(Vec3::ZERO, Vec3::new(1.0, 1.0, 1.0));
        let aabb2 = Aabb::new(Vec3::new(2.0, 2.0, 2.0), Vec3::new(3.0, 3.0, 3.0));
        let merged = aabb1.merge(&aabb2);
        assert_eq!(merged.min, Vec3::ZERO);
        assert_eq!(merged.max, Vec3::new(3.0, 3.0, 3.0));
    }

    #[test]
    fn test_triangle_normal() {
        let triangle = Triangle::new(
            Vec3::new(0.0, 0.0, 0.0),
            Vec3::new(1.0, 0.0, 0.0),
            Vec3::new(0.0, 1.0, 0.0),
        );
        let normal = triangle.normal_normalized();
        assert!((normal - Vec3::Z).length() < 1e-6);
    }

    #[test]
    fn test_triangle_centroid() {
        let triangle = Triangle::new(
            Vec3::new(0.0, 0.0, 0.0),
            Vec3::new(3.0, 0.0, 0.0),
            Vec3::new(0.0, 3.0, 0.0),
        );
        assert_eq!(triangle.centroid(), Vec3::new(1.0, 1.0, 0.0));
    }

    #[test]
    fn test_triangle_aabb() {
        let triangle = Triangle::new(
            Vec3::new(-1.0, -1.0, -1.0),
            Vec3::new(1.0, -1.0, 1.0),
            Vec3::new(0.0, 1.0, 0.0),
        );
        let aabb = triangle.aabb();
        assert_eq!(aabb.min, Vec3::new(-1.0, -1.0, -1.0));
        assert_eq!(aabb.max, Vec3::new(1.0, 1.0, 1.0));
    }
}
