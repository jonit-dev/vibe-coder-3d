use crate::renderer::post_processing::{apply_post_processing, ColorGradingEffect};
use crate::renderer::render_settings::RenderSettings;
use crate::renderer::{CameraConfig, SkyboxRenderer};
/// Camera rendering orchestration
///
/// Handles multi-camera rendering with depth-based ordering, post-processing, and viewport management.
use anyhow::Result;
use three_d::*;

/// Camera entry for depth-based sorting
#[derive(Debug, Clone)]
pub struct CameraEntry {
    pub depth: i32,
    pub variant: CameraVariant,
}

/// Camera variant (main or additional by index)
#[derive(Debug, Clone)]
pub enum CameraVariant {
    Main,
    Additional(usize),
}

/// Additional camera with its own config and skybox
pub struct AdditionalCamera {
    pub camera: Camera,
    pub config: CameraConfig,
    pub skybox_renderer: SkyboxRenderer,
    pub last_position: Vec3,
    pub last_target: Vec3,
}

/// Render a single camera with optional post-processing
#[allow(clippy::too_many_arguments)]
pub fn render_camera(
    context: &Context,
    camera: &Camera,
    config: &CameraConfig,
    skybox_renderer: &SkyboxRenderer,
    meshes: &[Gm<Mesh, PhysicalMaterial>],
    visible_indices: &[usize],
    directional_lights: &[crate::renderer::EnhancedDirectionalLight],
    point_lights: &[PointLight],
    spot_lights: &[crate::renderer::EnhancedSpotLight],
    ambient_light: &Option<AmbientLight>,
    hdr_color_texture: &mut Option<Texture2D>,
    hdr_depth_texture: &mut Option<DepthTexture2D>,
    window_size: (u32, u32),
) -> Result<()> {
    let scissor: ScissorBox = camera.viewport().into();
    let settings = crate::renderer::render_settings::prepare_render_settings_for(
        config,
        skybox_renderer.is_loaded(),
    );

    let screen = RenderTarget::screen(context, window_size.0, window_size.1);

    let mut tone_restore: Option<(ToneMapping, ColorMapping)> = None;

    if let Some(ref post_settings) = settings.post_settings {
        if post_settings.apply_tone_mapping {
            // Caller must disable tone mapping before calling
        }

        // Render with post-processing
        ensure_hdr_textures(context, hdr_color_texture, hdr_depth_texture, window_size);

        // Collect lights
        let mut lights: Vec<&dyn Light> = Vec::new();
        for light in directional_lights {
            lights.push(light);
        }
        for light in point_lights {
            lights.push(light);
        }
        for light in spot_lights {
            lights.push(light);
        }
        if let Some(ref ambient) = ambient_light {
            lights.push(ambient);
        }

        {
            let render_target = {
                let color_target = hdr_color_texture
                    .as_mut()
                    .expect("HDR color texture not initialized")
                    .as_color_target(None);
                let depth_target = hdr_depth_texture
                    .as_mut()
                    .expect("HDR depth texture not initialized")
                    .as_depth_target();
                RenderTarget::new(color_target, depth_target)
            };

            if let Some(clear_state) = settings.clear_state {
                render_target.clear_partially(scissor, clear_state);
            }

            if settings.render_skybox {
                skybox_renderer.render(&render_target, camera);
            }

            let visible_meshes: Vec<_> = visible_indices
                .iter()
                .filter_map(|&idx| meshes.get(idx))
                .collect();
            render_target.render(camera, &visible_meshes, &lights);
        }

        let color_texture = ColorTexture::Single(hdr_color_texture.as_ref().unwrap());
        let effect = ColorGradingEffect::from(post_settings.clone());
        apply_post_processing(&screen, effect, camera, color_texture, scissor);
    } else {
        // Render without post-processing
        if let Some(clear_state) = settings.clear_state {
            screen.clear_partially(scissor, clear_state);
        }

        if settings.render_skybox {
            skybox_renderer.render(&screen, camera);
        }

        let lights = crate::renderer::lighting::collect_lights(
            directional_lights,
            point_lights,
            spot_lights,
            ambient_light,
        );
        let visible_meshes: Vec<_> = visible_indices
            .iter()
            .filter_map(|&idx| meshes.get(idx))
            .collect();
        screen.render(camera, &visible_meshes, &lights);
    }

    Ok(())
}

/// Ensure HDR textures exist and match window size
fn ensure_hdr_textures(
    context: &Context,
    hdr_color_texture: &mut Option<Texture2D>,
    hdr_depth_texture: &mut Option<DepthTexture2D>,
    window_size: (u32, u32),
) {
    if let Some(new_texture) = crate::renderer::post_process_targets::ensure_color_texture(
        context,
        hdr_color_texture.as_ref(),
        window_size,
    ) {
        *hdr_color_texture = Some(new_texture);
    }

    if let Some(new_texture) = crate::renderer::post_process_targets::ensure_depth_texture(
        context,
        hdr_depth_texture.as_ref(),
        window_size,
    ) {
        *hdr_depth_texture = Some(new_texture);
    }
}

/// Sort camera entries by depth for rendering order
pub fn sort_camera_entries(entries: &mut [CameraEntry]) {
    entries.sort_by(|a, b| a.depth.cmp(&b.depth));
}
