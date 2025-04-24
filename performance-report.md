# Bowling Demo Performance Report

This report outlines potential areas contributing to high CPU usage in the `bowling-demo` scene and suggests areas for investigation and optimization.

## Initial Observations & Fixes

1.  **Incorrect Prop Usage:**
    - `PhysicsWorld` component was incorrectly passed `interpolate` and `maxSubSteps` props.
      - **Fix:** Modified `PhysicsWorld` to accept these props and pass them correctly to the underlying `<Physics>` component from `@react-three/rapier` (using `maxCcdSubsteps` for `maxSubSteps`).
    - `PhysicsBall` component was incorrectly passed a `segments` prop.
      - **Fix:** Removed the `segments` prop from the `<PhysicsBall>` usage in `BowlsDemo.tsx`. The sphere geometry segments are fixed internally within `PhysicsBall`.

## Potential Performance Bottlenecks

While the incorrect props have been fixed, high CPU usage often stems from the physics simulation and rendering complexity. Here are areas to investigate further:

1.  **Physics Simulation (`@react-three/rapier`):**

    - **Number of Rigid Bodies:** Each pin (`BowlingPin`) and the ball (`PhysicsBall`) are dynamic rigid bodies. Frequent collisions and interactions, especially with many pins, can be computationally expensive.
    - **Collision Detection:** Complex geometries or a high number of potential collision pairs increase the cost of collision detection.
    - **Physics Steps:** The frequency and sub-stepping (`maxCcdSubsteps`) of the physics simulation directly impact CPU load. While `maxCcdSubsteps` helps with tunneling, high values increase computation. The current default is `10`. Tuning this might be necessary.
    - **Interpolation:** Render interpolation (`interpolate={true}`) smooths visuals but adds a slight overhead.

2.  **Rendering (`react-three-fiber` / `three.js`):**

    - **Shadows:** Real-time shadows, especially with a high `shadowMapSize` (currently `2048`), are demanding. The directional light casts shadows. Consider if shadows are needed from all sources or if the quality/resolution can be reduced.
    - **Draw Calls:** While seemingly simple, the number of individual objects (pins, ball, lane components, room elements) contributes to draw calls. Investigate if geometries can be merged or instanced (though pins need to be individual for physics).
    - **Component Re-renders:** Frequent state updates in `BowlingGameManager` could trigger re-renders of components down the tree. Analyze the state updates (`score`, `activeBall`, `currentBall`, `pinsKey`) and ensure components only re-render when necessary (e.g., using `React.memo`). The `pinsKey` change likely forces a full re-render of the `BowlingPinSetup`, which might be intensive if it happens often.

3.  **Environment/Scene Complexity:**
    - `BowlingRoom` adds geometry and potentially more lights/objects. Evaluate its complexity.
    - Multiple Point Lights: Three point lights are used in addition to the directional and ambient light. Assess their necessity and performance impact.

## Recommendations & Next Steps

1.  **Profiling:** Use browser developer tools (Performance tab) and React DevTools Profiler to pinpoint exact bottlenecks during gameplay.
2.  **Physics Optimization:**
    - Experiment with `maxCcdSubsteps` in `PhysicsWorld`. Try lower values (e.g., 4, 8) and observe the impact on stability and performance.
    - Consider simplifying pin collider shapes if possible (e.g., using capsule or convex hull colliders if accuracy allows). Check `BowlingPin.tsx`.
    - Ensure pins are put to sleep (`canSleep={true}`) by Rapier when not moving to reduce active body count.
3.  **Rendering Optimization:**
    - Reduce `shadowMapSize` for the directional light (e.g., 1024) and evaluate the visual difference.
    - Disable shadows entirely (`castShadow={false}`) temporarily to gauge their performance cost.
    - Optimize `BowlingGameManager` state updates and component rendering using `React.memo` or other memoization techniques where appropriate (e.g., for `ScoreboardDisplay`, potentially parts of the `BowlingLane` if static).
    - Analyze the frequency of `pinsKey` changes and its impact. Could the reset logic be optimized?
4.  **Benchmarking:** Test performance on target hardware after each significant optimization.
