/// Light component loading
///
/// Handles loading and creating lights from ECS components

use anyhow::Result;
use three_d::{radians, vec3, AmbientLight, Attenuation, Context, DirectionalLight, PointLight, SpotLight, Srgba};
use vibe_ecs_bridge::decoders::{Light as LightComponent, Transform};
use vibe_ecs_bridge::position_to_vec3_opt;

use super::coordinate_conversion::threejs_to_threed_direction;

/// Light types that can be created
pub enum LoadedLight {
    Directional(DirectionalLight),
    Point(PointLight),
    Spot(SpotLight),
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

fn parse_light_color(light: &LightComponent) -> Srgba {
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
) -> DirectionalLight {
    // Flip Z for three-d coordinate system
    let direction = threejs_to_threed_direction(light.directionX, light.directionY, light.directionZ);
    log::info!(
        "    Direction:  [{:.2}, {:.2}, {:.2}] (Z flipped)",
        direction.x,
        direction.y,
        direction.z
    );
    log::info!(
        "    Cast Shadow: {} (shadows not yet implemented)",
        light.castShadow
    );

    DirectionalLight::new(context, light.intensity, color, &direction)
}

fn create_point_light(
    context: &Context,
    light: &LightComponent,
    transform: Option<&Transform>,
    color: Srgba,
) -> PointLight {
    // Extract position from transform (flip Z for three-d coordinate system)
    let position = if let Some(t) = transform {
        let pos = position_to_vec3_opt(t.position.as_ref());
        vec3(pos.x, pos.y, -pos.z) // Flip Z
    } else {
        vec3(0.0, 0.0, 0.0)
    };

    log::info!(
        "    Position:   [{:.2}, {:.2}, {:.2}] (Z flipped)",
        position.x,
        position.y,
        position.z
    );

    PointLight::new(context, light.intensity, color, &position, Attenuation::default())
}

fn create_spot_light(
    context: &Context,
    light: &LightComponent,
    transform: Option<&Transform>,
    color: Srgba,
) -> SpotLight {
    // Extract position and direction from transform (flip Z for three-d coordinate system)
    let position = if let Some(t) = transform {
        let pos = position_to_vec3_opt(t.position.as_ref());
        vec3(pos.x, pos.y, -pos.z) // Flip Z
    } else {
        vec3(0.0, 0.0, 0.0)
    };

    let direction = threejs_to_threed_direction(light.directionX, light.directionY, light.directionZ);

    log::info!(
        "    Position:   [{:.2}, {:.2}, {:.2}] (Z flipped)",
        position.x,
        position.y,
        position.z
    );
    log::info!(
        "    Direction:  [{:.2}, {:.2}, {:.2}] (Z flipped)",
        direction.x,
        direction.y,
        direction.z
    );

    SpotLight::new(
        context,
        light.intensity,
        color,
        &position,
        &direction,
        radians(0.5), // TODO: get from component
        Attenuation::default(),
    )
}
