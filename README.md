# Vibe Coder 3D - AI-First Game Engine

🚀 **The future of game development is conversational.**

Vibe Coder 3D is the first AI-native game engine where you can build 3D games by simply describing what you want. Powered by React Three Fiber and enhanced by sophisticated AI, it transforms natural language into fully functional game experiences.

**"Create a bouncing ball" → Complete physics simulation**  
**"Add a medieval castle" → 3D model sourced and placed**  
**"Make the player jump on spacebar" → Controller script generated**

[📖 Read the Full Vision](./docs/project-overview.md) | [🎯 Implementation Plan](./docs/ai-first-engine-implementation-plan.md) | [🏗️ Architecture](./docs/architecture/)

## Setup

1. Install dependencies:

```
yarn
```

2. Start the development server:

```
yarn dev
```

3. Build for production:

```
yarn build
```

## Development

### Linting & Formatting

This project uses ESLint and Prettier for code quality. Linting and formatting is automatically run on commit using Husky and lint-staged.

- Run linting manually: `yarn lint`
- Fix linting issues: `yarn lint:fix`
- Format code: `yarn format`

### Continuous Integration

GitHub Actions workflows are set up to run on pull requests and pushes to main/master branches:

- TypeScript type checking
- ESLint
- Build verification

## AI-Enhanced Technical Stack

**🤖 AI & Intelligence:**

- Large Language Models (OpenAI GPT-4, Claude) for natural language understanding
- Context-aware code generation and asset management
- Intelligent scene analysis and optimization suggestions

**🎮 Game Engine Core:**

- React Three Fiber (R3F) for modern 3D rendering
- bitecs Entity Component System for scalable game architecture
- Rapier physics engine via WebAssembly
- Zustand for reactive state management

**⚡ Development Tools:**

- TypeScript for type-safe AI code generation
- Vite for lightning-fast development
- TailwindCSS for responsive UI design
- Comprehensive testing and validation pipelines

## 🎯 Current Status

**Phase: Foundation Complete** → **Next: AI Integration**

- ✅ Core engine infrastructure established
- ✅ Editor with scene manipulation capabilities
- ✅ ECS system with physics integration
- 🚧 AI Copilot system development beginning
- ⏳ Natural language command processing

## 📚 Documentation

Explore the comprehensive documentation in the `docs/` directory:

- **[Project Overview](./docs/project-overview.md)** - Vision and goals for the AI-first engine
- **[Implementation Plan](./docs/ai-first-engine-implementation-plan.md)** - Detailed roadmap for AI integration
- **[Architecture](./docs/architecture/)** - Technical specifications and system design
- **[Core Abstractions](./docs/core-abstractions.md)** - Engine framework and patterns
