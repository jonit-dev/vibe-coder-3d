# Task Completion Guidelines

## When Task is Completed

1. **Code Quality Checks** (if applicable)

   - Run `yarn lint` to check for linting issues
   - Run `yarn format` to ensure consistent formatting
   - Verify TypeScript compilation with `yarn build`

2. **Testing** (if applicable)

   - Run `yarn test:run` for unit tests
   - Check that new components integrate properly

3. **File Organization**

   - Ensure all new files follow project conventions
   - Use TypeScript path aliases (@/, @core/, @editor/)
   - Verify proper exports (named exports only)

4. **Integration Verification**

   - For ECS components: Ensure registration in ComponentDefinitions.ts
   - For UI components: Check proper integration with existing systems
   - Test component in the actual application context

5. **Documentation Updates** (only if explicitly requested)
   - Update relevant documentation files if requested by user
   - Do NOT proactively create documentation

## Pre-Commit Checklist

- No TypeScript errors
- ESLint passes without errors
- Prettier formatting applied
- All imports use TypeScript path aliases
- Named exports used exclusively
- Interface names prefixed with 'I'

## User Communication

- Always ask user to run `yarn dev` instead of running it yourself
- Report any issues found during validation
- Provide file paths as absolute paths in responses
