-- Audio API Test
-- Tests the stubbed Audio API functionality

function onStart()
    console.log("=== Audio API Test Started ===")

    -- Test Audio.load
    console.log("Testing Audio.load...")
    local soundId = Audio.load("test-sound.wav")
    console.log("Audio.load returned soundId: " .. tostring(soundId))

    -- Test Audio.play
    console.log("Testing Audio.play...")
    Audio.play(soundId)
    console.log("Audio.play called successfully")

    -- Test Audio.setVolume
    console.log("Testing Audio.setVolume...")
    Audio.setVolume(soundId, 0.8)
    console.log("Audio.setVolume called with volume 0.8")

    -- Test Audio.setSpeed
    console.log("Testing Audio.setSpeed...")
    Audio.setSpeed(soundId, 1.5)
    console.log("Audio.setSpeed called with speed 1.5")

    -- Test Audio.isPlaying
    console.log("Testing Audio.isPlaying...")
    local playing = Audio.isPlaying(soundId)
    console.log("Audio.isPlaying returned: " .. tostring(playing))

    -- Test Audio.getDuration
    console.log("Testing Audio.getDuration...")
    local duration = Audio.getDuration(soundId)
    console.log("Audio.getDuration returned: " .. tostring(duration))

    -- Test Audio.pause
    console.log("Testing Audio.pause...")
    Audio.pause(soundId)
    console.log("Audio.pause called successfully")

    -- Test Audio.stop
    console.log("Testing Audio.stop...")
    Audio.stop(soundId)
    console.log("Audio.stop called successfully")

    console.log("=== Audio API Test Completed ===")
end

function onUpdate(deltaTime)
    -- Audio API test only needs to run once
end