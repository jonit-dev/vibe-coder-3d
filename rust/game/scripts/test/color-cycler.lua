-- Color Cycler Script
-- Tests Material API: setColor with RGB rainbow cycle

local time = 0
local hue = 0

function onStart()
    console:log("Color Cycler - START")
    console:log("Testing Material API: color changes (HSV to RGB)")
end

function onUpdate(deltaTime)
    time = time + deltaTime

    -- Cycle hue from 0 to 360 degrees over 6 seconds
    hue = (time * 60) % 360

    -- Convert HSV to RGB (simple conversion)
    local r, g, b = hsvToRgb(hue, 1.0, 1.0)

    -- Convert to hex color
    local hexColor = rgbToHex(r, g, b)

    -- Set the material color
    entity.meshRenderer.material:setColor(hexColor)

    -- Also rotate the sphere slowly
    entity.transform:rotate(0, deltaTime * 30, 0)
end

-- HSV to RGB conversion (H: 0-360, S: 0-1, V: 0-1)
function hsvToRgb(h, s, v)
    local c = v * s
    local x = c * (1 - math.abs((h / 60) % 2 - 1))
    local m = v - c

    local r, g, b = 0, 0, 0

    if h < 60 then
        r, g, b = c, x, 0
    elseif h < 120 then
        r, g, b = x, c, 0
    elseif h < 180 then
        r, g, b = 0, c, x
    elseif h < 240 then
        r, g, b = 0, x, c
    elseif h < 300 then
        r, g, b = x, 0, c
    else
        r, g, b = c, 0, x
    end

    return r + m, g + m, b + m
end

function rgbToHex(r, g, b)
    local ri = math.floor(r * 255)
    local gi = math.floor(g * 255)
    local bi = math.floor(b * 255)
    return string.format("#%02x%02x%02x", ri, gi, bi)
end
