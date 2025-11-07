use anyhow::Result;
use vibe_scene::Scene as SceneData;
use vibe_scene_graph::SceneGraph;

/// Manages scene loading state
///
/// Responsibilities:
/// - Scene graph management (transform hierarchy)
/// - Scene loading coordination (not the actual entity loading, just state)
pub struct ThreeDSceneLoaderState {
    /// Scene graph for transform hierarchy and camera follow
    scene_graph: Option<SceneGraph>,
}

impl ThreeDSceneLoaderState {
    pub fn new() -> Self {
        Self {
            scene_graph: None,
        }
    }

    /// Get reference to scene graph
    pub fn scene_graph(&self) -> Option<&SceneGraph> {
        self.scene_graph.as_ref()
    }

    /// Get mutable reference to scene graph
    pub fn scene_graph_mut(&mut self) -> &mut Option<SceneGraph> {
        &mut self.scene_graph
    }

    /// Set scene graph
    pub fn set_scene_graph(&mut self, scene_graph: SceneGraph) {
        self.scene_graph = Some(scene_graph);
    }

    /// Clear scene graph
    pub fn clear_scene_graph(&mut self) {
        self.scene_graph = None;
    }

    /// Build scene graph from scene data
    pub fn build_scene_graph(&mut self, scene: &SceneData) -> Result<()> {
        let scene_graph = crate::renderer::scene_loader::build_scene_graph(scene)?;
        self.scene_graph = Some(scene_graph);
        Ok(())
    }

    /// Process prefabs and update scene graph
    pub fn process_prefabs(
        &mut self,
        scene: &SceneData,
        component_registry: &vibe_ecs_bridge::ComponentRegistry,
    ) -> Result<Vec<vibe_scene::Entity>> {
        let (updated_scene_graph, prefab_instances) =
            crate::renderer::scene_loader::process_prefabs(scene, component_registry)?;

        // Update scene graph if prefab instances were created
        if let Some(scene_graph) = updated_scene_graph {
            self.scene_graph = Some(scene_graph);
        }

        Ok(prefab_instances)
    }
}

impl Default for ThreeDSceneLoaderState {
    fn default() -> Self {
        Self::new()
    }
}
