-- Test Light API: color, intensity, position changes
local time = 0
local phase = 0

function update(delta)
    time = time + delta

    -- Phase 0 (0-3s): Change color from white -> red
    -- Phase 1 (3-6s): Change intensity from 1.0 -> 3.0
    -- Phase 2 (6-9s): Move light in a circle

    if time < 3.0 then
        -- Phase 0: Color change white -> red
        local t = time / 3.0
        Light.set_color(1.0, 1.0 - t, 1.0 - t)
        print(string.format("Light API - Phase 0 (Color): t=%.2f, color=(1.0, %.2f, %.2f)", time, 1.0 - t, 1.0 - t))
    elseif time < 6.0 then
        -- Phase 1: Intensity change 1.0 -> 3.0
        if phase ~= 1 then
            Light.set_color(1.0, 1.0, 1.0) -- Reset to white
            phase = 1
        end
        local t = (time - 3.0) / 3.0
        local intensity = 1.0 + t * 2.0
        Light.set_intensity(intensity)
        print(string.format("Light API - Phase 1 (Intensity): t=%.2f, intensity=%.2f", time, intensity))
    else
        -- Phase 2: Position circular motion
        if phase ~= 2 then
            Light.set_intensity(1.0) -- Reset intensity
            phase = 2
        end
        local angle = (time - 6.0) * 0.5
        local x = math.cos(angle) * 3.0
        local z = math.sin(angle) * 3.0
        Transform.set_position(x, 3.0, z)
        print(string.format("Light API - Phase 2 (Position): t=%.2f, pos=(%.2f, 3.0, %.2f)", time, x, z))
    end
end
