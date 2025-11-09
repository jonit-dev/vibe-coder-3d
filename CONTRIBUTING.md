# Contributing to Vibe Coder 3D

Thank you for your interest in contributing to Vibe Coder 3D! We welcome contributions from the community and are excited to have you here.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Guidelines](#coding-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

## Quick Links

- **[WORKFLOW.md](WORKFLOW.md)** - Detailed Git Flow branching model and PR process
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** - Community guidelines
- **[SECURITY.md](SECURITY.md)** - Security policy and vulnerability reporting

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/vibe-coder-3d.git
   cd vibe-coder-3d
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/vibe-coder-3d.git
   ```
4. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- **Node.js** >= 20.0.0
- **Yarn** 1.22+
- **Rust** 1.75+ (for native engine development)
- **Git** for version control

### Installation

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Run tests
yarn test

# Type checking
yarn typecheck

# Linting
yarn lint
```

### Environment Configuration

Copy `.env.example` to `.env` and configure as needed:

```bash
cp .env.example .env
```

See `.env.example` for all available configuration options.

## Project Structure

```
vibe-coder-3d/
├── src/
│   ├── core/          # Core engine (ECS, systems, components)
│   ├── editor/        # Editor UI and tools
│   └── game/          # Game-specific code (scenes, scripts, assets)
├── rust/
│   ├── engine/        # Rust native engine
│   └── game/          # Rust game runtime
├── docs/              # Documentation
├── scripts/           # Build and utility scripts
└── tests/             # Test files
```

### Key Directories

- **`src/core/`**: Pure engine logic, no UI dependencies
- **`src/editor/`**: Editor UI components and tools
- **`src/game/`**: Game-specific implementations
- **`rust/engine/`**: Native Rust engine implementation
- **`docs/`**: Comprehensive documentation (50+ files)

## Development Workflow

> **📚 For detailed Git Flow workflow documentation, see [WORKFLOW.md](WORKFLOW.md)**
>
> This section provides a quick overview. For comprehensive guides on feature development, releases, hotfixes, and common scenarios, refer to the WORKFLOW.md document.

### 1. Keep Your Fork Updated

```bash
git fetch upstream
git checkout master
git merge upstream/master
```

### 2. Create a Feature Branch

Use descriptive branch names:

```bash
git checkout -b feature/add-particle-system
git checkout -b fix/physics-collision-bug
git checkout -b docs/update-scripting-guide
```

### 3. Make Your Changes

- Write clean, readable code
- Follow the coding guidelines (see below)
- Add tests for new functionality
- Update documentation as needed

### 4. Test Your Changes

```bash
# Run all tests
yarn test

# Type checking
yarn typecheck

# Linting
yarn lint

# Run all verification
yarn verify

# For Rust changes
yarn rust:test
cd rust/engine && cargo clippy
```

### 5. Commit Your Changes

We use conventional commits for clear history:

```bash
git add .
git commit -m "feat: add particle system component"
```

**Commit Message Format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes
- `ci`: CI/CD changes

**Examples:**

```
feat(physics): add particle collision system
fix(editor): resolve camera rotation bug
docs(scripting): update API reference
refactor(ecs): improve component registration
perf(renderer): optimize mesh batching
```

### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 7. Open a Pull Request

- Go to your fork on GitHub
- Click "New Pull Request"
- Select your feature branch
- Fill out the PR template with:
  - Clear description of changes
  - Related issue numbers
  - Screenshots/GIFs for UI changes
  - Test results

## Coding Guidelines

### TypeScript/JavaScript

- **Import via TS path aliases** (see tsconfig.json):
  ```typescript
  import { Entity } from '@core/lib/ecs/Entity';
  import { EditorPanel } from '@editor/components/Panel';
  ```
- **Use Yarn only** (not npm)
- **Use Tailwind for CSS** (no inline styles)
- **Follow SRP / DRY / KISS principles**
- **Prefix interfaces with `I`**:
  ```typescript
  interface IComponent { ... }
  ```
- **Keep components small** (< 200 lines)
- **Put logic in hooks**, not components
- **Named exports only** (no default exports)
- **Declare components inline**:
  ```typescript
  export const MyComponent: React.FC<IProps> = ({ ... }) => { ... }
  ```
- **Use React.memo for expensive renders**
- **No `any` types** - use proper TypeScript types
- **Use Zod for validation**
- **Use Zustand for state management**

### Logging

Use structured logging via `@core/lib/logger`:

```typescript
import { Logger } from '@core/lib/logger';

const logger = Logger.create('ComponentName');

// Instead of console.log
logger.debug('Debug info', { detail: value });
logger.info('Scene loaded', { entities: count });
logger.warn('Performance warning', { fps: currentFps });
logger.error('Error occurred', { error: err });
```

**Never use `console.log/warn/error` in production code!**

### React Guidelines

- Focus on hook usage
- Prevent unnecessary re-rendering
- Use `useCallback` and `useMemo` appropriately
- Minimize `useEffect` dependencies
- Clean up effects properly

### Rust

- Follow Rust naming conventions
- Use `cargo fmt` for formatting
- Run `cargo clippy` for linting
- Add documentation comments for public APIs
- Use workspace crates for modularity
- Follow the existing architecture patterns

### File Naming

- Components: `ComponentName.tsx`
- Hooks: `useHookName.ts`
- Types: `types.ts` or `ITypeName.ts`
- Tests: `ComponentName.test.ts`
- Utils: `utilityName.ts`

### Code Organization

- One component per file
- Group related files in directories
- Use index files sparingly (no barrel exports)
- Keep file structure flat when possible

## Testing

### Writing Tests

All new features should include tests:

```typescript
import { describe, it, expect } from 'vitest';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    // Test implementation
  });

  it('should handle user interaction', () => {
    // Test implementation
  });
});
```

### Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run specific test file
yarn test:file path/to/test.ts

# Generate coverage report
yarn test:coverage

# Rust tests
yarn rust:test
```

### Test Coverage

- Aim for > 80% coverage for new code
- All public APIs must have tests
- Critical paths require integration tests

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs:
  ```typescript
  /**
   * Creates a new entity with the specified components
   * @param components - Array of component definitions
   * @returns The created entity ID
   */
  export function createEntity(components: IComponent[]): EntityId {
    // Implementation
  }
  ```

### Documentation Files

- Update relevant docs in `docs/` directory
- Follow existing documentation structure
- Use clear, concise language
- Include code examples where helpful

### README Updates

Update README.md if your changes:

- Add new features
- Change installation process
- Modify available scripts
- Update requirements

## Submitting Changes

### Before Submitting

1. **Ensure all tests pass**:

   ```bash
   yarn verify
   ```

2. **Update documentation** as needed

3. **Verify no linting errors**:

   ```bash
   yarn lint:fix
   ```

4. **Test your changes** in both TypeScript editor and Rust engine

5. **Rebase on latest master**:
   ```bash
   git fetch upstream
   git rebase upstream/master
   ```

### Pull Request Guidelines

- Fill out the PR template completely
- Link related issues using keywords (Fixes #123, Closes #456)
- Include screenshots/GIFs for visual changes
- Describe testing performed
- List any breaking changes
- Keep PRs focused - one feature/fix per PR
- Respond to review feedback promptly

### PR Review Process

1. Automated checks must pass (CI, linting, tests)
2. Code review by maintainer(s)
3. Address feedback and make changes
4. Final approval and merge

## Reporting Bugs

### Before Reporting

1. Check existing issues for duplicates
2. Test with latest version
3. Verify it's reproducible

### Bug Report Template

Use the bug report template and include:

- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version, browser)
- Screenshots/logs if applicable
- Minimal reproduction code

### Security Vulnerabilities

**Do not open public issues for security vulnerabilities!**

See [SECURITY.md](SECURITY.md) for responsible disclosure process.

## Requesting Features

### Before Requesting

1. Check existing issues and discussions
2. Consider if it fits project vision
3. Think about implementation approach

### Feature Request Template

Use the feature request template and include:

- Clear description of the feature
- Use case and motivation
- Proposed implementation (if you have ideas)
- Alternative solutions considered
- Willingness to contribute implementation

## Questions?

- Check the [documentation](./docs/)
- Search [GitHub Issues](https://github.com/jonit-dev/vibe-coder-3d/issues)
- Start a [GitHub Discussion](https://github.com/jonit-dev/vibe-coder-3d/discussions)

## Recognition

Contributors are recognized in:

- GitHub contributors page
- Release notes for significant contributions
- Project acknowledgments

Thank you for contributing to Vibe Coder 3D!
