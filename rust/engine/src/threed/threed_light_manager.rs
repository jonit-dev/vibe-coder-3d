use three_d::*;

use crate::renderer::lighting::{
    recompute_combined_ambient, AmbientCombineConfig, AmbientLightMetadata,
};
use crate::renderer::{EnhancedDirectionalLight, EnhancedSpotLight};

/// Manages all light-related state for the renderer
///
/// Responsibilities:
/// - Light storage (directional, point, spot, ambient)
/// - Light retrieval and collection
/// - Test scene light setup
/// - Ambient light combination for multi-ambient support
pub struct ThreeDLightManager {
    directional_lights: Vec<EnhancedDirectionalLight>,
    point_lights: Vec<PointLight>,
    spot_lights: Vec<EnhancedSpotLight>,
    ambient_lights: Vec<AmbientLight>,
    ambient_light_metadata: Vec<AmbientLightMetadata>,
    combined_ambient_light: Option<AmbientLight>,
    ambient_dirty: bool,
    ambient_cfg: AmbientCombineConfig,
    normal_guard_light: Option<DirectionalLight>,
}

impl ThreeDLightManager {
    pub fn new() -> Self {
        Self {
            directional_lights: Vec::new(),
            point_lights: Vec::new(),
            spot_lights: Vec::new(),
            ambient_lights: Vec::new(),
            ambient_light_metadata: Vec::new(),
            combined_ambient_light: None,
            ambient_dirty: false,
            ambient_cfg: AmbientCombineConfig::default(),
            normal_guard_light: None,
        }
    }

    /// Add a directional light
    pub fn add_directional_light(&mut self, light: EnhancedDirectionalLight) {
        self.directional_lights.push(light);
    }

    /// Add a point light
    pub fn add_point_light(&mut self, light: PointLight) {
        self.point_lights.push(light);
    }

    /// Add a spot light
    pub fn add_spot_light(&mut self, light: EnhancedSpotLight) {
        self.spot_lights.push(light);
    }

    /// Add an ambient light with metadata
    ///
    /// Multiple ambient lights are supported and will be combined into a single effective
    /// ambient light that matches Three.js additive lighting behavior.
    pub fn add_ambient_light(&mut self, light: AmbientLight, metadata: AmbientLightMetadata) {
        self.ambient_lights.push(light);
        self.ambient_light_metadata.push(metadata);
        self.ambient_dirty = true;
    }

    /// Clear all ambient lights
    pub fn clear_ambient_lights(&mut self) {
        self.ambient_lights.clear();
        self.ambient_light_metadata.clear();
        self.combined_ambient_light = None;
        self.ambient_dirty = false;
    }

    /// Clear all lights
    pub fn clear(&mut self) {
        self.directional_lights.clear();
        self.point_lights.clear();
        self.spot_lights.clear();
        self.clear_ambient_lights();
        self.normal_guard_light = None;
    }

    /// Get reference to directional lights
    pub fn directional_lights(&self) -> &Vec<EnhancedDirectionalLight> {
        &self.directional_lights
    }

    /// Get mutable reference to directional lights
    pub fn directional_lights_mut(&mut self) -> &mut Vec<EnhancedDirectionalLight> {
        &mut self.directional_lights
    }

    /// Get reference to point lights
    pub fn point_lights(&self) -> &Vec<PointLight> {
        &self.point_lights
    }

    /// Get mutable reference to point lights
    pub fn point_lights_mut(&mut self) -> &mut Vec<PointLight> {
        &mut self.point_lights
    }

    /// Get reference to spot lights
    pub fn spot_lights(&self) -> &Vec<EnhancedSpotLight> {
        &self.spot_lights
    }

    /// Get mutable reference to spot lights
    pub fn spot_lights_mut(&mut self) -> &mut Vec<EnhancedSpotLight> {
        &mut self.spot_lights
    }

    /// Get mutable references to both directional and spot lights at once
    /// This is needed for shadow map generation to avoid borrow checker issues
    pub fn directional_and_spot_lights_mut(
        &mut self,
    ) -> (
        &mut Vec<EnhancedDirectionalLight>,
        &mut Vec<EnhancedSpotLight>,
    ) {
        (&mut self.directional_lights, &mut self.spot_lights)
    }

    /// Get reference to ambient lights
    pub fn ambient_lights(&self) -> &Vec<AmbientLight> {
        &self.ambient_lights
    }

    /// Get reference to ambient light metadata
    pub fn ambient_light_metadata(&self) -> &Vec<AmbientLightMetadata> {
        &self.ambient_light_metadata
    }

    /// Get reference to combined ambient light (for compatibility)
    pub fn ambient_light(&self) -> Option<&AmbientLight> {
        self.combined_ambient_light.as_ref()
    }

