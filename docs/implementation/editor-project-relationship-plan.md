# Editor-Project Relationship Architecture Plan

**Vibe Coder 3D: Unified Development Workspace Design**

## Overview

### Context & Goals

- **Unified Development Experience**: Create a seamless relationship between the editor and game projects where the editor serves as both a standalone development environment and a project-aware workspace, similar to Unity's model but adapted for web-based development.
- **AI-First Project Management**: Enable the AI Copilot to understand project structure, assets, and configurations to provide contextual assistance across project boundaries.
- **Hot-Reload Development**: Support real-time synchronization between editor changes and running game instances, enabling immediate feedback during development.
- **Multi-Project Workflow**: Allow developers to work on multiple projects while maintaining isolated asset pipelines, configurations, and build outputs.
- **User Ownership**: Ensure complete user ownership of game runtime and projects, with no dependencies on closed-source components in the final build.

### Current Pain Points

- **Monolithic Architecture**: Current implementation treats editor and game as separate routes without project abstraction, limiting scalability and reusability.
- **No Project Context**: AI Copilot lacks understanding of project boundaries, making it difficult to provide contextual assistance for project-specific assets and configurations.
- **Asset Management Isolation**: Assets and scenes are managed globally rather than per-project, creating confusion when working on multiple games.
- **Build Pipeline Complexity**: No clear separation between editor tooling and game runtime, making deployment and distribution challenging.

## Proposed Solution

### High-level Summary

- **Clean Separation**: Closed-source editor with AI tooling, user-owned runtime and projects with full ownership and no telemetry.
- **Project-Centric Architecture**: Implement a project workspace system where the editor can create, open, and manage discrete game projects with isolated assets, scenes, and configurations.
- **Workspace Management**: Create a project management system that handles project creation, templates, imports/exports, and versioning.
- **Editor-Runtime Bridge**: Establish a communication layer between the editor and running game instances for real-time synchronization and testing.
- **AI Project Intelligence**: Enable the AI Copilot to understand project structure and provide contextual assistance based on project type, assets, and development patterns.
- **Scalable Asset Pipeline**: Implement per-project asset management with shared core libraries and project-specific customizations.

### Architecture & Directory Structure

