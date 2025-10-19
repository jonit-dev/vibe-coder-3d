/// Light component loading
///
/// Handles loading and creating lights from ECS components
use anyhow::Result;
use three_d::{radians, vec3, AmbientLight, Attenuation, Context, PointLight, Srgba};
use vibe_ecs_bridge::decoders::{Light as LightComponent, Transform};
use vibe_ecs_bridge::position_to_vec3_opt;

use super::coordinate_conversion::threejs_to_threed_direction;
use super::enhanced_lights::{EnhancedDirectionalLight, EnhancedSpotLight};

/// Light types that can be created
pub enum LoadedLight {
    Directional(EnhancedDirectionalLight),
    Point(PointLight),
    Spot(EnhancedSpotLight),
    Ambient(AmbientLight),
}

/// Load a light component and create the corresponding light object
pub fn load_light(
    context: &Context,
    light: &LightComponent,
    transform: Option<&Transform>,
) -> Result<Option<LoadedLight>> {
    log::info!("  Light:");
    log::info!("    Type:       {}", light.lightType);
    log::info!("    Intensity:  {}", light.intensity);
    log::info!("    Enabled:    {}", light.enabled);

    // Skip disabled lights
    if !light.enabled {
        log::info!("    Skipped (disabled)");
        return Ok(None);
    }

    let color = parse_light_color(light);

    match light.lightType.to_lowercase().as_str() {
        "directionallight" | "directional" => {
            let light_obj = create_directional_light(context, light, color);
            Ok(Some(LoadedLight::Directional(light_obj)))
        }
        "pointlight" | "point" => {
            let light_obj = create_point_light(context, light, transform, color);
            Ok(Some(LoadedLight::Point(light_obj)))
        }
        "spotlight" | "spot" => {
            let light_obj = create_spot_light(context, light, transform, color);
            Ok(Some(LoadedLight::Spot(light_obj)))
        }
        "ambientlight" | "ambient" => {
            log::info!("    Cast Shadow: {}", light.castShadow);
            let ambient = AmbientLight::new(context, light.intensity, color);
            Ok(Some(LoadedLight::Ambient(ambient)))
        }
        _ => {
            log::warn!("    Unknown light type: {}", light.lightType);
            Ok(None)
        }
    }
}

pub(super) fn parse_light_color(light: &LightComponent) -> Srgba {
    if let Some(light_color) = &light.color {
        let r = (light_color.r * 255.0) as u8;
        let g = (light_color.g * 255.0) as u8;
        let b = (light_color.b * 255.0) as u8;
        log::info!("    Color:      rgb({}, {}, {})", r, g, b);
        Srgba::new(r, g, b, 255)
    } else {
        log::info!("    Color:      white (default)");
        Srgba::WHITE
    }
}

fn create_directional_light(
    context: &Context,
    light: &LightComponent,
    color: Srgba,
) -> EnhancedDirectionalLight {
    let direction =
        threejs_to_threed_direction(light.directionX, light.directionY, light.directionZ);
    log::info!(
        "    Direction:  [{:.2}, {:.2}, {:.2}]",
        direction.x,
        direction.y,
        direction.z
    );
    log::info!("    Cast Shadow: {}", light.castShadow);

    if light.castShadow {
        log::info!("    Shadow Map Size: {}", light.shadowMapSize);
        log::info!("    Shadow Bias: {} ✅ IMPLEMENTED", light.shadowBias);
        log::info!(
            "    Shadow Radius: {} ✅ IMPLEMENTED (PCF)",
            light.shadowRadius
        );
    }

    // Create enhanced directional light with full shadow support
    EnhancedDirectionalLight::new(
        context,
        light.intensity,
        color,
        &direction,
        light.shadowBias,
        light.shadowRadius,
        light.shadowMapSize,
        light.castShadow,
    )
}

