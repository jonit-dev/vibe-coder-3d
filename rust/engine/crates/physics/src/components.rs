/// Physics material properties
#[derive(Debug, Clone, Copy)]
pub struct PhysicsMaterial {
    pub friction: f32,
    pub restitution: f32,
    pub density: f32,
}

impl Default for PhysicsMaterial {
    fn default() -> Self {
        Self {
            friction: 0.7,
            restitution: 0.3,
            density: 1.0,
        }
    }
}

/// Rigid body type enum matching Rapier and TypeScript schemas
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RigidBodyType {
    Dynamic,
    KinematicPositionBased,
    Fixed,
}

impl Default for RigidBodyType {
    fn default() -> Self {
        Self::Dynamic
    }
}

impl RigidBodyType {
    /// Parse from string (matches TS values: "dynamic", "kinematic", "static")
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "dynamic" => Self::Dynamic,
            "kinematic" => Self::KinematicPositionBased,
            "static" | "fixed" => Self::Fixed,
            _ => {
                log::warn!("Unknown rigid body type '{}', defaulting to dynamic", s);
                Self::Dynamic
            }
        }
    }

    /// Convert to Rapier rigid body type
    pub fn to_rapier(&self) -> rapier3d::prelude::RigidBodyType {
        match self {
            Self::Dynamic => rapier3d::prelude::RigidBodyType::Dynamic,
            Self::KinematicPositionBased => {
                rapier3d::prelude::RigidBodyType::KinematicPositionBased
            }
            Self::Fixed => rapier3d::prelude::RigidBodyType::Fixed,
        }
    }
}

/// Collider shape type enum
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ColliderType {
    Box,
    Sphere,
    Capsule,
    Convex,
    Mesh,
    Heightfield,
}

impl Default for ColliderType {
    fn default() -> Self {
        Self::Box
    }
}

impl ColliderType {
    /// Parse from string (matches TS schema)
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "box" => Self::Box,
            "sphere" => Self::Sphere,
            "capsule" => Self::Capsule,
            "convex" => Self::Convex,
            "mesh" => Self::Mesh,
            "heightfield" => Self::Heightfield,
            _ => {
                log::warn!("Unknown collider type '{}', defaulting to box", s);
                Self::Box
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_physics_material_defaults() {
        let material = PhysicsMaterial::default();
        assert_eq!(material.friction, 0.7);
        assert_eq!(material.restitution, 0.3);
        assert_eq!(material.density, 1.0);
    }

    #[test]
    fn test_rigid_body_type_from_str() {
        assert_eq!(RigidBodyType::from_str("dynamic"), RigidBodyType::Dynamic);
        assert_eq!(
            RigidBodyType::from_str("kinematic"),
            RigidBodyType::KinematicPositionBased
        );
        assert_eq!(RigidBodyType::from_str("static"), RigidBodyType::Fixed);
        assert_eq!(RigidBodyType::from_str("fixed"), RigidBodyType::Fixed);
        assert_eq!(RigidBodyType::from_str("DYNAMIC"), RigidBodyType::Dynamic);
        assert_eq!(RigidBodyType::from_str("unknown"), RigidBodyType::Dynamic);
    }

    #[test]
    fn test_rigid_body_type_to_rapier() {
        use rapier3d::prelude::RigidBodyType as RapierType;

        assert_eq!(RigidBodyType::Dynamic.to_rapier(), RapierType::Dynamic);
        assert_eq!(
            RigidBodyType::KinematicPositionBased.to_rapier(),
            RapierType::KinematicPositionBased
        );
        assert_eq!(RigidBodyType::Fixed.to_rapier(), RapierType::Fixed);
    }

    #[test]
    fn test_collider_type_from_str() {
        assert_eq!(ColliderType::from_str("box"), ColliderType::Box);
        assert_eq!(ColliderType::from_str("sphere"), ColliderType::Sphere);
        assert_eq!(ColliderType::from_str("capsule"), ColliderType::Capsule);
        assert_eq!(ColliderType::from_str("convex"), ColliderType::Convex);
        assert_eq!(ColliderType::from_str("mesh"), ColliderType::Mesh);
        assert_eq!(
            ColliderType::from_str("heightfield"),
            ColliderType::Heightfield
        );
        assert_eq!(ColliderType::from_str("BOX"), ColliderType::Box);
        assert_eq!(ColliderType::from_str("unknown"), ColliderType::Box);
    }
}