```
# CLOSED SOURCE - Proprietary Editor
vibe-coder-3d-editor/                    # Editor Distribution (Closed Source)
├── src/
│   ├── editor/                          # Editor Application (Proprietary)
│   │   ├── app/                         # Editor shell application
│   │   ├── components/                  # Editor UI components
│   │   ├── ai/                          # AI Copilot integration (Proprietary)
│   │   ├── workspace/                   # Workspace-specific editor features
│   │   │   ├── ProjectExplorer.tsx      # Project file browser
│   │   │   ├── ProjectSettings.tsx      # Project configuration UI
│   │   │   └── TemplateSelector.tsx     # Project creation wizard
│   │   ├── build-tools/                 # Proprietary build and optimization tools
│   │   ├── asset-pipeline/              # Advanced asset processing (Proprietary)
│   │   └── analytics/                   # Usage analytics and telemetry
│   ├── core/                            # Editor Core (Proprietary)
│   │   ├── workspace/                   # Project management systems
│   │   │   ├── ProjectManager.ts        # Project lifecycle management
│   │   │   ├── WorkspaceStore.ts        # Current workspace state
│   │   │   ├── ProjectTemplate.ts       # Project scaffolding system
│   │   │   └── AssetPipeline.ts         # Project-aware asset management
│   │   ├── ai-services/                 # AI integration services
│   │   └── licensing/                   # License validation and management
│   └── templates/                       # Project templates (Editor-managed)
│       ├── blank/                       # Empty project template
│       ├── platformer/                  # 2.5D platformer template
│       ├── fps/                         # First-person game template
│       └── puzzle/                      # Puzzle game template

# USER OWNED - Game Runtime (Delivered with each project)
my-game-project/node_modules/@vibe-coder/runtime/  # User-Owned Runtime (No telemetry, full ownership)
├── src/
│   ├── core/                            # Core Game Engine (User Owned)
│   │   ├── engine/                      # Core R3F, ECS, Physics systems
│   │   ├── components/                  # Reusable game components
│   │   ├── systems/                     # ECS systems
│   │   ├── physics/                     # Physics integration
│   │   ├── audio/                       # Audio systems
│   │   └── networking/                  # Multiplayer support
│   ├── utils/                           # Utility functions
│   ├── types/                           # TypeScript definitions
│   └── exports/                         # Public API exports
├── package.json                         # Standard npm package
├── LICENSE                              # Permissive license (MIT) - Full user ownership
└── README.md                            # Runtime documentation

# USER OWNED - Game Projects
projects/                                # User Projects Directory (User Owned)
├── my-game-project/                     # Individual Game Project
│   ├── .vibe/                          # Project metadata (Editor-managed, optional)
│   │   ├── editor-config.json          # Editor-specific configuration
│   │   ├── build-cache/               # Cached build artifacts (Editor optimization)
│   │   └── ai-context.json            # AI learning data (Editor-specific)
│   ├── src/                            # Game Source Code (User Owned)
│   │   ├── components/                 # Custom game components
│   │   ├── systems/                    # Custom ECS systems
│   │   ├── scenes/                     # Scene definitions
│   │   ├── utils/                      # Game-specific utilities
│   │   └── main.ts                     # Game entry point
│   ├── assets/                         # Game Assets (User Owned)
│   │   ├── models/                     # 3D models, animations (GLTF/GLB)
│   │   ├── textures/                   # Textures, materials (PNG/JPG/WebP)
│   │   ├── audio/                      # Sounds, music (OGG/MP3/WAV)
│   │   └── data/                       # Game data files (JSON)
│   ├── scenes/                         # Scene Files (Standard Format)
│   │   ├── main-menu.scene.json       # Individual scene files
│   │   ├── level-01.scene.json
│   │   └── level-02.scene.json
│   ├── public/                         # Public assets for deployment
│   ├── dist/                           # Build output (Standard web bundle)
│   ├── node_modules/                   # Standard npm dependencies (including runtime)
│   ├── package.json                    # Standard npm dependencies
│   ├── vite.config.js                  # Standard Vite configuration
│   ├── game.config.json               # Game configuration (User Owned)
│   ├── LICENSE                         # User's chosen license
│   └── README.md                       # Project documentation
```

## Key Ownership Principles

### Editor (Closed Source)

- **AI Copilot**: Advanced AI features, natural language processing, contextual assistance
- **Asset Pipeline**: Advanced optimization, format conversion, batch processing
- **Build Tools**: Proprietary optimization, bundling, and deployment tools
- **Analytics**: Editor usage analytics (not game analytics)
- **Project Management**: Workspace and project creation tools

### Runtime (User Owned)

- **Full Ownership**: Users own the runtime completely, can modify, redistribute
- **No Telemetry**: Zero data collection or communication back to editor
- **Standard Dependencies**: Only depends on public npm packages (React Three Fiber, etc.)
- **Open Source License**: MIT license for complete freedom
- **Self-Contained**: Can be used without the editor for manual development

### Projects (User Owned)

- **Complete Ownership**: Users own all code, assets, and builds
- **Standard Structure**: Uses standard web development patterns (Vite, npm, etc.)
- **Editor Agnostic**: Can be built and deployed without the editor
- **No Lock-in**: Projects can be migrated to other tools if desired
- **User License**: Users choose their own license for their games

## Implementation Plan

### Phase 1: Project Foundation & User Ownership (2 weeks)

#### Week 1: Core Project System & Runtime Separation

1. **Runtime Package Architecture**

   ```typescript
   // User-owned runtime with zero editor dependencies
   interface IVibeRuntime {
     engine: GameEngine;
     components: ComponentLibrary;
     systems: SystemLibrary;
     physics: PhysicsEngine;
     audio: AudioEngine;
   }

   // Clean API with no telemetry or editor communication
   export const createGame = (config: GameConfig) => {
     return new VibeGame(config);
   };
   ```