fn create_point_light(
    context: &Context,
    light: &LightComponent,
    transform: Option<&Transform>,
    color: Srgba,
) -> PointLight {
    // Extract position from transform
    let position = if let Some(t) = transform {
        let pos = position_to_vec3_opt(t.position.as_ref());
        vec3(pos.x, pos.y, pos.z)
    } else {
        vec3(0.0, 0.0, 0.0)
    };

    log::info!(
        "    Position:   [{:.2}, {:.2}, {:.2}]",
        position.x,
        position.y,
        position.z
    );
    log::info!("    Range:      {}", light.range);
    log::info!("    Decay:      {}", light.decay);

    // Create attenuation based on range and decay
    // Three.js uses physically correct inverse square falloff (decay=2) by default
    // Attenuation formula: 1 / (constant + linear * d + quadratic * d^2)
    // We map Three.js range to attenuation coefficients
    let attenuation = create_attenuation(light.range, light.decay);

    PointLight::new(context, light.intensity, color, &position, attenuation)
}

fn create_spot_light(
    context: &Context,
    light: &LightComponent,
    transform: Option<&Transform>,
    color: Srgba,
) -> EnhancedSpotLight {
    // Extract position and direction from transform
    let position = if let Some(t) = transform {
        let pos = position_to_vec3_opt(t.position.as_ref());
        vec3(pos.x, pos.y, pos.z)
    } else {
        vec3(0.0, 0.0, 0.0)
    };

    let direction =
        threejs_to_threed_direction(light.directionX, light.directionY, light.directionZ);

    log::info!(
        "    Position:   [{:.2}, {:.2}, {:.2}]",
        position.x,
        position.y,
        position.z
    );
    log::info!(
        "    Direction:  [{:.2}, {:.2}, {:.2}]",
        direction.x,
        direction.y,
        direction.z
    );
    log::info!(
        "    Angle:      {} radians ({:.1}°)",
        light.angle,
        light.angle.to_degrees()
    );
    log::info!(
        "    Penumbra:   {} ✅ IMPLEMENTED (soft edges)",
        light.penumbra
    );
    log::info!("    Range:      {}", light.range);
    log::info!("    Decay:      {}", light.decay);
    log::info!("    Cast Shadow: {}", light.castShadow);

    if light.castShadow {
        log::info!("    Shadow Map Size: {}", light.shadowMapSize);
        log::info!("    Shadow Bias: {} ✅ IMPLEMENTED", light.shadowBias);
        log::info!(
            "    Shadow Radius: {} ✅ IMPLEMENTED (PCF)",
            light.shadowRadius
        );
    }

    // Create attenuation based on range and decay
    let attenuation = create_attenuation(light.range, light.decay);

    // Create the spot light with the actual parameters
    // Note: angle is already in radians in the component (default is PI/6)
    let cutoff = radians(light.angle);

    // Create enhanced spot light with full Three.js parity
    EnhancedSpotLight::new(
        context,
        light.intensity,
        color,
        &position,
        &direction,
        cutoff,
        attenuation,
        light.penumbra,      // Soft edge implementation
        light.shadowBias,    // Shadow acne prevention
        light.shadowRadius,  // PCF soft shadows
        light.shadowMapSize, // Shadow map texture size
        light.castShadow,    // Whether this light casts shadows
    )
}

/// Create attenuation from Three.js range and decay parameters
///
/// Three.js uses:
/// - range: distance at which light becomes zero
/// - decay: physically correct is 2 (inverse square), but can be 0, 1, or 2
///
/// three-d uses Attenuation formula: 1 / (constant + linear * d + quadratic * d^2)
pub(super) fn create_attenuation(range: f32, decay: f32) -> Attenuation {
    if decay == 0.0 {
        // No decay - constant light (not physically correct)
        Attenuation {
            constant: 1.0,
            linear: 0.0,
            quadratic: 0.0,
        }
    } else if decay == 1.0 {
        // Linear decay
        Attenuation {
            constant: 1.0,
            linear: 1.0 / range,
            quadratic: 0.0,
        }
    } else {
        // Quadratic decay (physically correct for decay=2)
        // Ensure light reaches near-zero at range distance
        Attenuation {
            constant: 1.0,
            linear: 2.0 / range,
            quadratic: 1.0 / (range * range),
        }
    }
}

#[cfg(test)]
#[path = "light_loader_test.rs"]
mod light_loader_test;
