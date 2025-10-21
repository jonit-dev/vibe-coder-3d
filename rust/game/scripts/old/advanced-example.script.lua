--[[ Generated with https://github.com/TypeScriptToLua/TypeScriptToLua ]]
-- Lua Library inline imports
local function __TS__New(target, ...)
    local instance = setmetatable({}, target.prototype)
    instance:____constructor(...)
    return instance
end

local __TS__Symbol, Symbol
do
    local symbolMetatable = {__tostring = function(self)
        return ("Symbol(" .. (self.description or "")) .. ")"
    end}
    function __TS__Symbol(description)
        return setmetatable({description = description}, symbolMetatable)
    end
    Symbol = {
        asyncDispose = __TS__Symbol("Symbol.asyncDispose"),
        dispose = __TS__Symbol("Symbol.dispose"),
        iterator = __TS__Symbol("Symbol.iterator"),
        hasInstance = __TS__Symbol("Symbol.hasInstance"),
        species = __TS__Symbol("Symbol.species"),
        toStringTag = __TS__Symbol("Symbol.toStringTag")
    }
end

local function __TS__InstanceOf(obj, classTbl)
    if type(classTbl) ~= "table" then
        error("Right-hand side of 'instanceof' is not an object", 0)
    end
    if classTbl[Symbol.hasInstance] ~= nil then
        return not not classTbl[Symbol.hasInstance](classTbl, obj)
    end
    if type(obj) == "table" then
        local luaClass = obj.constructor
        while luaClass ~= nil do
            if luaClass == classTbl then
                return true
            end
            luaClass = luaClass.____super
        end
    end
    return false
end

local function __TS__Class(self)
    local c = {prototype = {}}
    c.prototype.__index = c.prototype
    c.prototype.constructor = c
    return c
end

local __TS__Promise
do
    local function makeDeferredPromiseFactory()
        local resolve
        local reject
        local function executor(____, res, rej)
            resolve = res
            reject = rej
        end
        return function()
            local promise = __TS__New(__TS__Promise, executor)
            return promise, resolve, reject
        end
    end
    local makeDeferredPromise = makeDeferredPromiseFactory()
    local function isPromiseLike(value)
        return __TS__InstanceOf(value, __TS__Promise)
    end
    local function doNothing(self)
    end
    local ____pcall = _G.pcall
    __TS__Promise = __TS__Class()
    __TS__Promise.name = "__TS__Promise"
    function __TS__Promise.prototype.____constructor(self, executor)
        self.state = 0
        self.fulfilledCallbacks = {}
        self.rejectedCallbacks = {}
        self.finallyCallbacks = {}
        local success, ____error = ____pcall(
            executor,
            nil,
            function(____, v) return self:resolve(v) end,
            function(____, err) return self:reject(err) end
        )
        if not success then
            self:reject(____error)
        end
    end
    function __TS__Promise.resolve(value)
        if __TS__InstanceOf(value, __TS__Promise) then
            return value
        end
        local promise = __TS__New(__TS__Promise, doNothing)
        promise.state = 1
        promise.value = value
        return promise
    end
    function __TS__Promise.reject(reason)
        local promise = __TS__New(__TS__Promise, doNothing)
        promise.state = 2
        promise.rejectionReason = reason
        return promise
    end
    __TS__Promise.prototype["then"] = function(self, onFulfilled, onRejected)
        local promise, resolve, reject = makeDeferredPromise()
        self:addCallbacks(
            onFulfilled and self:createPromiseResolvingCallback(onFulfilled, resolve, reject) or resolve,
            onRejected and self:createPromiseResolvingCallback(onRejected, resolve, reject) or reject
        )
        return promise
    end
    function __TS__Promise.prototype.addCallbacks(self, fulfilledCallback, rejectedCallback)
        if self.state == 1 then
            return fulfilledCallback(nil, self.value)
        end
        if self.state == 2 then
            return rejectedCallback(nil, self.rejectionReason)
        end
        local ____self_fulfilledCallbacks_0 = self.fulfilledCallbacks
        ____self_fulfilledCallbacks_0[#____self_fulfilledCallbacks_0 + 1] = fulfilledCallback
        local ____self_rejectedCallbacks_1 = self.rejectedCallbacks
        ____self_rejectedCallbacks_1[#____self_rejectedCallbacks_1 + 1] = rejectedCallback
    end
    function __TS__Promise.prototype.catch(self, onRejected)
        return self["then"](self, nil, onRejected)
    end
    function __TS__Promise.prototype.finally(self, onFinally)
        if onFinally then
            local ____self_finallyCallbacks_2 = self.finallyCallbacks
            ____self_finallyCallbacks_2[#____self_finallyCallbacks_2 + 1] = onFinally
            if self.state ~= 0 then
                onFinally(nil)
            end
        end
        return self
    end
    function __TS__Promise.prototype.resolve(self, value)
        if isPromiseLike(value) then
            return value:addCallbacks(
                function(____, v) return self:resolve(v) end,
                function(____, err) return self:reject(err) end
            )
        end
        if self.state == 0 then
            self.state = 1
            self.value = value
            return self:invokeCallbacks(self.fulfilledCallbacks, value)
        end
    end
    function __TS__Promise.prototype.reject(self, reason)
        if self.state == 0 then
            self.state = 2
            self.rejectionReason = reason
            return self:invokeCallbacks(self.rejectedCallbacks, reason)
        end
    end
    function __TS__Promise.prototype.invokeCallbacks(self, callbacks, value)
        local callbacksLength = #callbacks
        local finallyCallbacks = self.finallyCallbacks
        local finallyCallbacksLength = #finallyCallbacks
        if callbacksLength ~= 0 then
            for i = 1, callbacksLength - 1 do
                callbacks[i](callbacks, value)
            end
            if finallyCallbacksLength == 0 then
                return callbacks[callbacksLength](callbacks, value)
            end
            callbacks[callbacksLength](callbacks, value)
        end
        if finallyCallbacksLength ~= 0 then
            for i = 1, finallyCallbacksLength - 1 do
                finallyCallbacks[i](finallyCallbacks)
            end
            return finallyCallbacks[finallyCallbacksLength](finallyCallbacks)
        end
    end
    function __TS__Promise.prototype.createPromiseResolvingCallback(self, f, resolve, reject)
        return function(____, value)
            local success, resultOrError = ____pcall(f, nil, value)
            if not success then
                return reject(nil, resultOrError)
            end
            return self:handleCallbackValue(resultOrError, resolve, reject)
        end
    end
    function __TS__Promise.prototype.handleCallbackValue(self, value, resolve, reject)
        if isPromiseLike(value) then
            local nextpromise = value
            if nextpromise.state == 1 then
                return resolve(nil, nextpromise.value)
            elseif nextpromise.state == 2 then
                return reject(nil, nextpromise.rejectionReason)
            else
                return nextpromise:addCallbacks(resolve, reject)
            end
        else
            return resolve(nil, value)
        end
    end
end

local __TS__AsyncAwaiter, __TS__Await
do
    local ____coroutine = _G.coroutine or ({})
    local cocreate = ____coroutine.create
    local coresume = ____coroutine.resume
    local costatus = ____coroutine.status
    local coyield = ____coroutine.yield
    function __TS__AsyncAwaiter(generator)
        return __TS__New(
            __TS__Promise,
            function(____, resolve, reject)
                local fulfilled, step, resolved, asyncCoroutine
                function fulfilled(self, value)
                    local success, resultOrError = coresume(asyncCoroutine, value)
                    if success then
                        return step(resultOrError)
                    end
                    return reject(nil, resultOrError)
                end
                function step(result)
                    if resolved then
                        return
                    end
                    if costatus(asyncCoroutine) == "dead" then
                        return resolve(nil, result)
                    end
                    return __TS__Promise.resolve(result):addCallbacks(fulfilled, reject)
                end
                resolved = false
                asyncCoroutine = cocreate(generator)
                local success, resultOrError = coresume(
                    asyncCoroutine,
                    function(____, v)
                        resolved = true
                        return __TS__Promise.resolve(v):addCallbacks(resolve, reject)
                    end
                )
                if success then
                    return step(resultOrError)
                else
                    return reject(nil, resultOrError)
                end
            end
        )
    end
    function __TS__Await(thing)
        return coyield(thing)
    end
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
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["325"] = 61,["326"] = 62,["327"] = 65,["328"] = 66,["330"] = 68,["331"] = 69,["333"] = 71,["334"] = 72,["336"] = 74,["337"] = 75,["339"] = 79,["340"] = 80,["342"] = 84,["343"] = 85,["345"] = 89,["346"] = 90,["347"] = 91,["348"] = 92,["350"] = 61,["352"] = 99,["353"] = 100,["354"] = 101,["355"] = 102,["356"] = 104,["357"] = 106,["358"] = 107,["359"] = 110,["360"] = 111,["361"] = 112,["363"] = 99,["365"] = 119,["366"] = 120,["369"] = 122,["370"] = 123,["371"] = 124,["374"] = 128,["375"] = 129,["376"] = 132,["377"] = 132,["378"] = 132,["379"] = 132,["380"] = 132,["381"] = 132,["382"] = 132,["383"] = 132,["384"] = 142,["385"] = 144,["386"] = 147,["387"] = 148,["389"] = 119,["391"] = 155,["392"] = 157,["393"] = 160,["394"] = 161,["395"] = 162,["397"] = 164,["399"] = 168,["400"] = 169,["401"] = 155,["403"] = 176,["404"] = 177,["405"] = 180,["406"] = 183,["407"] = 189,["408"] = 190,["409"] = 193,["410"] = 194,["411"] = 194,["412"] = 195,["413"] = 194,["414"] = 194,["415"] = 194,["416"] = 199,["417"] = 176,["419"] = 205,["420"] = 206,["421"] = 209,["422"] = 211,["423"] = 212,["424"] = 215,["425"] = 221,["427"] = 223,["429"] = 205,["431"] = 230,["432"] = 232,["433"] = 233,["434"] = 236,["435"] = 240,["436"] = 243,["437"] = 230,["439"] = 252,["441"] = 254,["442"] = 257,["443"] = 258,["444"] = 261,["445"] = 262,["446"] = 264,["448"] = 252,["450"] = 270,["451"] = 271,["452"] = 274,["453"] = 275,["454"] = 276,["455"] = 279,["456"] = 280,["457"] = 283,["458"] = 286,["459"] = 270,["461"] = 292,["462"] = 293,["463"] = 296,["464"] = 299,["465"] = 302,["466"] = 302,["467"] = 303,["468"] = 302,["469"] = 302,["470"] = 302,["471"] = 307,["472"] = 292,["477"] = 9,["478"] = 10,["479"] = 11,["480"] = 12,["481"] = 15,["482"] = 16,["483"] = 17,["485"] = 22,["486"] = 23,["487"] = 26,["488"] = 27,["489"] = 28,["490"] = 31,["491"] = 32,["492"] = 35,["493"] = 38,["494"] = 38,["495"] = 39,["496"] = 38,["497"] = 38,["498"] = 38,["499"] = 22,["501"] = 50,["502"] = 52,["503"] = 53,["504"] = 54,["505"] = 55,["506"] = 50,["508"] = 313,["509"] = 314,["510"] = 314,["511"] = 316,["512"] = 317,["513"] = 320,["514"] = 314,["515"] = 314,["516"] = 314,["517"] = 313,["519"] = 327,["520"] = 328,["521"] = 331,["522"] = 327,["524"] = 342,["525"] = 343,["526"] = 344,["527"] = 342,["529"] = 350,["530"] = 351,["531"] = 352,["532"] = 350});
--- Handle keyboard/mouse input
function handleInput(deltaTime)
    local speed = moveSpeed * deltaTime
    if input:isKeyPressed("w") then
        entity.transform:translate(0, 0, -speed)
    end
    if input:isKeyPressed("s") then
        entity.transform:translate(0, 0, speed)
    end
    if input:isKeyPressed("a") then
        entity.transform:translate(-speed, 0, 0)
    end
    if input:isKeyPressed("d") then
        entity.transform:translate(speed, 0, 0)
    end
    if input:isKeyDown("space") and isGrounded and not jumpCooldown then
        jump()
    end
    if input:isKeyDown("e") then
        interact()
    end
    if input:isMouseButtonDown(0) then
        local mousePos = input:mousePosition()
        console:log("Mouse clicked at:", mousePos)
        spawnAtMouse()
    end
end
--- Check if entity is on the ground using raycasting
function checkGround()
    local pos = entity.transform.position
    local origin = {pos[1], pos[2], pos[3]}
    local direction = {0, -1, 0}
    local hit = query:raycastFirst(origin, direction)
    local wasGrounded = isGrounded
    isGrounded = hit ~= nil and hit.distance < 1.5
    if isGrounded and not wasGrounded then
        events:emit("player:landed", {entityId = entity.id})
        console:log("Landed!")
    end
end
--- Follow target entity if configured
function followTarget(deltaTime)
    if not targetEntityRef then
        return
    end
    local target = entities:fromRef(targetEntityRef)
    if not target then
        console:warn("Target entity not found")
        return
    end
    local myPos = entity.transform.position
    local targetPos = target.transform.position
    local distance = ____math:distance(
        myPos[1],
        myPos[2],
        myPos[3],
        targetPos[1],
        targetPos[2],
        targetPos[3]
    )
    if distance > 3 then
        entity.transform:lookAt(targetPos)
        local followSpeed = 2 * deltaTime
        entity.transform:translate(0, 0, -followSpeed)
    end
end
--- Update visual effects based on state
function updateVisuals(deltaTime)
    entity.transform:rotate(0, deltaTime * 0.2, 0)
    if not isGrounded then
        local scale = 1 + ____math:sin(time.time * 5) * 0.1
        entity.transform:setScale(scale, scale, scale)
    else
        entity.transform:setScale(1, 1, 1)
    end
    local velocity = ____math:abs(____math:sin(time.time))
    local hue = ____math:clamp(velocity * 360, 0, 360)
end
--- Jump action
function jump()
    console:log("Jump!")
    audio:play(jumpSound, {volume = 0.7})
    events:emit("player:jumped", {entityId = entity.id, position = entity.transform.position})
    local currentPos = entity.transform.position
    three.animate:position({currentPos[1], currentPos[2] + 3, currentPos[3]}, 300)
    jumpCooldown = true
    timer:setTimeout(
        function()
            jumpCooldown = false
        end,
        500
    )
    score = score + 10
end
--- Interact with nearby objects
function interact()
    console:log("Interact!")
    local enemies = query:findByTag("enemy")
    if #enemies > 0 then
        console:log("Found enemies:", enemies)
        events:emit("player:interacted", {entityId = entity.id, targets = enemies})
        score = score + 50
    else
        console:log("No enemies nearby")
    end
end
--- Spawn entity at mouse position
function spawnAtMouse()
    local mousePos = input:mousePosition()
    console:log("Spawning at mouse:", mousePos)
    local newEntityId = prefab:spawn("projectile", {position = entity.transform.position})
    console:log("Spawned entity:", newEntityId)
    events:emit("entity:spawned", {entityId = newEntityId, spawnedBy = entity.id})
end
--- Play intro animation sequence
function playIntroAnimation()
    return __TS__AsyncAwaiter(function(____awaiter_resolve)
        __TS__Await(timer:waitFrames(10))
        __TS__Await(three.animate:scale({1.5, 1.5, 1.5}, 300))
        __TS__Await(three.animate:scale({1, 1, 1}, 300))
        local currentRot = entity.transform.rotation
        __TS__Await(three.animate:rotation({currentRot[1], currentRot[2] + ____math.PI * 2, currentRot[3]}, 1000))
        console:log("Intro animation complete!")
    end)
end
--- Handle game reset event
function handleGameReset(data)
    console:log("Game reset received:", data)
    score = 0
    isGrounded = false
    jumpCooldown = false
    entity.transform:setPosition(0, 1, 0)
    entity.transform:setRotation(0, 0, 0)
    three.material:setColor("#4a90e2")
    audio:play("/sounds/reset.wav")
end
--- Handle enemy defeated event
function handleEnemyDefeated(data)
    console:log("Enemy defeated:", data)
    score = score + 100
    three.material:setColor("#00ff00")
    timer:setTimeout(
        function()
            three.material:setColor("#4a90e2")
        end,
        500
    )
    audio:play("/sounds/victory.wav", {volume = 0.8})
end
--- Advanced Script Example
-- Demonstrates all 13 Script APIs
-- 
-- Note: Types from script-api.d.ts are automatically available
moveSpeed = parameters.speed or 5
targetEntityRef = parameters.target
respawnTime = parameters.respawnTime or 3000
jumpSound = parameters.jumpSound or "/sounds/jump.wav"
isGrounded = false
score = 0
jumpCooldown = false
--- Initialize script on start
function onStart()
    console:log("Advanced script started for entity", entity.id)
    three.material:setColor("#4a90e2")
    three.material:setMetalness(0.5)
    three.material:setRoughness(0.3)
    events:on("game:reset", handleGameReset)
    events:on("enemy:defeated", handleEnemyDefeated)
    playIntroAnimation()
    timer:setInterval(
        function()
            console:info("Status:", {position = entity.transform.position, score = score, isGrounded = isGrounded})
        end,
        5000
    )
end
--- Update loop - runs every frame
function onUpdate(deltaTime)
    handleInput(deltaTime)
    checkGround()
    followTarget(deltaTime)
    updateVisuals(deltaTime)
end
--- Respawn entity after delay
function scheduleRespawn()
    timer:setTimeout(
        function()
            entity.transform:setPosition(0, 5, 0)
            three:setVisible(true)
            playIntroAnimation()
        end,
        respawnTime
    )
end
--- Cleanup when entity is destroyed
function onDestroy()
    console:log("Advanced script destroyed for entity", entity.id)
    events:emit("entity:destroyed", {entityId = entity.id, finalScore = score})
end
--- Called when component is enabled
function onEnable()
    console:log("Script enabled")
    three:setVisible(true)
end
--- Called when component is disabled
function onDisable()
    console:log("Script disabled")
    three:setVisible(false)
end
