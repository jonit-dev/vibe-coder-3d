use anyhow::{Context as AnyhowContext, Result};
use std::collections::HashMap;
use std::sync::Arc;
use three_d::*;
use vibe_ecs_bridge::ComponentRegistry;
use winit::dpi::PhysicalSize;
use winit::window::Window as WinitWindow;

use crate::renderer::{
    DebugLineRenderer, LODManager, LODSelector, MaterialManager, SkyboxRenderer,
};

/// Manages core three-d context, window, and shared resources
///
/// Responsibilities:
/// - three-d context and windowed context management
/// - Window size and resize handling
/// - Resource caching (meshes, materials)
/// - Component registry for ECS decoding
/// - Skybox and debug rendering utilities
/// - LOD management system
/// - HDR render targets
pub struct ThreeDContextState {
    /// three-d windowed context (includes window and GL context)
    windowed_context: WindowedContext,

    /// three-d rendering context
    context: Context,

    /// Current window size
    window_size: (u32, u32),

    /// Cache for loaded CPU meshes
    mesh_cache: HashMap<String, CpuMesh>,

    /// Material manager for PBR materials
    material_manager: MaterialManager,

    /// Component registry for decoding ECS components
    component_registry: ComponentRegistry,

    /// Skybox renderer
    skybox_renderer: SkyboxRenderer,

    /// Debug line renderer (grid, colliders, etc.)
    debug_line_renderer: DebugLineRenderer,

    /// HDR color texture for post-processing
    hdr_color_texture: Option<Texture2D>,

    /// HDR depth texture for post-processing
    hdr_depth_texture: Option<three_d::DepthTexture2D>,

    /// LOD management system
    lod_manager: Arc<LODManager>,

    /// LOD selector for choosing appropriate LOD levels
    lod_selector: LODSelector,
}

impl ThreeDContextState {
    /// Initialize the context state from a winit window
    pub fn new(window: Arc<WinitWindow>) -> Result<Self> {
        log::info!("Initializing three-d renderer...");

        // Create three-d WindowedContext from winit window with MSAA antialiasing
        let size = window.inner_size();
        let windowed_context = WindowedContext::from_winit_window(
            window.as_ref(),
            SurfaceSettings {
                // Enable 4x MSAA for smooth edges on geometry
                multisamples: 4,
                ..Default::default()
            },
        )
        .with_context(|| "Failed to create three-d context from window")?;

        log::info!("  MSAA: 4x (antialiasing enabled)");

        // WindowedContext implements Deref<Target = Context>, so we can clone the context
        let context: Context = windowed_context.clone();

        // Create component registry for decoding ECS components
        let component_registry = vibe_ecs_bridge::decoders::create_default_registry();

        let debug_line_renderer = DebugLineRenderer::new(&context);

        // Initialize LOD system with default configuration
        let lod_manager = LODManager::new();
        let lod_selector = LODSelector::new(Arc::clone(&lod_manager));

        log::info!("  LOD System initialized (quality: Original, auto-switch: ENABLED)");

        Ok(Self {
            windowed_context,
            context,
            window_size: (size.width, size.height),
            mesh_cache: HashMap::new(),
            material_manager: MaterialManager::new(),
            component_registry,
            skybox_renderer: SkyboxRenderer::new(),
            debug_line_renderer,
            hdr_color_texture: None,
            hdr_depth_texture: None,
            lod_manager,
            lod_selector,
        })
    }

    /// Get reference to three-d context
    pub fn context(&self) -> &Context {
        &self.context
    }

    /// Get reference to windowed context
    pub fn windowed_context(&self) -> &WindowedContext {
        &self.windowed_context
    }

    /// Get mutable reference to windowed context
    pub fn windowed_context_mut(&mut self) -> &mut WindowedContext {
        &mut self.windowed_context
    }

    /// Get current window size
    pub fn window_size(&self) -> (u32, u32) {
        self.window_size
    }

    /// Get reference to mesh cache
    pub fn mesh_cache(&self) -> &HashMap<String, CpuMesh> {
        &self.mesh_cache
    }

    /// Get mutable reference to mesh cache
    pub fn mesh_cache_mut(&mut self) -> &mut HashMap<String, CpuMesh> {
        &mut self.mesh_cache
    }

    /// Get reference to material manager
    pub fn material_manager(&self) -> &MaterialManager {
        &self.material_manager
    }

    /// Get mutable reference to material manager
    pub fn material_manager_mut(&mut self) -> &mut MaterialManager {
        &mut self.material_manager
    }

    /// Get reference to component registry
    pub fn component_registry(&self) -> &ComponentRegistry {
        &self.component_registry
    }

    /// Get reference to skybox renderer
    pub fn skybox_renderer(&self) -> &SkyboxRenderer {
        &self.skybox_renderer
    }

