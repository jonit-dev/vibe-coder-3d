# Development Workflow - Git Flow

This document describes the Git Flow branching model used in Vibe Coder 3D. Following this workflow ensures clean history, stable releases, and efficient collaboration.

## Table of Contents

- [Overview](#overview)
- [Branch Types](#branch-types)
- [Initial Setup](#initial-setup)
- [Feature Development](#feature-development)
- [Creating a Pull Request](#creating-a-pull-request)
- [Release Process](#release-process)
- [Hotfix Process](#hotfix-process)
- [Best Practices](#best-practices)
- [Common Scenarios](#common-scenarios)

## Overview

We use a modified Git Flow model with the following principles:

- **`master`**: Production-ready code, tagged with version numbers
- **`develop`**: Integration branch for features (currently using `master` as the main development branch)
- **Feature branches**: Individual features or bug fixes
- **Release branches**: Preparation for new production releases
- **Hotfix branches**: Critical fixes for production issues

## Branch Types

### Main Branches

#### `master`
- **Purpose**: Production-ready code
- **Protected**: Yes (requires PR approval)
- **Lifetime**: Permanent
- **Naming**: `master`
- **Tags**: Version tags (e.g., `v1.0.0`, `v1.1.0`)

#### `develop` (Future)
- **Purpose**: Integration branch for completed features
- **Protected**: Yes (requires PR approval)
- **Lifetime**: Permanent
- **Naming**: `develop`
- **Status**: Currently using `master` for both development and production

### Supporting Branches

#### Feature Branches
- **Purpose**: New features or enhancements
- **Branch from**: `master` (or `develop` when implemented)
- **Merge into**: `master` (or `develop` when implemented)
- **Naming**: `feature/descriptive-name`
- **Lifetime**: Deleted after merge
- **Examples**:
  - `feature/particle-system`
  - `feature/asset-pipeline`
  - `feature/scripting-api`

#### Bug Fix Branches
- **Purpose**: Non-critical bug fixes
- **Branch from**: `master`
- **Merge into**: `master`
- **Naming**: `fix/descriptive-name`
- **Lifetime**: Deleted after merge
- **Examples**:
  - `fix/physics-collision-bug`
  - `fix/material-loading-error`
  - `fix/camera-rotation-issue`

#### Hotfix Branches
- **Purpose**: Critical production bugs requiring immediate fix
- **Branch from**: `master`
- **Merge into**: `master` (and `develop` if it exists)
- **Naming**: `hotfix/version-description`
- **Lifetime**: Deleted after merge
- **Examples**:
  - `hotfix/1.2.1-crash-on-startup`
  - `hotfix/1.2.1-security-vulnerability`

#### Release Branches
- **Purpose**: Prepare for production release (QA, documentation, version bumps)
- **Branch from**: `master` or `develop`
- **Merge into**: `master` (and back to `develop` if exists)
- **Naming**: `release/version`
- **Lifetime**: Deleted after merge
- **Examples**:
  - `release/1.3.0`
  - `release/2.0.0`

#### Documentation Branches
- **Purpose**: Documentation updates
- **Branch from**: `master`
- **Merge into**: `master`
- **Naming**: `docs/descriptive-name`
- **Lifetime**: Deleted after merge
- **Examples**:
  - `docs/update-scripting-guide`
  - `docs/add-physics-tutorial`

#### Refactoring Branches
- **Purpose**: Code refactoring without changing functionality
- **Branch from**: `master`
- **Merge into**: `master`
- **Naming**: `refactor/descriptive-name`
- **Lifetime**: Deleted after merge
- **Examples**:
  - `refactor/ecs-component-system`
  - `refactor/renderer-architecture`

## Initial Setup

### 1. Fork the Repository

Visit https://github.com/jonit-dev/vibe-coder-3d and click "Fork".

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR-USERNAME/vibe-coder-3d.git
cd vibe-coder-3d
```

### 3. Configure Remotes

```bash
# Add upstream remote
git remote add upstream https://github.com/jonit-dev/vibe-coder-3d.git

# Verify remotes
git remote -v
# origin    https://github.com/YOUR-USERNAME/vibe-coder-3d.git (fetch)
# origin    https://github.com/YOUR-USERNAME/vibe-coder-3d.git (push)
# upstream  https://github.com/jonit-dev/vibe-coder-3d.git (fetch)
# upstream  https://github.com/jonit-dev/vibe-coder-3d.git (push)
```

### 4. Install Dependencies

```bash
yarn install
```

### 5. Set Up Git Hooks

```bash
yarn prepare  # Installs Husky git hooks
```

## Feature Development

### Step 1: Sync with Upstream

Always start with the latest code:

```bash
# Fetch latest changes from upstream
git fetch upstream

# Ensure you're on master
git checkout master

# Merge upstream changes
git merge upstream/master

# Push to your fork
git push origin master
```

### Step 2: Create Feature Branch

Use descriptive branch names following the convention:

```bash
# Feature
git checkout -b feature/add-particle-system

# Bug fix
git checkout -b fix/physics-collision-bug

# Documentation
git checkout -b docs/update-api-reference

# Refactoring
git checkout -b refactor/improve-ecs-performance
```

### Step 3: Develop Your Feature

Make your changes following the [Coding Guidelines](CONTRIBUTING.md#coding-guidelines).

```bash
# Make changes to files
# ...

# Check status
git status

# Add files
git add .

# Or add specific files
git add src/core/components/ParticleSystem.ts
```

### Step 4: Commit Changes

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```bash
git commit -m "feat(particles): add particle system component

- Implement particle emitter with configurable parameters
- Add particle physics integration
- Include shader support for particle rendering

Closes #123"
```

**Commit Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, or auxiliary tools
- `ci`: CI/CD configuration changes

**Commit Best Practices:**

- Keep commits atomic (one logical change per commit)
- Write clear, descriptive commit messages
- Reference related issues using keywords: `Fixes #123`, `Closes #456`, `Relates to #789`
- Keep subject line under 72 characters
- Use imperative mood ("add feature" not "added feature")

### Step 5: Keep Branch Updated

Regularly sync with upstream to avoid conflicts:

```bash
# Fetch upstream changes
git fetch upstream

# Rebase your branch on latest master
git rebase upstream/master

# If conflicts occur, resolve them then:
git add .
git rebase --continue

# Force push to your fork (only on your feature branch!)
git push origin feature/your-feature-name --force
```

### Step 6: Test Your Changes

Before pushing, ensure all tests pass:

```bash
# Run all verification checks
yarn verify

# Individual checks
yarn test          # Unit tests
yarn typecheck     # TypeScript type checking
yarn lint          # Linting
yarn rust:test     # Rust tests (if applicable)
```

### Step 7: Push to Your Fork

```bash
git push origin feature/your-feature-name
```

## Creating a Pull Request

### Step 1: Navigate to GitHub

Go to your fork: `https://github.com/YOUR-USERNAME/vibe-coder-3d`

### Step 2: Create PR

1. Click "Compare & pull request" button
2. Select base repository: `jonit-dev/vibe-coder-3d`
3. Select base branch: `master`
4. Select compare branch: `feature/your-feature-name`

### Step 3: Fill Out PR Template

Complete all sections of the [PR template](.github/pull_request_template.md):

- **Description**: Clear summary of changes
- **Related Issues**: Link issues (e.g., `Fixes #123`)
- **Type of Change**: Select applicable options
- **Components**: Mark affected components
- **Changes Made**: Detailed list of changes
- **Testing Performed**: Describe testing done
- **Screenshots/Videos**: Add visual proof for UI changes
- **Performance Impact**: Note any performance considerations
- **Breaking Changes**: Document breaking changes and migration path
- **Documentation**: Confirm docs are updated
- **Checklist**: Complete all items

### Step 4: Submit PR

Click "Create pull request".

### Step 5: Address Review Feedback

**When reviewers request changes:**

1. Make the requested changes in your local branch
2. Commit the changes:
   ```bash
   git add .
   git commit -m "fix: address review feedback"
   ```
3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
4. The PR will automatically update

**Responding to comments:**

- Reply to each comment explaining your changes
- Mark conversations as resolved when addressed
- Ask for clarification if needed

### Step 6: Squash and Merge

Once approved:

1. Maintainers will squash and merge your PR
2. Your feature branch will be automatically deleted from the repository
3. Delete your local branch:
   ```bash
   git checkout master
   git pull upstream master
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

## Release Process

### Step 1: Create Release Branch

```bash
# Ensure you're on latest master
git checkout master
git pull upstream master

# Create release branch
git checkout -b release/1.3.0
```

### Step 2: Prepare Release

1. **Update version numbers:**
   ```bash
   # Update package.json version
   npm version 1.3.0 --no-git-tag-version

   # Update Cargo.toml versions
   # Edit rust/engine/Cargo.toml
   # Edit rust/game/Cargo.toml
   ```

2. **Update CHANGELOG.md:**
   ```markdown
   ## [1.3.0] - 2025-11-09

   ### Added
   - New particle system component
   - Enhanced material editor

   ### Fixed
   - Physics collision detection bug
   - Camera rotation issue

   ### Changed
   - Improved ECS performance
   - Updated renderer architecture
   ```

3. **Update documentation:**
   - README.md (if needed)
   - API documentation
   - Migration guides (for breaking changes)

4. **Run full test suite:**
   ```bash
   yarn verify
   yarn rust:test
   ```

### Step 3: Commit and Push

```bash
git add .
git commit -m "chore(release): prepare version 1.3.0"
git push origin release/1.3.0
```

### Step 4: Create Release PR

1. Open PR from `release/1.3.0` to `master`
2. Title: "Release v1.3.0"
3. Description: Copy CHANGELOG.md entries for this version
4. Request reviews

### Step 5: Merge and Tag

Once approved:

```bash
# Merge to master
git checkout master
git pull upstream master

# Create annotated tag
git tag -a v1.3.0 -m "Release version 1.3.0

Added:
- Particle system component
- Enhanced material editor

Fixed:
- Physics collision detection
- Camera rotation issue"

# Push tag
git push upstream v1.3.0

# Delete release branch
git branch -d release/1.3.0
git push origin --delete release/1.3.0
```

### Step 6: Create GitHub Release

1. Go to https://github.com/jonit-dev/vibe-coder-3d/releases/new
2. Select tag: `v1.3.0`
3. Title: `v1.3.0 - Release Title`
4. Description: Paste CHANGELOG.md content
5. Attach binaries if applicable
6. Click "Publish release"

## Hotfix Process

For critical bugs in production that need immediate attention:

### Step 1: Create Hotfix Branch

```bash
# Ensure you're on latest master
git checkout master
git pull upstream master

# Create hotfix branch from master
git checkout -b hotfix/1.2.1-crash-on-startup
```

### Step 2: Fix the Issue

```bash
# Make the fix
# ...

# Commit with clear description
git add .
git commit -m "fix(core): prevent crash on startup when config is missing

- Add null check for config object
- Provide sensible defaults for missing values
- Add error logging for debugging

Fixes #456"
```

### Step 3: Test Thoroughly

```bash
yarn verify
yarn rust:test

# Manual testing of the specific bug
# ...
```

### Step 4: Update Version

```bash
# Update package.json
npm version patch --no-git-tag-version  # 1.2.0 -> 1.2.1

# Update CHANGELOG.md
```

```markdown
## [1.2.1] - 2025-11-09

### Fixed
- Critical crash on startup when configuration file is missing
```

### Step 5: Commit Version Bump

```bash
git add .
git commit -m "chore(release): version 1.2.1"
```

### Step 6: Create Hotfix PR

```bash
git push origin hotfix/1.2.1-crash-on-startup
```

1. Open PR from `hotfix/1.2.1-crash-on-startup` to `master`
2. Mark as urgent
3. Request immediate review

### Step 7: Merge and Tag

```bash
# After approval, merge to master
git checkout master
git pull upstream master

# Tag the hotfix
git tag -a v1.2.1 -m "Hotfix v1.2.1: Fix crash on startup"
git push upstream v1.2.1

# If develop branch exists, merge back
# git checkout develop
# git merge master
# git push upstream develop

# Delete hotfix branch
git branch -d hotfix/1.2.1-crash-on-startup
git push origin --delete hotfix/1.2.1-crash-on-startup
```

## Best Practices

### Branch Management

1. **Keep branches short-lived**: Merge within 1-2 weeks
2. **One feature per branch**: Don't mix multiple features
3. **Delete merged branches**: Clean up after merging
4. **Sync regularly**: Rebase on master frequently to avoid conflicts

### Commit Hygiene

1. **Atomic commits**: Each commit should be a logical unit
2. **Descriptive messages**: Explain why, not just what
3. **Reference issues**: Use `Fixes #123` to auto-close issues
4. **Sign commits**: Consider signing commits for security

### Code Review

1. **Review your own PR first**: Self-review before requesting others
2. **Keep PRs small**: Easier to review, faster to merge
3. **Respond promptly**: Address feedback within 24-48 hours
4. **Be respectful**: Constructive feedback only

### Testing

1. **Test before pushing**: Run `yarn verify` locally
2. **Test both platforms**: TypeScript editor and Rust engine
3. **Write tests for new features**: Maintain test coverage
4. **Manual testing**: Not everything can be unit tested

### Documentation

1. **Update docs with code**: Documentation is part of the feature
2. **Add examples**: Show how to use new features
3. **Document breaking changes**: Include migration guides
4. **Keep CLAUDE.md updated**: Document learnings and patterns

## Common Scenarios

### Scenario 1: Conflict During Rebase

```bash
# During rebase, conflicts occur
git status  # See conflicting files

# Edit files to resolve conflicts
# Look for <<<<<<< HEAD markers

# After resolving
git add .
git rebase --continue

# If you want to abort
git rebase --abort
```

### Scenario 2: Made Commits on Wrong Branch

```bash
# You're on master but should be on feature branch
git branch feature/new-feature    # Create branch at current position
git reset --hard upstream/master  # Reset master to upstream
git checkout feature/new-feature  # Switch to feature branch
```

### Scenario 3: Need to Update PR with Latest Master

```bash
git checkout feature/your-feature
git fetch upstream
git rebase upstream/master
# Resolve conflicts if any
git push origin feature/your-feature --force
```

### Scenario 4: Accidentally Pushed to Master

```bash
# Contact maintainers immediately
# Do not force push to master
# They will help revert the changes
```

### Scenario 5: Need to Split Large PR

```bash
# Create multiple feature branches from your current work
git checkout -b feature/part-1
# Cherry-pick specific commits
git cherry-pick <commit-hash>

git checkout -b feature/part-2
git cherry-pick <other-commit-hash>

# Create separate PRs for each part
```

### Scenario 6: Forgot to Create Branch

```bash
# You have uncommitted changes on master
git stash                          # Stash changes
git checkout -b feature/new-feature  # Create feature branch
git stash pop                      # Apply stashed changes
git add .
git commit -m "feat: add feature"
```

## Questions?

- **Git Flow Questions**: Check [Atlassian Git Flow Guide](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- **Git Basics**: See [Git Documentation](https://git-scm.com/doc)
- **Project-Specific**: Check [CONTRIBUTING.md](CONTRIBUTING.md)
- **Need Help**: Ask in [GitHub Discussions](https://github.com/jonit-dev/vibe-coder-3d/discussions)

## Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Git Flow Cheatsheet](https://danielkummer.github.io/git-flow-cheatsheet/)

---

**Remember**: When in doubt, create a PR and ask for guidance. The community is here to help!
