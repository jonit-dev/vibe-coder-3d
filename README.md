# Vibe Coder 3D

A 3D game engine built with React Three Fiber.

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

## Technical Stack

- React Three Fiber (R3F) for 3D rendering
- React for UI
- TypeScript for type safety
- Vite for fast development and building
- Zustand for state management
- TailwindCSS for styling

Refer to the documentation in the `docs` directory for more information on the architecture and design decisions.
