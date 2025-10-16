use std::env;

/// Configuration for debug mode features
#[derive(Debug, Clone, Copy)]
pub struct DebugConfig {
    pub enabled: bool,
}

impl DebugConfig {
    /// Create debug config from environment variable and CLI flag
    /// CLI flag takes precedence over environment variable
    pub fn from_env_and_cli(cli_debug: bool) -> Self {
        let env_debug = match env::var("DEBUG_MODE") {
            Ok(val) => matches!(val.as_str(), "1" | "true" | "TRUE" | "yes" | "on"),
            Err(_) => false,
        };

        let enabled = cli_debug || env_debug;

        if enabled {
            log::info!("Debug mode enabled (CLI: {}, ENV: {})", cli_debug, env_debug);
        }

        Self { enabled }
    }

    pub fn is_enabled(&self) -> bool {
        self.enabled
    }
}

impl Default for DebugConfig {
    fn default() -> Self {
        Self { enabled: false }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_cli_only() {
        env::remove_var("DEBUG_MODE");
        let config = DebugConfig::from_env_and_cli(true);
        assert!(config.enabled);
    }

    #[test]
    fn test_config_env_only() {
        env::set_var("DEBUG_MODE", "true");
        let config = DebugConfig::from_env_and_cli(false);
        assert!(config.enabled);
        env::remove_var("DEBUG_MODE");
    }

    #[test]
    fn test_config_both() {
        env::set_var("DEBUG_MODE", "true");
        let config = DebugConfig::from_env_and_cli(true);
        assert!(config.enabled);
        env::remove_var("DEBUG_MODE");
    }

    #[test]
    fn test_config_neither() {
        env::remove_var("DEBUG_MODE");
        let config = DebugConfig::from_env_and_cli(false);
        assert!(!config.enabled);
    }

    #[test]
    fn test_config_env_variations() {
        for val in &["1", "true", "TRUE", "yes", "on"] {
            env::set_var("DEBUG_MODE", val);
            let config = DebugConfig::from_env_and_cli(false);
            assert!(config.enabled, "Failed for DEBUG_MODE={}", val);
        }
        env::remove_var("DEBUG_MODE");
    }

    #[test]
    fn test_config_env_false_values() {
        for val in &["0", "false", "FALSE", "no", "off", "maybe"] {
            env::set_var("DEBUG_MODE", val);
            let config = DebugConfig::from_env_and_cli(false);
            assert!(!config.enabled, "Should be false for DEBUG_MODE={}", val);
        }
        env::remove_var("DEBUG_MODE");
    }

    #[test]
    fn test_default() {
        let config = DebugConfig::default();
        assert!(!config.enabled);
    }
}
