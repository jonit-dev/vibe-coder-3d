use crate::bridge::LiveBridge;
use anyhow::{Context, Result};
use std::fs;
use std::path::{Path, PathBuf};

/// Native IPC adapter using file watching
pub struct FileIpcAdapter {
    /// Path to watch for scene updates
    scene_path: PathBuf,
    /// Path to watch for diff updates
    diff_path: Option<PathBuf>,
    /// Live bridge instance
    bridge: LiveBridge,
}

impl FileIpcAdapter {
    /// Create a new file-based IPC adapter
    pub fn new(scene_path: impl AsRef<Path>, bridge: LiveBridge) -> Self {
        Self {
            scene_path: scene_path.as_ref().to_path_buf(),
            diff_path: None,
            bridge,
        }
    }

    /// Set optional diff file path for incremental updates
    pub fn with_diff_path(mut self, diff_path: impl AsRef<Path>) -> Self {
        self.diff_path = Some(diff_path.as_ref().to_path_buf());
        self
    }

    /// Load initial scene from file
    pub fn load_initial_scene(&mut self) -> Result<()> {
        log::info!("Loading initial scene from: {}", self.scene_path.display());

        let json = fs::read_to_string(&self.scene_path)
            .with_context(|| format!("Failed to read scene file: {}", self.scene_path.display()))?;

        self.bridge.load_scene(&json)?;

        log::info!("Initial scene loaded successfully");
        Ok(())
    }

    /// Check and apply diff file if it exists
    pub fn check_for_diffs(&mut self) -> Result<bool> {
        let Some(diff_path) = &self.diff_path else {
            return Ok(false);
        };

        if !diff_path.exists() {
            return Ok(false);
        }

        log::debug!("Found diff file: {}", diff_path.display());

        let diff_json = fs::read_to_string(diff_path)
            .with_context(|| format!("Failed to read diff file: {}", diff_path.display()))?;

        self.bridge.apply_diff(&diff_json)?;

        // Remove diff file after applying
        fs::remove_file(diff_path)
            .with_context(|| format!("Failed to remove diff file: {}", diff_path.display()))?;

        log::info!("Applied diff from file");
        Ok(true)
    }

    /// Get reference to live bridge
    pub fn bridge(&self) -> &LiveBridge {
        &self.bridge
    }

    /// Get mutable reference to live bridge
    pub fn bridge_mut(&mut self) -> &mut LiveBridge {
        &mut self.bridge
    }
}

/// Socket-based IPC adapter (stub for future implementation)
#[cfg(feature = "socket-ipc")]
pub struct SocketIpcAdapter {
    port: u16,
    bridge: LiveBridge,
}

#[cfg(feature = "socket-ipc")]
impl SocketIpcAdapter {
    /// Create a new socket-based IPC adapter
    pub fn new(port: u16, bridge: LiveBridge) -> Self {
        Self { port, bridge }
    }

    /// Start listening for connections
    pub fn listen(&mut self) -> Result<()> {
        log::info!("Starting IPC socket listener on port {}", self.port);
        // TODO: Implement socket server
        anyhow::bail!("Socket IPC not yet implemented")
    }

    /// Get reference to live bridge
    pub fn bridge(&self) -> &LiveBridge {
        &self.bridge
    }

    /// Get mutable reference to live bridge
    pub fn bridge_mut(&mut self) -> &mut LiveBridge {
        &mut self.bridge
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use vibe_ecs_bridge::create_default_registry;

    #[test]
    fn test_file_ipc_load_scene() {
        let temp_dir = std::env::temp_dir();
        let scene_path = temp_dir.join("test_scene.json");

        // Write test scene
        let scene_json = r#"{"entities": [], "metadata": {}}"#;
        fs::write(&scene_path, scene_json).unwrap();

        let registry = create_default_registry();
        let bridge = LiveBridge::new(registry);
        let mut adapter = FileIpcAdapter::new(&scene_path, bridge);

        adapter.load_initial_scene().unwrap();
        assert_eq!(adapter.bridge().scene().entities.len(), 0);

        // Cleanup
        fs::remove_file(&scene_path).unwrap();
    }

    #[test]
    fn test_file_ipc_apply_diff() {
        let temp_dir = std::env::temp_dir();
        let scene_path = temp_dir.join("test_scene_diff.json");
        let diff_path = temp_dir.join("test_diff.json");

        // Write test scene
        let scene_json = r#"{"entities": [], "metadata": {}}"#;
        fs::write(&scene_path, scene_json).unwrap();

        let registry = create_default_registry();
        let bridge = LiveBridge::new(registry);
        let mut adapter = FileIpcAdapter::new(&scene_path, bridge).with_diff_path(&diff_path);

        adapter.load_initial_scene().unwrap();

        // Write diff file
        let diff_json = r#"{
            "sequence": 1,
            "diffs": [{
                "type": "AddEntity",
                "persistent_id": "new-entity",
                "id": 1,
                "name": "New Entity",
                "parent_persistent_id": null,
                "components": []
            }]
        }"#;
        fs::write(&diff_path, diff_json).unwrap();

        // Check for diffs
        let applied = adapter.check_for_diffs().unwrap();
        assert!(applied);
        assert_eq!(adapter.bridge().scene().entities.len(), 1);

        // Diff file should be removed
        assert!(!diff_path.exists());

        // Cleanup
        fs::remove_file(&scene_path).unwrap();
    }
}
