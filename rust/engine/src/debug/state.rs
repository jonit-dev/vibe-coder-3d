/// Debug subsystem state - tracks enabled features and toggles
#[derive(Debug, Clone)]
pub struct DebugState {
    pub enabled: bool,
    pub show_hud: bool,
    pub show_colliders: bool,
    pub use_debug_camera: bool,
    pub show_gpu_profiler: bool,
}

impl DebugState {
    pub fn new(enabled: bool) -> Self {
        Self {
            enabled,
            // All debug features start ENABLED by default when debug mode is on
            show_hud: enabled,
            show_colliders: enabled,
            use_debug_camera: false, // Debug camera starts OFF - press F3 to enable
            show_gpu_profiler: false, // GPU profiler starts OFF - press F4 to enable
        }
    }

    pub fn toggle_hud(&mut self) {
        if self.enabled {
            self.show_hud = !self.show_hud;
            log::info!("Debug HUD: {}", if self.show_hud { "ON" } else { "OFF" });
        }
    }

    pub fn toggle_colliders(&mut self) {
        if self.enabled {
            self.show_colliders = !self.show_colliders;
            log::info!("Collider Gizmos: {}", if self.show_colliders { "ON" } else { "OFF" });
        }
    }

    pub fn toggle_debug_camera(&mut self) {
        if self.enabled {
            self.use_debug_camera = !self.use_debug_camera;
            log::info!("Debug Camera: {}", if self.use_debug_camera { "ON" } else { "OFF" });
        }
    }

    pub fn toggle_gpu_profiler(&mut self) {
        if self.enabled {
            self.show_gpu_profiler = !self.show_gpu_profiler;
            log::info!("GPU Profiler: {}", if self.show_gpu_profiler { "ON" } else { "OFF" });
        }
    }
}

impl Default for DebugState {
    fn default() -> Self {
        Self::new(false)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_disabled() {
        let state = DebugState::new(false);
        assert!(!state.enabled);
        assert!(!state.show_hud);
        assert!(!state.show_colliders);
        assert!(!state.use_debug_camera);
        assert!(!state.show_gpu_profiler);
    }

    #[test]
    fn test_new_enabled() {
        let state = DebugState::new(true);
        assert!(state.enabled);
        // Features still start disabled
        assert!(!state.show_hud);
        assert!(!state.show_colliders);
        assert!(!state.use_debug_camera);
        assert!(!state.show_gpu_profiler);
    }

    #[test]
    fn test_toggle_hud() {
        let mut state = DebugState::new(true);
        assert!(!state.show_hud);
        state.toggle_hud();
        assert!(state.show_hud);
        state.toggle_hud();
        assert!(!state.show_hud);
    }

    #[test]
    fn test_toggle_when_disabled() {
        let mut state = DebugState::new(false);
        state.toggle_hud();
        assert!(!state.show_hud); // Should not toggle when debug disabled
        state.toggle_colliders();
        assert!(!state.show_colliders);
    }

    #[test]
    fn test_default() {
        let state = DebugState::default();
        assert!(!state.enabled);
    }
}
