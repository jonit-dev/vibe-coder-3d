use three_d::*;

use crate::renderer::{EnhancedDirectionalLight, EnhancedSpotLight};

/// Manages all light-related state for the renderer
///
/// Responsibilities:
/// - Light storage (directional, point, spot, ambient)
/// - Light retrieval and collection
/// - Test scene light setup
pub struct ThreeDLightManager {
    directional_lights: Vec<EnhancedDirectionalLight>,
    point_lights: Vec<PointLight>,
    spot_lights: Vec<EnhancedSpotLight>,
    ambient_light: Option<AmbientLight>,
}

impl ThreeDLightManager {
    pub fn new() -> Self {
        Self {
            directional_lights: Vec::new(),
            point_lights: Vec::new(),
            spot_lights: Vec::new(),
            ambient_light: None,
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

    /// Set the ambient light
    pub fn set_ambient_light(&mut self, light: AmbientLight) {
        self.ambient_light = Some(light);
    }

    /// Clear all lights
    pub fn clear(&mut self) {
        self.directional_lights.clear();
        self.point_lights.clear();
        self.spot_lights.clear();
        self.ambient_light = None;
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
    pub fn directional_and_spot_lights_mut(&mut self) -> (&mut Vec<EnhancedDirectionalLight>, &mut Vec<EnhancedSpotLight>) {
        (&mut self.directional_lights, &mut self.spot_lights)
    }

    /// Get reference to ambient light
    pub fn ambient_light(&self) -> Option<&AmbientLight> {
        self.ambient_light.as_ref()
    }

    /// Get reference to ambient light as &Option<AmbientLight> for light collection
    pub fn ambient_light_ref(&self) -> &Option<AmbientLight> {
        &self.ambient_light
    }

    /// Check if there's an ambient light
    pub fn has_ambient_light(&self) -> bool {
        self.ambient_light.is_some()
    }

    /// Get light counts
    pub fn light_counts(&self) -> (usize, usize, usize, bool) {
        (
            self.directional_lights.len(),
            self.point_lights.len(),
            self.spot_lights.len(),
            self.ambient_light.is_some(),
        )
    }

    /// Collect all lights into a vector for rendering
    pub fn collect_lights(&self) -> Vec<&dyn Light> {
        crate::renderer::lighting::collect_lights(
            &self.directional_lights,
            &self.point_lights,
            &self.spot_lights,
            &self.ambient_light,
        )
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
        self.ambient_light = Some(AmbientLight::new(
            context,
            0.3,          // intensity
            Srgba::WHITE, // color
        ));

        log::info!("  Added directional light");
        log::info!("  Added ambient light");
    }
}

impl Default for ThreeDLightManager {
    fn default() -> Self {
        Self::new()
    }
}
