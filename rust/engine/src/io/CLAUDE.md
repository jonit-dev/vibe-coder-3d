# Scene IO Layer

## Role

- Loading, validating, and diagnosing `.json` scenes produced by the TypeScript editor.
- Centralizes schema warnings so renderer/threed code can assume sanitized data.

## Modules

- `loader.rs`: Reads the file, deserializes into `vibe_scene::Scene`, normalizes metadata, and logs a verbose diagnostic dump (component-by-component) for visual parity debugging.
- `validation.rs` + `schema_validator.rs`: Detect unknown/missing fields without aborting the load; treat warnings as hints to update schemas rather than fatal errors.
- Future format changes should happen here first so downstream consumers keep a stable API.

## Best Practices

- Keep `dump_scene_diagnostics` cheap to disable: guard future extensions behind env flags if they become noisy, but keep the default rich logging while parity work continues.
- When extending validation, prefer the generic helpers in `schema_validator.rs` instead of bespoke JSON walking.
- IO modules should never pull renderer or physics dependencies—return pure data and let higher layers decide what to do with it.
