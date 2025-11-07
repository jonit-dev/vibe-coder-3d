# Utility Modules

## Components

- `time.rs`: Frame timing helpers (`FrameTimer`) used by the main loop and perf HUD. Keep it allocator-free so it can run in tight loops; tests live in `time_test.rs`.
- `screenshot.rs`: Screen capture helpers used by both CLI screenshot commands and the in-engine HUD; calculates viewport splits and writes to disk.
- `bvh_config.rs`: Resolves runtime BVH flags (feature gate + env var). Downstream code should call `bvh_enabled()` instead of re-reading env vars.

## Usage Guidelines

- Utilities here must remain dependency-light (std + logging). Higher-level modules should inject whatever they need instead of letting util depend upward.
- If a helper grows stateful or pulls in engine concepts, promote it to a dedicated module elsewhere; `util` is for narrow, reusable helpers.
