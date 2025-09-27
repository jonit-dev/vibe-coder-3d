# Core Hooks Guidelines

**Purpose**: React hooks for core engine integration and state management.

**Hook Categories**:

- ECS integration hooks
- Asset loading and management
- Performance monitoring
- Engine lifecycle management
- Event system integration

**ECS Hooks**:

- `useEntity()` - Entity lifecycle and queries
- `useComponent()` - Component access and updates
- `useSystem()` - System integration and controls
- `useQuery()` - Efficient component queries

**Asset Hooks**:

- `useAsset()` - Asset loading with caching
- `useAssetPreload()` - Background asset loading
- `useAssetStatus()` - Loading state management

**Best Practices**:

- Hooks must be pure and predictable
- Minimal dependencies to prevent re-renders
- Proper cleanup in useEffect
- Error boundaries for hook failures
- Performance optimization with useMemo/useCallback
