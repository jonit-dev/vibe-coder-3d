--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
-- Lua Library inline imports
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
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["73"] = 4,["74"] = 5,["76"] = 7,["77"] = 8,["78"] = 9,["79"] = 10,["80"] = 13,["81"] = 14,["82"] = 15,["83"] = 18,["84"] = 19,["85"] = 20,["87"] = 24,["88"] = 24,["89"] = 24,["90"] = 24,["91"] = 25,["92"] = 25,["93"] = 25,["94"] = 25,["95"] = 26,["96"] = 26,["97"] = 26,["98"] = 26,["99"] = 7,["101"] = 29,["102"] = 30,["103"] = 33,["104"] = 34,["105"] = 37,["106"] = 38,["107"] = 40,["108"] = 40,["109"] = 40,["110"] = 40,["111"] = 40,["112"] = 40,["113"] = 40,["114"] = 40,["115"] = 40,["116"] = 40,["117"] = 51,["120"] = 54,["121"] = 55,["124"] = 57,["128"] = 61,["131"] = 63,["132"] = 64,["136"] = 68,["139"] = 70,["140"] = 71,["144"] = 75,["147"] = 77,["151"] = 81,["154"] = 83,["155"] = 84,["156"] = 85,["157"] = 86,["161"] = 90,["164"] = 92,["165"] = 94,["166"] = 95,["167"] = 96,["171"] = 100,["174"] = 102,["178"] = 106,["181"] = 108,["182"] = 109,["183"] = 110,["184"] = 111,["185"] = 112,["191"] = 118,["192"] = 119,["193"] = 120,["194"] = 121,["195"] = 122,["196"] = 123,["197"] = 124,["203"] = 29});
elapsedTime = 0
testPhase = 0
--- Initialize script on start
function onStart()
    console:log("=== Transform API Test Script Starting ===")
    console:log("Entity ID:", entity.id)
    console:log("Entity name:", entity.name)
    console:log("Initial position:", entity.transform.position)
    console:log("Initial rotation:", entity.transform.rotation)
    console:log("Initial scale:", entity.transform.scale)
    if entity.meshRenderer then
        entity.meshRenderer.material:setColor("#00ff00")
        console:log("Set color to green")
    end
    console:log(
        "Forward vector:",
        entity.transform:forward()
    )
    console:log(
        "Right vector:",
        entity.transform:right()
    )
    console:log(
        "Up vector:",
        entity.transform:up()
    )
end
--- Update loop - runs every frame
function onUpdate(deltaTime)
    elapsedTime = elapsedTime + deltaTime
    local phaseDuration = 3
    local currentPhase = math.floor(elapsedTime / phaseDuration)
    if currentPhase ~= testPhase then
        testPhase = currentPhase
        local phaseNames = {
            "Phase 0: Rotate around Y axis",
            "Phase 1: Translate up/down (oscillate)",
            "Phase 2: Scale pulsing",
            "Phase 3: Rotate around X axis",
            "Phase 4: Circular motion (setPosition)",
            "Phase 5: Look at origin while orbiting",
            "Phase 6: Complex rotation (all axes)",
            "Phase 7: Spiral upward"
        }
        console:log(("=== " .. (phaseNames[testPhase + 1] or "Unknown phase")) .. " ===")
    end
    repeat
        local ____switch6 = testPhase
        local ____cond6 = ____switch6 == 0
        if ____cond6 then
            do
                entity.transform:rotate(0, deltaTime * 0.5, 0)
                break
            end
        end
        ____cond6 = ____cond6 or ____switch6 == 1
        if ____cond6 then
            do
                local moveY = math.sin(elapsedTime * 2) * deltaTime
                entity.transform:translate(0, moveY, 0)
                break
            end
        end
        ____cond6 = ____cond6 or ____switch6 == 2
        if ____cond6 then
            do
                local scaleFactor = 1 + math.sin(elapsedTime * 3) * 0.3
                entity.transform:setScale(scaleFactor, scaleFactor, scaleFactor)
                break
            end
        end
        ____cond6 = ____cond6 or ____switch6 == 3
        if ____cond6 then
            do
                entity.transform:rotate(deltaTime * 1, 0, 0)
                break
            end
        end
        ____cond6 = ____cond6 or ____switch6 == 4
        if ____cond6 then
            do
                local radius = 2
                local x = math.cos(elapsedTime) * radius
                local z = math.sin(elapsedTime) * radius
                entity.transform:setPosition(x, 0, z)
                break
            end
        end
        ____cond6 = ____cond6 or ____switch6 == 5
        if ____cond6 then
            do
                entity.transform:lookAt({0, 0, 0})
                local circleX = math.cos(elapsedTime * 0.5) * 3
                local circleZ = math.sin(elapsedTime * 0.5) * 3
                entity.transform:setPosition(circleX, 1, circleZ)
                break
            end
        end
        ____cond6 = ____cond6 or ____switch6 == 6
        if ____cond6 then
            do
                entity.transform:rotate(deltaTime * 0.3, deltaTime * 0.5, deltaTime * 0.2)
                break
            end
        end
        ____cond6 = ____cond6 or ____switch6 == 7
        if ____cond6 then
            do
                local spiralRadius = 2
                local spiralX = math.cos(elapsedTime * 2) * spiralRadius
                local spiralZ = math.sin(elapsedTime * 2) * spiralRadius
                local spiralY = (elapsedTime - testPhase * phaseDuration) * 0.5
                entity.transform:setPosition(spiralX, spiralY, spiralZ)
                break
            end
        end
        do
            do
                if testPhase > 7 then
                    console:log("=== Resetting test cycle ===")
                    entity.transform:setPosition(0, 0, 0)
                    entity.transform:setRotation(0, 0, 0)
                    entity.transform:setScale(1, 1, 1)
                    elapsedTime = 0
                    testPhase = 0
                end
                break
            end
        end
    until true
end
