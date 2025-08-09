# Essential Development Commands

## Package Management

- `yarn` - Install dependencies
- `yarn dev` - Start development server (ask user to run this)
- `yarn build` - Build for production
- `yarn preview` - Preview production build

## Code Quality

- `yarn lint` - Run ESLint linting
- `yarn lint:fix` - Fix ESLint issues automatically
- `yarn format` - Format code with Prettier

## Testing

- `yarn test` - Run tests with Vitest
- `yarn test:ui` - Run tests with UI
- `yarn test:run` - Run tests once
- `yarn test:coverage` - Run tests with coverage report
- `yarn test:watch` - Run tests in watch mode

## Git Hooks

- Pre-commit hooks automatically run linting and formatting via husky + lint-staged
- `yarn prepare` - Set up husky git hooks

## System Commands (Linux)

- Standard Linux commands: `git`, `ls`, `cd`, `grep`, `find`
- Use `tree` command to explore codebase structure
- `rg` (ripgrep) available for faster searching

## Workflow Notes

- **Never run `yarn dev`** - always ask the user to run it
- TypeScript compilation happens during build
- All commits trigger automatic linting/formatting via git hooks