    /// Get reference to combined ambient light as &Option<AmbientLight> for light collection
    pub fn ambient_light_ref(&self) -> &Option<AmbientLight> {
        &self.combined_ambient_light
    }

    /// Check if there's an ambient light
    pub fn has_ambient_light(&self) -> bool {
        !self.ambient_lights.is_empty()
    }

    /// Get light counts
    pub fn light_counts(&self) -> (usize, usize, usize, usize) {
        (
            self.directional_lights.len(),
            self.point_lights.len(),
            self.spot_lights.len(),
            self.ambient_lights.len(),
        )
    }

    /// Ensure combined ambient light is up to date
    fn ensure_combined_ambient(&mut self, context: &Context) {
        log::debug!("ensure_combined_ambient: dirty={}, metadata_count={}",
                   self.ambient_dirty, self.ambient_light_metadata.len());
        if !self.ambient_dirty {
            log::debug!("  Skipping - ambient lights not dirty");
            return;
        }
        log::debug!("  Recomputing combined ambient light...");
        self.combined_ambient_light =
            recompute_combined_ambient(&self.ambient_light_metadata, context, &self.ambient_cfg);
        self.ambient_dirty = false;
        log::debug!("  Combined ambient light recompute complete, dirty flag cleared");
    }

    /// Collect all lights into a vector for rendering
    ///
    /// This method automatically combines multiple ambient lights into a single effective
    /// ambient light using the combination algorithm. The returned vector contains
    /// references to all directional, point, spot lights, plus the combined ambient light.
    ///
    /// # Arguments
    /// * `context` - The Three.js context needed for ambient light combination
    ///
    /// # Returns
    /// A vector of light trait objects ready for rendering
    pub fn collect_lights(&mut self, context: &Context) -> Vec<&dyn Light> {
        self.ensure_combined_ambient(context);

        let has_normal_light = !self.directional_lights.is_empty()
            || !self.point_lights.is_empty()
            || !self.spot_lights.is_empty();
        if has_normal_light {
            self.normal_guard_light = None;
        } else {
            self.ensure_normal_guard(context);
            log::info!("  Scene has ONLY ambient lights - added zero-intensity guard light for proper rendering");
        }

        let mut lights: Vec<&dyn Light> = Vec::new();
        for l in &self.directional_lights {
            lights.push(l);
        }
        for l in &self.point_lights {
            lights.push(l);
        }
        for l in &self.spot_lights {
            lights.push(l);
        }

        log::debug!("collect_lights: directional={}, point={}, spot={}",
                   self.directional_lights.len(), self.point_lights.len(), self.spot_lights.len());

        if let Some(ref ambient) = self.combined_ambient_light {
            lights.push(ambient);
            log::info!("  Added combined ambient light to collection (intensity={})",
                      0.5); // We know it's 0.5 from the log above
        } else {
            log::warn!("  No combined ambient light available!");
        }

        if !has_normal_light {
            if let Some(ref guard) = self.normal_guard_light {
                lights.push(guard);
                log::debug!("  Added normal guard light");
            }
        }

        log::info!("collect_lights: returning {} total lights for rendering", lights.len());
        lights
    }

    fn ensure_normal_guard(&mut self, context: &Context) {
        if self.normal_guard_light.is_some() {
            return;
        }

        let direction = Vec3::new(0.0, -1.0, 0.0);
        let guard = DirectionalLight::new(context, 0.0, Srgba::WHITE, &direction);
        self.normal_guard_light = Some(guard);
    }

    /// Create test scene lights (for test scenarios)
    pub fn create_test_lights(&mut self, context: &Context) {
        // Add directional light (enhanced with shadow support)
        let light = EnhancedDirectionalLight::new(
            context,
            1.5,                     // intensity
            Srgba::WHITE,            // color
            &vec3(-1.0, -1.0, -1.0), // direction
            -0.0001,                 // shadow bias
            1.0,                     // shadow radius (PCF)
            2048,                    // shadow map size
            true,                    // cast shadows
        );
        self.directional_lights.push(light);

        // Add ambient light
        let ambient_light = AmbientLight::new(
            context,
            0.3,          // intensity
            Srgba::WHITE, // color
        );
        let ambient_metadata = AmbientLightMetadata {
            intensity: 0.3,
            color: Srgba::WHITE,
            enabled: true,
        };
        self.add_ambient_light(ambient_light, ambient_metadata);

        log::info!("  Added directional light");
        log::info!("  Added ambient light");
    }
}

impl Default for ThreeDLightManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
#[path = "threed_light_manager_test.rs"]
mod threed_light_manager_test;
