--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
-- Lua Library inline imports
local function __TS__Number(value)
    local valueType = type(value)
    if valueType == "number" then
        return value
    elseif valueType == "string" then
        local numberValue = tonumber(value)
        if numberValue then
            return numberValue
        end
        if value == "Infinity" then
            return math.huge
        end
        if value == "-Infinity" then
            return -math.huge
        end
        local stringWithoutSpaces = string.gsub(value, "%s", "")
        if stringWithoutSpaces == "" then
            return 0
        end
        return 0 / 0
    elseif valueType == "boolean" then
        return value and 1 or 0
    else
        return 0 / 0
    end
end

local function __TS__NumberToFixed(self, fractionDigits)
    if math.abs(self) >= 1e+21 or self ~= self then
        return tostring(self)
    end
    local f = math.floor(fractionDigits or 0)
    if f < 0 or f > 99 then
        error("toFixed() digits argument must be between 0 and 99", 0)
    end
    return string.format(
        ("%." .. tostring(f)) .. "f",
        self
    )
end

local function __TS__StringIncludes(self, searchString, position)
    if not position then
        position = 1
    else
        position = position + 1
    end
    local index = string.find(self, searchString, position, true)
    return index ~= nil
end

local __TS__Match = string.match

local function __TS__SourceMapTraceBack(fileName, sourceMap)
    _G.__TS__sourcemap = _G.__TS__sourcemap or ({})
    _G.__TS__sourcemap[fileName] = sourceMap
    if _G.__TS__originalTraceback == nil then
        local originalTraceback = debug.traceback
        _G.__TS__originalTraceback = originalTraceback
        debug.traceback = function(thread, message, level)
            local trace
            if thread == nil and message == nil and level == nil then
                trace = originalTraceback()
            elseif __TS__StringIncludes(_VERSION, "Lua 5.0") then
                trace = originalTraceback((("[Level " .. tostring(level)) .. "] ") .. tostring(message))
            else
                trace = originalTraceback(thread, message, level)
            end
            if type(trace) ~= "string" then
                return trace
            end
            local function replacer(____, file, srcFile, line)
                local fileSourceMap = _G.__TS__sourcemap[file]
                if fileSourceMap ~= nil and fileSourceMap[line] ~= nil then
                    local data = fileSourceMap[line]
                    if type(data) == "number" then
                        return (srcFile .. ":") .. tostring(data)
                    end
                    return (data.file .. ":") .. tostring(data.line)
                end
                return (file .. ":") .. line
            end
            local result = string.gsub(
                trace,
                "(%S+)%.lua:(%d+)",
                function(file, line) return replacer(nil, file .. ".lua", file .. ".ts", line) end
            )
            local function stringReplacer(____, file, line)
                local fileSourceMap = _G.__TS__sourcemap[file]
                if fileSourceMap ~= nil and fileSourceMap[line] ~= nil then
                    local chunkName = (__TS__Match(file, "%[string \"([^\"]+)\"%]"))
                    local sourceName = string.gsub(chunkName, ".lua$", ".ts")
                    local data = fileSourceMap[line]
                    if type(data) == "number" then
                        return (sourceName .. ":") .. tostring(data)
                    end
                    return (data.file .. ":") .. tostring(data.line)
                end
                return (file .. ":") .. line
            end
            result = string.gsub(
                result,
                "(%[string \"[^\"]+\"%]):(%d+)",
                function(file, line) return stringReplacer(nil, file, line) end
            )
            return result
        end
    end
end
-- End of Lua Library inline imports
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["114"] = 1,["115"] = 2,["116"] = 3,["117"] = 1,["118"] = 6,["119"] = 8,["120"] = 9,["121"] = 10,["122"] = 11,["123"] = 14,["124"] = 15,["127"] = 19,["128"] = 20,["129"] = 23,["130"] = 24,["131"] = 27,["132"] = 27,["133"] = 27,["134"] = 27,["135"] = 27,["136"] = 34,["137"] = 35,["138"] = 36,["139"] = 37,["140"] = 40,["141"] = 40,["143"] = 41,["144"] = 41,["146"] = 42,["147"] = 42,["149"] = 43,["150"] = 43,["152"] = 44,["153"] = 44,["155"] = 45,["156"] = 45,["158"] = 46,["159"] = 46,["161"] = 47,["162"] = 47,["164"] = 48,["165"] = 50,["167"] = 54,["168"] = 55,["169"] = 60,["171"] = 64,["172"] = 65,["173"] = 66,["175"] = 70,["176"] = 71,["177"] = 72,["179"] = 76,["180"] = 77,["181"] = 79,["182"] = 79,["183"] = 79,["184"] = 79,["185"] = 80,["187"] = 84,["188"] = 89,["189"] = 90,["190"] = 91,["192"] = 95,["193"] = 96,["194"] = 97,["195"] = 97,["196"] = 97,["197"] = 97,["198"] = 97,["199"] = 102,["201"] = 106,["202"] = 107,["203"] = 108,["204"] = 109,["206"] = 113,["207"] = 114,["209"] = 118,["210"] = 119,["212"] = 6});
function onStart()
    console:log("Airplane Flight Controller initialized")
    console:log("Controls: W/S - Throttle, A/D - Yaw, Q/E - Roll, R/F - Pitch, Space - Level Flight")