2. **Project Configuration Schema**
   ```typescript
   // User-owned project configuration
   interface IProjectConfig {
     name: string;
     version: string;
     runtime: {
       version: string; // @vibe-coder/runtime version
       features: string[]; // Enabled runtime features
     };
     build: {
       target: 'web' | 'desktop' | 'mobile';
       optimization: 'development' | 'production';
     };
     // NO editor-specific data in user-owned config
   }
   ```

#### Week 2: Editor Integration with Clean Boundaries

3. **Editor-Project Bridge**

   - Editor communicates with projects through standard development server
   - Hot-reload through standard Vite HMR (no proprietary protocols)
   - AI context stored separately in `.vibe/` (optional, editor-only)
   - Project can run completely independently of editor

4. **Template System with User Ownership**
   - Templates generate standard npm projects
   - All generated code is user-owned
   - No proprietary dependencies in generated projects
   - Standard package.json with @vibe-coder/runtime dependency

### Phase 2: Editor-Runtime Communication Bridge (2 weeks)

#### Week 1: Standard Development Protocols

1. **Development Server Integration**

   ```typescript
   // Editor uses standard development server protocols
   interface IEditorDevBridge {
     connectToProject(projectPath: string): Promise<DevConnection>;
     watchFileChanges(callback: (changes: FileChange[]) => void): void;
     sendHotReload(changes: Change[]): Promise<void>;
     // Uses standard Vite dev server underneath
   }
   ```

2. **Hot-Reload Through Standard Channels**
   - Leverage Vite's HMR for runtime updates
   - Editor sends changes through standard dev server
   - No proprietary communication protocols
   - Works with any standard development workflow

#### Week 2: Build and Deployment Independence

3. **Standard Build Pipeline**

   - Projects use standard Vite build process
   - Editor can enhance but not replace standard tooling
   - Generated builds work completely independently
   - No editor runtime dependencies in production

4. **Deployment Independence**
   - Standard web deployment (static hosting, CDN, etc.)
   - No proprietary deployment services required
   - Users control hosting and distribution
   - Standard web technologies (HTML, JS, CSS)

### Phase 3: AI-Aware Project Intelligence (3 weeks)

#### Week 1: AI Context with Privacy

1. **Local AI Context Storage**

   ```typescript
   // AI context stored locally in .vibe/ (optional)
   interface IAIProjectContext {
     projectType: string;
     codePatterns: LocalCodePattern[]; // Analyzed locally
     preferences: UserPreferences; // Local only
     // NO data sent to external services without explicit consent
   }
   ```

2. **Privacy-First AI Integration**
   - AI context stored locally in `.vibe/` directory
   - Users can delete AI data without affecting project
   - No AI data included in final builds
   - Explicit consent for any external AI services

#### Week 2: Intelligent Project Operations

3. **Smart Project Management**

   - AI assists with project setup and organization
   - Template recommendations based on requirements
   - Code analysis and suggestions (local processing where possible)
   - Asset optimization recommendations

4. **Contextual Development Assistance**
   - Project-aware code completion
   - Component and system suggestions
   - Performance optimization insights
   - Standard tooling integration

#### Week 3: Advanced AI Features with User Control

5. **Optional AI Services**

   - External AI services only with explicit user consent
   - Clear data usage policies
   - Local-first processing where possible
   - User controls all AI data and preferences

6. **AI-Generated Content Ownership**
   - All AI-generated code belongs to user
   - No licensing restrictions on AI-assisted content
   - Clear ownership of all assets and code
   - Standard copyright and licensing applies

## File and Directory Structures

### User-Owned Runtime Structure

```
@vibe-coder/runtime/
├── src/
│   ├── core/
│   │   ├── engine/                     # Core game engine
│   │   ├── components/                 # Reusable components
│   │   ├── systems/                    # ECS systems
│   │   ├── physics/                    # Physics integration
│   │   ├── audio/                      # Audio systems
│   │   └── networking/                 # Multiplayer support
│   ├── utils/                          # Utility functions
│   ├── types/                          # TypeScript definitions
│   └── index.ts                        # Public API exports
├── package.json                        # Standard npm package
├── LICENSE                             # MIT License (User ownership)
├── README.md                           # Runtime documentation
└── CHANGELOG.md                        # Version history
```

