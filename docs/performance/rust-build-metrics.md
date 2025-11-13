# Rust Engine Build Performance Metrics

## Baseline Metrics (Before Optimization)

**Date**: November 13, 2024
**Machine**: Linux WSL2, 8 cores
**Cargo Version**: 1.82+
**Rustc Version**: 1.82+

### Build Times

| Build Type | Time (clean) | Binary Size |
|------------|-------------|-------------|
| Debug      | 58.26s (~1 min) | 325 MB |
| Release    | 96.47s (~1.6 min) | 22 MB |

### Observations

**Current State:**
- Debug binary is extremely large at 325 MB due to embedded debug symbols
- Clean debug build takes ~1 minute (better than the 5-10 min documented in README)
- Clean release build takes ~1.6 minutes
- No build caching in use (sccache not configured)
- No split debug info (all DWARF embedded in binary)
- Default feature set includes all heavy dependencies (physics, scripting, audio, GLTF)

**Key Offenders (Expected):**
- `rapier3d` + `parry3d` (physics simulation)
- `mlua` with LuaJIT compilation (scripting)
- `three-d` + `three-d-asset` (rendering engine)
- `wgpu` + dependencies (GPU abstraction)
- Debug symbols embedded in binary (no split-debuginfo)

### Numeric Targets

Based on the PRD and current baseline, we aim for:

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Clean debug build | 58s | ≤45s | ⏳ Pending |
| Incremental rebuild | N/A | ≤15s | ⏳ Pending |
| Debug binary size | 325 MB | ≤120 MB | ⏳ Pending |
| Release binary size | 22 MB | ≤12 MB | ⏳ Pending |
| Dependency cache hit rate | 0% | >80% | ⏳ Pending |

**Notes:**
- The current build time is already better than documented, but we can still improve
- Primary focus: reduce binary sizes via split-debuginfo and stripped release builds
- Secondary focus: implement build caching and modular features
- Tertiary focus: optimize linker and dependency features

## Optimization Phases

### Phase 1: Tooling & Cache Infrastructure ✅
- [x] Create xtask utility with metrics commands
- [x] Configure sccache for dependency caching
- [x] Switch to mold/lld linker for faster linking
- [x] Add cargo-chef for CI layer caching

### Phase 2: Feature Partitioning ✅
- [x] Make physics, scripting, audio optional
- [x] Create feature presets (minimal, renderer, full)
- [ ] Gate code paths with #[cfg(feature = "...")] (deferred - app is deeply integrated)
- [x] Move BVH demos to separate examples

### Phase 3: Profile Tuning ✅
- [x] Add dev-fast profile with split-debuginfo
- [x] Add dist profile with LTO, strip, panic=abort
- [x] Trim dependency features (remove unused)
- [x] Ensure assets stay external (no include_bytes!)

### Phase 4: CI Integration ⏳
- [ ] Add build metrics to PR checks (manual for now)
- [ ] Upload stripped binaries as artifacts
- [ ] Implement regression detection (>10% = fail)

## Build Matrix

| Profile | Features | Build Time (clean) | Binary Size | Use Case |
|---------|----------|-------------------|-------------|----------|
| dev | default | 58s | 325 MB (baseline) | Local development |
| dev-fast | default | **94s** | **30 MB** | Fast iteration |
| release | default | 96s | 22 MB | Standard release |
| dist | default | TBD | TBD | CI artifacts (to be tested) |

**Improvements:**
- dev-fast binary: 325 MB → 30 MB (**91% reduction!**)
- Debug symbols now in separate .dwp files
- dev-fast optimizations provide good balance

## Historical Data

### 2024-11-13: Baseline Capture
- Initial measurement before any optimizations
- Debug: 58s, 325 MB
- Release: 96s, 22 MB
- No caching, no split-debuginfo, all features enabled

### 2024-11-13: Post-Optimization
- Configured split-debuginfo for all dev profiles
- Added dev-fast profile: 94s, 30 MB
- Configured sccache (when available)
- Added xtask utilities for metrics
- Created feature presets
- Binary size reduced by 91% for dev-fast profile!
