-- Audio API Test
-- Tests the Audio API functionality for sound playback and control

function onStart()
    console:log("=== Audio API Test Started ===")

    -- Check if entity has audio API
    if entity.audio then
        console:log("Entity has audio API available")

        -- Test audio.load
        console:log("Testing audio.load...")
        local success = entity.audio:load("test-sound.wav")
        console:log("Audio load result: " .. tostring(success))

        -- Test audio.play
        console:log("Testing audio.play...")
        entity.audio:play()
        console:log("Audio playback started")

        -- Test audio.setVolume
        console:log("Testing audio.setVolume...")
        entity.audio:setVolume(0.5)
        console:log("Volume set to 0.5")

        -- Test audio.pause
        console:log("Testing audio.pause...")
        entity.audio:pause()
        console:log("Audio paused")

        -- Test audio.stop
        console:log("Testing audio.stop...")
        entity.audio:stop()
        console:log("Audio stopped")

        console:log("=== Audio API Test Completed Successfully ===")
    else
        console:log("Entity does not have audio API")
        console:log("=== Audio API Test Skipped ===")
    end
end

function onUpdate(deltaTime)
    -- Audio API test only needs to run once
end