### User Project Template

```
my-game/
├── src/
│   ├── components/                     # Custom game components
│   ├── systems/                        # Custom ECS systems
│   ├── scenes/                         # Scene definitions
│   ├── utils/                          # Game utilities
│   └── main.ts                         # Game entry point
├── assets/                             # Game assets (user-owned)
├── scenes/                             # Scene files (standard format)
├── public/                             # Static assets
├── dist/                               # Build output
├── .vibe/                              # Editor metadata (optional)
├── package.json                        # Standard npm project
├── vite.config.js                      # Standard Vite config
├── game.config.json                    # Game configuration
├── LICENSE                             # User's license choice
└── README.md                           # Project documentation
```

### Editor Workspace (Closed Source)

```
vibe-editor/workspace/
├── components/
│   ├── ProjectExplorer.tsx             # File browser
│   ├── ProjectSettings.tsx             # Configuration UI
│   ├── TemplateSelector.tsx            # Project wizard
│   └── AIAssistant.tsx                 # AI integration
├── services/
│   ├── ProjectService.ts               # Project management
│   ├── AIService.ts                    # AI integration
│   ├── BuildService.ts                 # Build tools
│   └── AssetService.ts                 # Asset processing
└── templates/                          # Project templates
    ├── blank/                          # Basic template
    ├── platformer/                     # Game templates
    └── custom/                         # User templates
```

## Technical Details

### Runtime API Design

```typescript
// Clean, user-owned runtime API
import { createGame, Scene, Entity, Component } from '@vibe-coder/runtime';

// User's game code (completely owned)
const game = createGame({
  name: 'My Game',
  version: '1.0.0',
  target: 'web',
});

// Standard ECS patterns
const playerEntity = game.world
  .createEntity()
  .add(Transform, { position: [0, 0, 0] })
  .add(Mesh, { geometry: 'box' })
  .add(PlayerController);

// No editor dependencies in runtime code
```

### Project Independence

```typescript
// Projects work without editor
import { defineConfig } from 'vite';

export default defineConfig({
  // Standard Vite configuration
  plugins: [
    // Standard plugins only
  ],
  build: {
    // Standard build configuration
    target: 'esnext',
    rollupOptions: {
      // Standard Rollup options
    },
  },
});
```

### Editor Integration

```typescript
// Editor enhances but doesn't control projects
interface IEditorProjectBridge {
  // Read-only project analysis
  analyzeProject(path: string): Promise<ProjectAnalysis>;

  // Enhancement suggestions (user accepts/rejects)
  suggestOptimizations(): Promise<Suggestion[]>;

  // AI assistance (optional, user-controlled)
  getAIAssistance(context: string): Promise<AIResponse>;

  // Standard development server integration
  startDevServer(): Promise<DevServer>;
}
```

## Usage Examples

### Creating a User-Owned Project

```typescript
// Editor creates standard npm project
const project = await editor.createProject({
  name: 'my-platformer',
  template: 'platformer',
  location: './projects/'
});

// Generated project is completely user-owned
// package.json includes:
{
  "name": "my-platformer",
  "version": "1.0.0",
  "dependencies": {
    "@vibe-coder/runtime": "^1.0.0",
    "vite": "^4.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Independent Development

```typescript
// Users can develop without editor
npm install
npm run dev        # Standard Vite dev server
npm run build      # Standard build process
npm run preview    # Standard preview

// Deploy anywhere
npm run build && rsync -r dist/ user@server:/var/www/
```

### AI Assistance with User Control

```typescript
// AI suggestions are optional
const aiSuggestion = await editor.ai.suggest({
  context: 'player movement',
  codeContext: playerController,
  userPreferences: { framework: 'functional' },
});

