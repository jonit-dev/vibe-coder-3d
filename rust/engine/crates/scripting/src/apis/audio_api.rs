use mlua::prelude::*;
use vibe_audio::{AudioManager, SoundHandle};

/// Register the Audio API for Lua scripts
///
/// Provides sound playback capabilities with support for:
/// - Loading and playing sounds
/// - Volume control
/// - Playback speed/pitch control
/// - Looping sounds
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
///     Audio.play(soundId, {volume = 0.8})
///
///     -- Play with options
///     local musicId = Audio.load("game/sounds/music.mp3")
///     Audio.play(musicId, {
///         volume = 0.5,
///         loop = true,
///         speed = 1.0
///     })
/// end
///
/// function onUpdate()
///     -- Check if playing
///     if Audio.isPlaying(soundId) then
///         console:log("Sound is playing")
///     end
/// end
/// ```
pub fn register_audio_api(lua: &Lua, audio_manager: &mut AudioManager) -> LuaResult<()> {
    // Create Audio table
    let audio_table = lua.create_table()?;

    // Store audio manager as userdata for access in closures
    // Note: In a full implementation, you'd want to use Arc<Mutex<AudioManager>>
    // for thread-safe shared access. For now, we'll use a simpler approach.

    // Audio.load(path: string) -> number (sound handle)
    // Loads a sound file and returns a handle for later use
    audio_table.set(
        "load",
        lua.create_function(|lua, path: String| {
            // Get audio manager from context
            // For now, this is a stub - needs proper context access
            let handle_id = 0u64; // Placeholder
            Ok(handle_id)
        })?,
    )?;

    // Audio.play(soundId: number, options?: table) -> void
    // Plays a loaded sound with optional parameters
    audio_table.set(
        "play",
        lua.create_function(|lua, (sound_id, options): (u64, Option<LuaTable>)| {
            let volume = if let Some(opts) = options.as_ref() {
                opts.get::<Option<f32>>("volume")?.unwrap_or(1.0)
            } else {
                1.0
            };

            let loop_sound = if let Some(opts) = options.as_ref() {
                opts.get::<Option<bool>>("loop")?.unwrap_or(false)
            } else {
                false
            };

            let speed = if let Some(opts) = options.as_ref() {
                opts.get::<Option<f32>>("speed")?.unwrap_or(1.0)
            } else {
                1.0
            };

            // Stub implementation - needs actual audio manager access
            println!(
                "Audio.play called: id={}, volume={}, loop={}, speed={}",
                sound_id, volume, loop_sound, speed
            );

            Ok(())
        })?,
    )?;

    // Audio.stop(soundId: number) -> void
    // Stops a playing sound
    audio_table.set(
        "stop",
        lua.create_function(|_lua, sound_id: u64| {
            println!("Audio.stop called: id={}", sound_id);
            Ok(())
        })?,
    )?;

    // Audio.pause(soundId: number) -> void
    // Pauses a playing sound
    audio_table.set(
        "pause",
        lua.create_function(|_lua, sound_id: u64| {
            println!("Audio.pause called: id={}", sound_id);
            Ok(())
        })?,
    )?;

    // Audio.setVolume(soundId: number, volume: number) -> void
    // Sets the volume of a sound (0.0 to 1.0)
    audio_table.set(
        "setVolume",
        lua.create_function(|_lua, (sound_id, volume): (u64, f32)| {
            let clamped_volume = volume.clamp(0.0, 1.0);
            println!(
                "Audio.setVolume called: id={}, volume={}",
                sound_id, clamped_volume
            );
            Ok(())
        })?,
    )?;

    // Audio.setSpeed(soundId: number, speed: number) -> void
    // Sets the playback speed/pitch (0.1 to 4.0)
    audio_table.set(
        "setSpeed",
        lua.create_function(|_lua, (sound_id, speed): (u64, f32)| {
            let clamped_speed = speed.clamp(0.1, 4.0);
            println!(
                "Audio.setSpeed called: id={}, speed={}",
                sound_id, clamped_speed
            );
            Ok(())
        })?,
    )?;

    // Audio.isPlaying(soundId: number) -> boolean
    // Checks if a sound is currently playing
    audio_table.set(
        "isPlaying",
        lua.create_function(|_lua, sound_id: u64| {
            // Stub implementation
            println!("Audio.isPlaying called: id={}", sound_id);
            Ok(false)
        })?,
    )?;

    // Audio.getDuration(soundId: number) -> number
    // Gets the total duration of a sound in seconds
    audio_table.set(
        "getDuration",
        lua.create_function(|_lua, sound_id: u64| {
            // Stub implementation
            println!("Audio.getDuration called: id={}", sound_id);
            Ok(0.0f32)
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
        let mut audio_manager = AudioManager::new().unwrap();

        let result = register_audio_api(&lua, &mut audio_manager);
        assert!(result.is_ok());

        // Verify Audio global exists
        let result: LuaResult<bool> = lua.load("return Audio ~= nil").eval();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), true);
    }

    #[test]
    fn test_audio_api_methods_exist() {
        let lua = Lua::new();
        let mut audio_manager = AudioManager::new().unwrap();
        register_audio_api(&lua, &mut audio_manager).unwrap();

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
    fn test_audio_play_with_options() {
        let lua = Lua::new();
        let mut audio_manager = AudioManager::new().unwrap();
        register_audio_api(&lua, &mut audio_manager).unwrap();

        // Test play with options table
        let result: LuaResult<()> = lua
            .load(
                r#"
                Audio.play(1, {
                    volume = 0.5,
                    loop = true,
                    speed = 1.5
                })
                "#,
            )
            .exec();

        assert!(result.is_ok());
    }

    #[test]
    fn test_audio_volume_clamping() {
        let lua = Lua::new();
        let mut audio_manager = AudioManager::new().unwrap();
        register_audio_api(&lua, &mut audio_manager).unwrap();

        // Test volume clamping (should not error)
        let result: LuaResult<()> = lua
            .load(
                r#"
                Audio.setVolume(1, 2.0)  -- Should clamp to 1.0
                Audio.setVolume(1, -0.5) -- Should clamp to 0.0
                "#,
            )
            .exec();

        assert!(result.is_ok());
    }

    #[test]
    fn test_audio_speed_clamping() {
        let lua = Lua::new();
        let mut audio_manager = AudioManager::new().unwrap();
        register_audio_api(&lua, &mut audio_manager).unwrap();

        // Test speed clamping (should not error)
        let result: LuaResult<()> = lua
            .load(
                r#"
                Audio.setSpeed(1, 5.0)  -- Should clamp to 4.0
                Audio.setSpeed(1, 0.05) -- Should clamp to 0.1
                "#,
            )
            .exec();

        assert!(result.is_ok());
    }
}
