/// Debug subsystem state - all features enabled when debug mode is on
#[derive(Debug, Clone)]
pub struct DebugState {
    pub enabled: bool,
}

impl DebugState {
    pub fn new(enabled: bool) -> Self {
        Self { enabled }
    }

    pub fn is_enabled(&self) -> bool {
        self.enabled
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
        assert!(!state.is_enabled());
    }

    #[test]
    fn test_new_enabled() {
        let state = DebugState::new(true);
        assert!(state.enabled);
        assert!(state.is_enabled());
    }

    #[test]
    fn test_default() {
        let state = DebugState::default();
        assert!(!state.enabled);
        assert!(!state.is_enabled());
    }
}