if (user.accepts(aiSuggestion)) {
  // Generated code belongs to user
  editor.insertCode(aiSuggestion.code);
}
```

## Ownership and Licensing

### Runtime Ownership

- **License**: MIT License for complete user freedom
- **Modification**: Users can fork and modify the runtime
- **Distribution**: Users can redistribute runtime with their games
- **No Telemetry**: Zero data collection or external communication
- **Self-Contained**: No dependencies on proprietary services

### Project Ownership

- **Full Ownership**: Users own all code, assets, and generated content
- **License Choice**: Users choose their own license for their projects
- **No Lock-in**: Projects use standard tools and can be migrated
- **Commercial Use**: No restrictions on commercial game development
- **Source Control**: Standard git repositories, user-controlled

### Editor Boundaries

- **Development Only**: Editor is used only during development
- **No Runtime Dependencies**: Games don't require editor to run
- **Optional Enhancement**: Editor features are enhancements, not requirements
- **Standard Protocols**: Uses standard development server protocols
- **Privacy Respect**: AI features respect user privacy and data ownership

## Testing Strategy

### Runtime Testing

- **Unit Tests**: Comprehensive runtime testing independent of editor
- **Integration Tests**: Game builds work without editor
- **Performance Tests**: Runtime performance benchmarks
- **Compatibility Tests**: Standard browser and platform compatibility

### Project Independence Testing

- **Build Without Editor**: Projects build using standard npm/yarn commands
- **Deploy Without Editor**: Built games deploy to standard hosting
- **Migration Tests**: Projects can be migrated to other development environments
- **License Compliance**: Verify user ownership of all generated content

### Editor Integration Testing

- **Development Workflow**: Editor enhances standard development
- **Hot Reload**: Standard HMR integration
- **AI Features**: AI assistance respects user privacy and control
- **Template Generation**: Generated projects are properly user-owned

## Risks & Mitigations

| Risk                       | Mitigation                                                           |
| -------------------------- | -------------------------------------------------------------------- |
| Runtime vendor lock-in     | MIT license and standard dependencies ensure user freedom            |
| Editor dependency creep    | Strict boundaries between editor and runtime/projects                |
| AI data privacy concerns   | Local-first AI processing and explicit consent for external services |
| Project portability issues | Standard tools and file formats for complete portability             |
| License confusion          | Clear documentation of ownership and licensing                       |
| Performance overhead       | Lightweight runtime with minimal dependencies                        |

## Timeline

**Total Estimated Time: 7 weeks**

### Phase 1: Foundation & Ownership (2 weeks)

- Week 1: Runtime separation and user ownership architecture
- Week 2: Project independence and template system

### Phase 2: Development Integration (2 weeks)

- Week 3: Standard development server integration
- Week 4: Build and deployment independence

### Phase 3: AI Integration with Privacy (3 weeks)

- Week 5: Local AI context and privacy-first design
- Week 6: AI assistance with user control
- Week 7: Advanced AI features and ownership clarity

## Acceptance Criteria

- ✅ **Runtime Independence**: Runtime works completely without editor
- ✅ **Project Ownership**: Users own all code, assets, and builds completely
- ✅ **No Lock-in**: Projects can be developed and deployed without editor
- ✅ **Standard Tools**: Uses standard web development tools and practices
- ✅ **Privacy Protection**: AI features respect user privacy and data ownership
- ✅ **License Clarity**: Clear ownership and licensing of all components
- ✅ **Performance**: Lightweight runtime with minimal overhead
- ✅ **Portability**: Projects work with standard development workflows

## Conclusion

This architecture ensures that while the editor provides powerful AI-assisted development capabilities, users maintain complete ownership and control over their games and the runtime. The clear separation between proprietary editor tooling and user-owned runtime/projects creates a sustainable business model while respecting user freedom and preventing vendor lock-in.

The design prioritizes user ownership, privacy, and independence while still enabling the advanced AI features that make Vibe Coder 3D unique. Users benefit from powerful development tools while maintaining complete control over their creative work and technical infrastructure.

## Assumptions & Dependencies

- **User Ownership Priority**: Architecture prioritizes user ownership over editor integration convenience
- **Standard Web Technologies**: Relies on standard web development tools and practices
- **Privacy-First AI**: AI features designed with privacy and user control as primary concerns
- **MIT Runtime License**: Runtime uses permissive licensing for maximum user freedom
- **Editor Business Model**: Closed-source editor business model supports open runtime development
- **Browser Standards**: Leverages standard browser APIs and web development practices

```

```