end
function onUpdate(deltaTime)
    local thrust = parameters.thrust or 50
    local turnSpeed = parameters.turnSpeed or 45
    local liftForce = parameters.liftForce or 15
    local dragCoeff = parameters.dragCoeff or 0.5
    if not entity.rigidBody then
        console:error("Airplane requires RigidBody component for flight physics")
        return
    end
    local rigidBody = entity.rigidBody
    local transform = entity.transform
    local velocity = rigidBody.getLinearVelocity()
    local rotation = transform.getRotation()
    local forward = {
        x = math.sin(rotation.y * math.pi / 180),
        y = 0,
        z = math.cos(rotation.y * math.pi / 180)
    }
    local throttleInput = 0
    local yawInput = 0
    local rollInput = 0
    local pitchInput = 0
    if input:isKeyDown("KeyW") then
        throttleInput = 1
    end
    if input:isKeyDown("KeyS") then
        throttleInput = -1
    end
    if input:isKeyDown("KeyA") then
        yawInput = -1
    end
    if input:isKeyDown("KeyD") then
        yawInput = 1
    end
    if input:isKeyDown("KeyQ") then
        rollInput = -1
    end
    if input:isKeyDown("KeyE") then
        rollInput = 1
    end
    if input:isKeyDown("KeyR") then
        pitchInput = 1
    end
    if input:isKeyDown("KeyF") then
        pitchInput = -1
    end
    if input:isKeyDown("Space") then
        transform:setRotation({x = 0, y = rotation.y, z = 0})
    end
    if throttleInput ~= 0 then
        local thrustForce = {x = forward.x * thrust * throttleInput, y = 0, z = forward.z * thrust * throttleInput}
        rigidBody.addForce(thrustForce)
    end
    if yawInput ~= 0 then
        local newYaw = rotation.y + yawInput * turnSpeed * deltaTime
        transform:setRotation({x = rotation.x, y = newYaw, z = rotation.z})
    end
    if rollInput ~= 0 then
        local newRoll = rotation.z + rollInput * turnSpeed * deltaTime
        transform:setRotation({x = rotation.x, y = rotation.y, z = newRoll})
    end
    if pitchInput ~= 0 then
        local newPitch = rotation.x + pitchInput * turnSpeed * 0.5 * deltaTime
        local clampedPitch = math.max(
            -45,
            math.min(45, newPitch)
        )
        transform:setRotation({x = clampedPitch, y = rotation.y, z = rotation.z})
    end
    local speed = math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z)
    if speed > 1 then
        local liftMagnitude = liftForce * speed * 0.1
        rigidBody.addForce({x = 0, y = liftMagnitude, z = 0})
    end
    if speed > 0.1 then
        local dragMagnitude = dragCoeff * speed
        local dragForce = {
            x = __TS__Number(-velocity.x) * dragMagnitude,
            y = __TS__Number(-velocity.y) * dragMagnitude,
            z = __TS__Number(-velocity.z) * dragMagnitude
        }
        rigidBody.addForce(dragForce)
    end
    if rollInput == 0 and math.abs(rotation.z) > 0.1 then
        local levelingSpeed = deltaTime * 30
        local newRoll = rotation.z * (1 - levelingSpeed)
        transform:setRotation({x = rotation.x, y = rotation.y, z = newRoll})
    end
    if velocity.y < -20 then
        rigidBody.addForce({x = 0, y = 30, z = 0})
    end
    if time.frameCount % 60 == 0 then
        console:log((("Airplane Speed: " .. __TS__NumberToFixed(speed, 1)) .. ", Altitude: ") .. tostring(transform.position.y.toFixed(1)))
    end
end