    /// Get mutable reference to skybox renderer
    pub fn skybox_renderer_mut(&mut self) -> &mut SkyboxRenderer {
        &mut self.skybox_renderer
    }

    /// Get reference to debug line renderer
    pub fn debug_line_renderer(&self) -> &DebugLineRenderer {
        &self.debug_line_renderer
    }

    /// Get reference to LOD manager
    pub fn lod_manager(&self) -> &Arc<LODManager> {
        &self.lod_manager
    }

    /// Get reference to LOD selector
    pub fn lod_selector(&self) -> &LODSelector {
        &self.lod_selector
    }

    /// Get HDR color texture (mutable)
    pub fn hdr_color_texture_mut(&mut self) -> &mut Option<Texture2D> {
        &mut self.hdr_color_texture
    }

    /// Get HDR depth texture (mutable)
    pub fn hdr_depth_texture_mut(&mut self) -> &mut Option<three_d::DepthTexture2D> {
        &mut self.hdr_depth_texture
    }

    /// Get mutable references to both HDR color and depth textures at once
    /// This is needed for rendering to avoid borrow checker issues
    pub fn hdr_textures_mut(
        &mut self,
    ) -> (&mut Option<Texture2D>, &mut Option<three_d::DepthTexture2D>) {
        (&mut self.hdr_color_texture, &mut self.hdr_depth_texture)
    }

    /// Get skybox renderer and mutable HDR textures at once
    /// This is needed for rendering to avoid borrow checker issues
    pub fn skybox_and_hdr_textures_mut(
        &mut self,
    ) -> (
        &SkyboxRenderer,
        &mut Option<Texture2D>,
        &mut Option<three_d::DepthTexture2D>,
    ) {
        (
            &self.skybox_renderer,
            &mut self.hdr_color_texture,
            &mut self.hdr_depth_texture,
        )
    }

    /// Get context and window size at once
    /// This is needed for rendering to avoid borrow checker issues
    pub fn context_and_window_size(&self) -> (&Context, (u32, u32)) {
        (&self.context, self.window_size)
    }

    /// Get context and material manager at once
    /// This is needed for material loading to avoid borrow checker issues
    pub fn context_and_material_manager_mut(&mut self) -> (&Context, &mut MaterialManager) {
        (&self.context, &mut self.material_manager)
    }

    /// Get context, LOD manager, and material manager at once
    /// This is needed for mesh rendering to avoid borrow checker issues
    pub fn context_lod_and_material_manager_mut(
        &mut self,
    ) -> (&Context, &Arc<LODManager>, &mut MaterialManager) {
        (&self.context, &self.lod_manager, &mut self.material_manager)
    }

    /// Get a copy of the context and window size
    /// This avoids borrow checker issues by not holding a reference
    pub fn context_and_window_size_copy(&self) -> (Context, (u32, u32)) {
        (self.context.clone(), self.window_size)
    }

    /// Get HDR color texture (immutable)
    pub fn hdr_color_texture(&self) -> Option<&Texture2D> {
        self.hdr_color_texture.as_ref()
    }

    /// Get HDR depth texture (immutable)
    pub fn hdr_depth_texture(&self) -> Option<&three_d::DepthTexture2D> {
        self.hdr_depth_texture.as_ref()
    }

    /// Handle window resize
    pub fn resize(&mut self, width: u32, height: u32) {
        log::info!("Resizing renderer to {}x{}", width, height);

        // CRITICAL: Resize the three-d context to match the new window size
        // Without this, the framebuffer size won't match the window and rendering will be clipped
        self.windowed_context
            .resize(PhysicalSize::new(width, height));

        self.window_size = (width, height);
        self.hdr_color_texture = None;
        self.hdr_depth_texture = None;
    }

    /// Swap buffers (present frame to window)
    pub fn swap_buffers(&mut self) -> Result<()> {
        self.windowed_context
            .swap_buffers()
            .with_context(|| "Failed to swap buffers")
    }

    /// Ensure HDR textures exist for post-processing
    pub fn ensure_hdr_textures(&mut self) {
        if let Some(new_texture) = crate::renderer::post_process_targets::ensure_color_texture(
            &self.context,
            self.hdr_color_texture.as_ref(),
            self.window_size,
        ) {
            self.hdr_color_texture = Some(new_texture);
        }
        if let Some(new_texture) = crate::renderer::post_process_targets::ensure_depth_texture(
            &self.context,
            self.hdr_depth_texture.as_ref(),
            self.window_size,
        ) {
            self.hdr_depth_texture = Some(new_texture);
        }
    }

    /// Load materials from scene
    pub fn load_materials(&mut self, materials_value: &serde_json::Value) {
        self.material_manager.load_from_scene(materials_value);
    }
}
