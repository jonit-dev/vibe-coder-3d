use mlua::prelude::*;

// Note: Audio API is currently stubbed due to AudioManager not being Send/Sync
// The actual audio integration will need to be done differently to avoid threading issues

/// Register the Audio API for Lua scripts
///
/// Provides sound playback capabilities with support for:
/// - Loading and playing sounds
/// - Volume control
/// - Playback speed/pitch control
/// - Looping sounds (note: must be set at load time in rodio)
/// - Stopping sounds
///
/// TypeScript API Reference: src/core/lib/scripting/apis/AudioAPI.ts
///
/// ## Usage from Lua
///
/// ```lua
/// function onStart()
///     -- Load and play a sound
///     local soundId = Audio.load("game/sounds/click.wav")
///     Audio.play(soundId)
///     Audio.setVolume(soundId, 0.8)
///
///     -- Load with path
///     local musicId = Audio.load("game/sounds/music.mp3")
///     Audio.play(musicId)
///     Audio.setVolume(musicId, 0.5)
///     Audio.setSpeed(musicId, 1.0)
/// end
///
/// function onUpdate()
///     -- Check if playing
///     if Audio.isPlaying(soundId) then
///         console.log("Sound is playing")
///     end
/// end
/// ```
pub fn register_audio_api(lua: &Lua) -> LuaResult<()> {
    log::info!("Registering Audio API (stubbed implementation)");

    let audio_table = lua.create_table()?;

    // Audio.load(path: string) -> number (sound handle ID)
    // Loads a sound file and returns a handle for later use
    audio_table.set(
        "load",
        lua.create_function(|_, path: String| -> LuaResult<f64> {
            log::debug!("[Audio API] Stub: load('{}')", path);
            Ok(1.0) // Return a dummy handle ID
        })?,
    )?;

    // Audio.play(soundId: number) -> void
    // Plays a loaded sound
    audio_table.set(
        "play",
        lua.create_function(|_, sound_id: f64| -> LuaResult<()> {
            log::debug!("[Audio API] Stub: play({})", sound_id);
            Ok(())
        })?,
    )?;

    // Audio.stop(soundId: number) -> void
    // Stops a playing sound
    audio_table.set(
        "stop",
        lua.create_function(|_, sound_id: f64| -> LuaResult<()> {
            log::debug!("[Audio API] Stub: stop({})", sound_id);
            Ok(())
        })?,
    )?;

    // Audio.pause(soundId: number) -> void
    // Pauses a playing sound
    audio_table.set(
        "pause",
        lua.create_function(|_, sound_id: f64| -> LuaResult<()> {
            log::debug!("[Audio API] Stub: pause({})", sound_id);
            Ok(())
        })?,
    )?;

    // Audio.setVolume(soundId: number, volume: number) -> void
    // Sets the volume of a sound (0.0 to 1.0)
    audio_table.set(
        "setVolume",
        lua.create_function(|_, (sound_id, volume): (f64, f32)| -> LuaResult<()> {
            log::debug!("[Audio API] Stub: setVolume({}, {})", sound_id, volume);
            Ok(())
        })?,
    )?;

    // Audio.setSpeed(soundId: number, speed: number) -> void
    // Sets the playback speed/pitch (0.1 to 4.0)
    audio_table.set(
        "setSpeed",
        lua.create_function(|_, (sound_id, speed): (f64, f32)| -> LuaResult<()> {
            log::debug!("[Audio API] Stub: setSpeed({}, {})", sound_id, speed);
            Ok(())
        })?,
    )?;

    // Audio.isPlaying(soundId: number) -> boolean
    // Checks if a sound is currently playing
    audio_table.set(
        "isPlaying",
        lua.create_function(|_, sound_id: f64| -> LuaResult<bool> {
            log::debug!("[Audio API] Stub: isPlaying({})", sound_id);
            Ok(false)
        })?,
    )?;

    // Audio.getDuration(soundId: number) -> number
    // Gets the total duration of a sound in seconds
    audio_table.set(
        "getDuration",
        lua.create_function(|_, sound_id: f64| -> LuaResult<f32> {
            log::debug!("[Audio API] Stub: getDuration({})", sound_id);
            Ok(0.0)
        })?,
    )?;

    // Register the Audio global
    lua.globals().set("Audio", audio_table)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_register_audio_api() {
        let lua = Lua::new();

        let result = register_audio_api(&lua);
        assert!(result.is_ok());

        // Verify Audio global exists
        let result: LuaResult<bool> = lua.load("return Audio ~= nil").eval();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), true);
    }

    #[test]
    fn test_audio_api_methods_exist() {
        let lua = Lua::new();
        register_audio_api(&lua).unwrap();

        // Check all methods exist
        let methods = vec![
            "load",
            "play",
            "stop",
            "pause",
            "setVolume",
            "setSpeed",
            "isPlaying",
            "getDuration",
        ];

        for method in methods {
            let result: LuaResult<bool> = lua
                .load(&format!("return type(Audio.{}) == 'function'", method))
                .eval();
            assert!(result.is_ok(), "Method {} should exist", method);
            assert_eq!(
                result.unwrap(),
                true,
                "Method {} should be a function",
                method
            );
        }
    }

    #[test]
    fn test_audio_api_stub_methods() {
        let lua = Lua::new();
        register_audio_api(&lua).unwrap();

        // Test that stub methods work without errors
        let result: LuaResult<()> = lua
            .load(
                r#"
                local handle = Audio.load("test.wav")
                Audio.play(handle)
                Audio.stop(handle)
                Audio.pause(handle)
                Audio.setVolume(handle, 0.5)
                Audio.setSpeed(handle, 1.5)
                local playing = Audio.isPlaying(handle)
                local duration = Audio.getDuration(handle)
                "#,
            )
            .exec();

        assert!(result.is_ok());
    }
}
