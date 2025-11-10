### Title Option A (Direct & Informative):

**I'm building Vibe Coder 3D: An open-source, AI-first game engine with a React/TS editor and a Rust core.**

### Title Option B (Feature-focused):

**Showoff: I made an open-source game engine that you control with natural language ("create a bouncing ball" -> physics sim). Built with React, Rust, and R3F.**

### Title Option C (Engaging & Personal):

**After months of work, I'm releasing the foundations of my AI-first, open-source game engine. Looking for feedback and contributors!**

---

### Body:

Hey everyone!

I'm incredibly excited to share a project I've been developing for the past 2 months: **Vibe Coder 3D**. It's an AI-first, open-source game engine designed to make 3D game creation more accessible and intuitive through natural language.

- **Check out the GitHub Repo**: [https://github.com/jonit-dev/vibe-coder-3d](https://github.com/jonit-dev/vibe-coder-3d)
- **Star the project!** It helps a ton with visibility.
- **Read the Contribution Guide**: I've set up a `CONTRIBUTING.md` and `WORKFLOW.md` to make getting started as smooth as possible.
- **Join the Discussion**: [Discord](https://discord.gg/K6fXy5gjEx)

=> CHECK OUT THE [PROJECT README.MD](https://github.com/jonit-dev/vibe-coder-3d/blob/master/README.md) FOR MORE INFO! <=

The core idea is simple: describe what you want, and let the engine handle the rest.

- **"Create a bouncing ball"** → A sphere with a rigid body and physics material is spawned.
- **"Add a medieval castle"** → A 3D model is sourced from an asset library and placed in the scene.
- **"Make the player jump on spacebar"** → A controller script is generated and attached.

### Key Features:

- **Dual Architecture**: A web-based editor built with **React, TypeScript, and React Three Fiber** for a modern, fast, and familiar development experience. The rendering and physics are powered by a high-performance **native Rust engine**.
- **Full Physics Simulation**: Integrated with Rapier3D for robust collision detection, rigid bodies, and joints.
- **Advanced Scripting**: Use TypeScript in the editor with a simple API (`useUpdate`, `useCollisionEvents`, etc.) to build game logic. The Rust engine also has Lua scripting via `mlua`.
- **Modern Tooling**: It comes with a visual scene editor, component inspector, PBR material editor, prefab browser, and multiple debug tools (colliders, FPS counter, GPU profiling).
- **Comprehensive Docs**: The project is heavily documented (50+ guides and architectural docs) to make it easy for new contributors to jump in.
- **It's Open Source!**: Licensed under MIT, ready for the community to shape its future.

### Current Status & What's Next

The foundation is solid. The core engine, editor, ECS, physics, and scripting systems are all in place. I'm now beginning development on the core AI Copilot system that will power the natural language commands. You can see the complete feature list and progress on the project **[Roadmap](./ROADMAP.md)**.

### How You Can Help

I'm at a point where community feedback and contributions would be invaluable. Whether you're a Rustacean, a React dev, a game designer, or just someone passionate about open-source, I'd love for you to get involved.

Thanks for taking the time to read this. I'm really proud of how far it's come and excited about where it's going with the help of a community!
