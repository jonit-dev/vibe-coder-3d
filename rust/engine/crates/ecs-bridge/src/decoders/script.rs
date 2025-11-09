//! Script component and decoder

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::any::Any;
use vibe_scene::ComponentKindId;

use super::common::default_true;
use crate::{ComponentCapabilities, IComponentDecoder};

/// Script reference for external scripts
#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
pub struct ScriptRef {
    #[serde(default)]
    pub scriptId: String,
    #[serde(default)]
    pub source: String, // "external" | "inline"
    #[serde(default)]
    pub path: Option<String>,
    #[serde(default)]
    pub codeHash: Option<String>,
    #[serde(default)]
    pub lastModified: Option<f64>,
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
pub struct ScriptComponent {
    // Legacy field for backward compatibility
    #[serde(default)]
    pub scriptPath: Option<String>,

    // New scriptRef structure (matches TypeScript)
    #[serde(default)]
    pub scriptRef: Option<ScriptRef>,

    #[serde(default)]
    pub parameters: Value,
    #[serde(default = "default_true")]
    pub enabled: bool,

    // Additional fields from TypeScript (optional, for future use)
    #[serde(default)]
    pub lastModified: Option<f64>,
}

impl ScriptComponent {
    /// Get the Lua script path for execution
    ///
    /// When a script is external, TypeScript stores:
    /// - `scriptRef.path`: Source .ts file path (for editor)
    /// - `scriptPath`: Compiled .lua file path (for runtime)
    ///
    /// This method returns the Lua path needed by the runtime.
    pub fn get_script_path(&self) -> Option<&str> {
        // For external scripts, scriptPath contains the compiled .lua file
        if let Some(ref path) = self.scriptPath {
            return Some(path.as_str());
        }

        // Fall back to scriptRef.path if scriptPath not set (rare)
        if let Some(ref script_ref) = self.scriptRef {
            if let Some(ref path) = script_ref.path {
                return Some(path.as_str());
            }
        }

        None
    }

    /// Get the source TypeScript path (if available)
    pub fn get_source_path(&self) -> Option<&str> {
        if let Some(ref script_ref) = self.scriptRef {
            script_ref.path.as_deref()
        } else {
            None
        }
    }

    /// Check if script comes from an external file
    pub fn is_external(&self) -> bool {
        if let Some(ref script_ref) = self.scriptRef {
            script_ref.source == "external"
        } else {
            false
        }
    }
}

/// Decoder for Script components
pub struct ScriptDecoder;

impl IComponentDecoder for ScriptDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "Script"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: ScriptComponent = serde_json::from_value(value.clone())?;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities {
            affects_rendering: false,
            requires_pass: None,
            stable: true,
        }
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("Script")]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_script_decoder_with_script_ref() {
        let decoder = ScriptDecoder;
        assert!(decoder.can_decode("Script"));
        assert!(!decoder.can_decode("Transform"));

        // Test with scriptRef structure (matches TypeScript serialization)
        let json = serde_json::json!({
            "scriptRef": {
                "scriptId": "entity-3.script",
                "source": "external",
                "path": "src/game/scripts/entity-3.script.ts",
                "codeHash": "8f519ba132d3fc27d673bd4ea088be0c30542fd77207fb981cdf3c58f9d1bbeb",
                "lastModified": 1761060772089.9998
            },
            "lastModified": 1761060772089.9998,
            "scriptPath": "entity-3.script.lua",
            "enabled": true,
            "parameters": {}
        });

        let decoded = decoder.decode(&json).unwrap();
        let script = decoded.downcast_ref::<ScriptComponent>().unwrap();

        // Verify scriptRef fields
        assert!(script.scriptRef.is_some());
        let script_ref = script.scriptRef.as_ref().unwrap();
        assert_eq!(script_ref.scriptId, "entity-3.script");
        assert_eq!(script_ref.source, "external");
        assert_eq!(
            script_ref.path.as_deref(),
            Some("src/game/scripts/entity-3.script.ts")
        );
        assert!(script_ref.codeHash.is_some());
        assert!(script_ref.lastModified.is_some());

        // Verify legacy scriptPath field
        assert_eq!(script.scriptPath.as_deref(), Some("entity-3.script.lua"));

        // Verify enabled flag
        assert_eq!(script.enabled, true);

        // Test get_script_path() helper - should return Lua path for runtime
        assert_eq!(script.get_script_path(), Some("entity-3.script.lua"));

        // Test get_source_path() helper - returns TypeScript source
        assert_eq!(
            script.get_source_path(),
            Some("src/game/scripts/entity-3.script.ts")
        );

        // Test is_external() helper
        assert!(script.is_external());
    }

    #[test]
    fn test_script_decoder_legacy_script_path() {
        let decoder = ScriptDecoder;

        // Test with legacy scriptPath only (backward compatibility)
        let json = serde_json::json!({
            "scriptPath": "scripts/old-script.lua",
            "enabled": true,
            "parameters": { "speed": 5.0 }
        });

        let decoded = decoder.decode(&json).unwrap();
        let script = decoded.downcast_ref::<ScriptComponent>().unwrap();

        // Verify legacy path
        assert_eq!(script.scriptPath.as_deref(), Some("scripts/old-script.lua"));
        assert!(script.scriptRef.is_none());

        // Test get_script_path() fallback
        assert_eq!(script.get_script_path(), Some("scripts/old-script.lua"));

        // Test is_external() with no scriptRef
        assert!(!script.is_external());
    }

    #[test]
    fn test_script_decoder_defaults() {
        let decoder = ScriptDecoder;
        let json = serde_json::json!({});

        let decoded = decoder.decode(&json).unwrap();
        let script = decoded.downcast_ref::<ScriptComponent>().unwrap();

        // Verify defaults
        assert_eq!(script.scriptPath, None);
        assert_eq!(script.scriptRef, None);
        assert_eq!(script.enabled, true);
        assert!(script.parameters.is_null());
        assert_eq!(script.get_script_path(), None);
        assert!(!script.is_external());
    }

    #[test]
    fn test_script_component_lua_path_priority() {
        // Test that get_script_path() returns Lua path, get_source_path() returns TS path
        let json = serde_json::json!({
            "scriptRef": {
                "scriptId": "test",
                "source": "external",
                "path": "scripts/source.ts",
            },
            "scriptPath": "scripts/compiled.lua",
            "enabled": true
        });

        let script: ScriptComponent = serde_json::from_value(json).unwrap();

        // get_script_path() returns Lua path for runtime execution
        assert_eq!(script.get_script_path(), Some("scripts/compiled.lua"));

        // get_source_path() returns TypeScript source for editor/debugging
        assert_eq!(script.get_source_path(), Some("scripts/source.ts"));

        // Direct field access still works
        assert_eq!(script.scriptPath.as_deref(), Some("scripts/compiled.lua"));
    }

    #[test]
    fn test_script_capabilities() {
        let decoder = ScriptDecoder;
        let caps = decoder.capabilities();

        assert_eq!(caps.affects_rendering, false);
        assert_eq!(caps.requires_pass, None);
        assert!(caps.stable);
    }

    #[test]
    fn test_script_component_kinds() {
        let decoder = ScriptDecoder;
        let kinds = decoder.component_kinds();

        assert_eq!(kinds.len(), 1);
        assert_eq!(kinds[0].as_str(), "Script");
    }
}
