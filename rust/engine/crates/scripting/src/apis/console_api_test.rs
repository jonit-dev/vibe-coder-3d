#[cfg(test)]
mod tests {
    use super::super::console_api::*;
    use mlua::Lua;

    #[test]
    fn test_console_log() {
        let lua = Lua::new();
        register_console_api(&lua).unwrap();

        lua.load(r#"console:log("Hello from Lua!")"#)
            .exec()
            .unwrap();

        lua.load(r#"console:log("Multiple", "arguments", 123)"#)
            .exec()
            .unwrap();
    }

    #[test]
    fn test_console_warn() {
        let lua = Lua::new();
        register_console_api(&lua).unwrap();

        lua.load(r#"console:warn("Warning message")"#)
            .exec()
            .unwrap();
    }

    #[test]
    fn test_console_error() {
        let lua = Lua::new();
        register_console_api(&lua).unwrap();

        lua.load(r#"console:error("Error message")"#)
            .exec()
            .unwrap();
    }

    #[test]
    fn test_console_various_types() {
        let lua = Lua::new();
        register_console_api(&lua).unwrap();

        lua.load(
            r#"
            console:log("String:", "hello")
            console:log("Number:", 42)
            console:log("Boolean:", true)
            console:log("Nil:", nil)
            console:log("Table:", {1, 2, 3})
        "#,
        )
        .exec()
        .unwrap();
    }
}
