# Unified Pattern Playbook → **React-Three-Fiber Blueprint Engine**

*(“Blueprint” = the saved object graph you would call *Scene* in Godot or *Prefab* in Unity.)*

| Classical feature          | Source engine                                                       | Purpose                                                | R3F translation                                                                                            |
| -------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Node Composition**       | Godot Nodes/Scenes citeturn0search0 & Unity GameObject/Component | Build behaviour by adding tiny parts, not subclassing. | Pure JSX. One file ≈ one Blueprint root; children are functional components that own **one** concern each. |
| **Blueprint Variant**      | Inherited Scene / Prefab Variant citeturn0search5turn0search6   | Create tuned-offspring without copy–paste.             | `const Orc = Blueprint(Goblin, {color:"#0f0", hp:200})` – call a factory with override-props.              |
| **Signals / UnityEvent**   | Godot Signals citeturn0search1 / UnityEvent citeturn2search0  | Decoupled callbacks.                                   | Global **mitt** emitter + `useSignal(event, cb)` hook.                                                     |
| **Groups / Tags**          | Godot Groups citeturn1search0                                    | Query bulk objects.                                    | `useTag("enemy")` registers; `getNodes("enemy")` returns refs for AI or cleanup.                           |
| **Singleton / Autoload**   | Godot Autoload citeturn0search2                                  | Always-reachable state/service.                        | React Context (`<GameStateProvider>`).                                                                     |
| **Data Assets**            | Godot Resource & Unity ScriptableObject citeturn0search3         | Designer-editable data.                                | Type-safe JSON (`items/sword.json`) validated by Zod, loaded with `useAsset`.                              |
| **Addressables**           | Unity Addressables citeturn0search4                              | Async load by ID, remote-ready.                        | Manifest `{id:url}` → `import(url)` + Three.js loader, cached via IndexedDB.                               |
| **Input Action Map**       | Godot InputMap / Unity Input System                                 | Device-agnostic controls.                              | Central `useInput(actions)` hook maps keys+gamepads → “jump”, “dash”.                                      |
| **Layer / Additive Scene** | Unity additive scene                                                | Stream big worlds.                                     | Mount multiple R3F `Canvas` roots; lazy-load Blueprints per grid-chunk.                                    |
| **ECS (optional)**         | Unity DOTS                                                          | Millions of bullets.                                   | Plug bitecs; keep the rest declarative R3F.                                                                |
| **Build Slices**           | Unity asmdef                                                        | Fast iteration.                                        | Monorepo workspaces + Vite/Turbo incremental bundles.                                                      |
| **Editor-time Tools**      | Godot `@tool` & Unity custom inspectors                             | Automate tedious tasks.                                | Expose in-browser editors (Storybook or custom) that import same Blueprints; hot-reload via Vite.          |

---

#### Minimal API Sketch

```ts
// blueprint.ts
import { ReactElement, cloneElement } from "react";
type Blueprint<T extends object> = (props?: Partial<T>) => ReactElement;

export function Blueprint<T extends object>(
  Base: Blueprint<T> | ReactElement,
  overrides: Partial<T> = {}
): Blueprint<T> {
  return (props = {}) =>
    cloneElement(
      typeof Base === "function" ? <Base /> : Base,
      { ...overrides, ...props }
    );
}
```

```ts
// signals.ts
import mitt from 'mitt';
const bus = mitt();
export const emit = bus.emit;
export function useSignal<T = any>(type: string, cb: (e: T) => void) {
  React.useEffect(() => {
    bus.on(type, cb);
    return () => bus.off(type, cb);
  }, [type, cb]);
}
```

```ts
// tags.ts
const registry: Record<string, Set<THREE.Object3D>> = {};
export function useTag(tag: string, ref: React.RefObject<THREE.Object3D>) {
  React.useEffect(() => {
    (registry[tag] ??= new Set()).add(ref.current!);
    return () => registry[tag]?.delete(ref.current!);
  }, [tag, ref]);
}
export const getNodes = (tag: string) => Array.from(registry[tag] ?? []);
```

---

#### Workflow Checklist

1. **Start grey-boxing** Blueprints with simple boxes; art can swap later with zero code-touch.
2. Restrict Blueprint roots to high-level logic; everything visual lives in child components.
3. _Never_ reach into another Blueprint directly—emit a signal or use a tag.
4. Keep Contexts _thin_: config, save–load, audio bus, event bus.
5. Treat JSON data as the single source of truth; writers can edit without opening code.
6. Version all GLTF/text assets; enable text-based diffs (`gltf-pipeline -t`).
7. Profile Three.js draw-calls early (Spector.js); upgrade to ECS only when needed.

---

### Take-home

By fusing **Blueprints + Variants + Signals + Tags + Data Assets + Addressable loader**, you reproduce the productivity tricks of Godot and Unity inside React-Three-Fiber while keeping everything idiomatic React. Rename “scene” forever—long live the **Blueprint**.
