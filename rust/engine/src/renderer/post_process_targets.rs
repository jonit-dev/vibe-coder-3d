/// Post-processing render target management
///
/// Handles HDR color and depth texture creation/recreation for post-processing pipeline.

use three_d::*;

/// Ensure HDR color texture exists and matches window size
pub fn ensure_color_texture(
    context: &Context,
    current_texture: Option<&Texture2D>,
    window_size: (u32, u32),
) -> Option<Texture2D> {
    let (width, height) = window_size;

    let recreate = match current_texture {
        Some(tex) => tex.width() != width || tex.height() != height,
        None => true,
    };

    if recreate {
        Some(Texture2D::new_empty::<[f32; 4]>(
            context,
            width,
            height,
            Interpolation::Linear,
            Interpolation::Linear,
            Some(Interpolation::Linear),
            Wrapping::ClampToEdge,
            Wrapping::ClampToEdge,
        ))
    } else {
        None
    }
}

/// Ensure HDR depth texture exists and matches window size
pub fn ensure_depth_texture(
    context: &Context,
    current_texture: Option<&DepthTexture2D>,
    window_size: (u32, u32),
) -> Option<DepthTexture2D> {
    let (width, height) = window_size;

    let recreate = match current_texture {
        Some(tex) => tex.width() != width || tex.height() != height,
        None => true,
    };

    if recreate {
        Some(DepthTexture2D::new::<f32>(
            context,
            width,
            height,
            Wrapping::ClampToEdge,
            Wrapping::ClampToEdge,
        ))
    } else {
        None
    }
}
