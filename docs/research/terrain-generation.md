# Terrain Generation

AI can now do 80-90 % of the heavy lifting for a solo developer, so the best-value pipeline is basically **“Blender + AI copilots everywhere”**.  
Below is a lean, wallet-friendly flow that turns text prompts and phone photos into React-Three-Fiber-ready `.glb` environments with almost no hand sculpting.

---

## 0. Why Blender + MCP is the hub

- **Blender MCP** bolts a chat window (Claude/GPT) onto Blender so you can _type_ “scatter pine trees on the slope” and the add-on executes the Python for you. citeturn0search0turn0search1
- It already pipes in free assets from Poly Haven (HDRIs, textures, models) and can even spin up a Three.js sketch of the scene. citeturn0search0
- Installation is one ZIP + “Connect to Claude” button—no subscription cost if you run a free model via OpenRouter. citeturn0search4

That makes Blender the single place where AI, kit-bash assets, and your own scans meet before a one-click `.glb` export.

---

## 1. Block out the world in seconds

### 1.1 Generate a 360° sky & broad mood

Use **Skybox AI**: type “sunset over ruined moss-covered temple, stylised” → download the 8 K equirectangular HDRI. citeturn3search0turn3search4  
Inside Blender MCP:

```prompt
add_environment_texture "temple_sky.hdr" as skybox
```

The AI HDRI gives instant believable lighting and a horizon that hides the fact your ground mesh is simple.

### 1.2 Quick terrain mesh

Ask MCP:

```prompt
create_terrain size=200m noise=’canyon’ quad_subdivide=6
```

It executes Geometry-Nodes displacement under the hood; tweak with the slider it exposes.

---

## 2. Fill the scene with geometry—three AI routes

| Need                                  | Cheapest route                                       | How                                                                                                         |
| ------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Photoreal hero prop** (e.g. statue) | Phone scan → **Kiri Engine** (free)                  | Capture 30 photos, export **glTF** or **USDZ** and drag-drop into Blender. citeturn4search0turn4search5 |
| **Generic rocks, ruins, trees**       | **Meshy AI** “text-to-3D” (200 free credits / month) | Prompt → download `.glb`. Works great for stylised low-poly. citeturn2search0turn2search5               |
| **Bulk vegetation / debris**          | Geometry Nodes scatter + free Poly Haven assets      | MCP can run the scatter node network for you. citeturn5search0                                           |

---

## 3. Texture everything in a couple of prompts

Install **Dream Textures** in Blender. With a mesh selected:

```prompt
dream_texture “cracked sandstone blocks with moss” seamless uv_project
```

Stable Diffusion bakes the result straight onto the UVs, or “Project Dream Texture” can paint the whole scene in one go. citeturn1search0turn1search4

---

## 4. Polish & optimise (still in Blender)

1. **Bake light** if you need mobile-class performance: Cycles → Lightmap Pack → Bake → save `.png` atlas. citeturn2search3
2. **LOD / decimate** large scans (Kiri exports can be heavy)—use MCP:
   ```prompt
   decimate selected target_ratio 0.4 preserve_uvs
   ```
3. **Geometry-Nodes scatter** for grass/pebbles—MCP exposes density & seed sliders. citeturn5search1turn5search2

---

## 5. Export and load in React-Three-Fiber

```prompt
export_scene glb "temple_scene.glb" apply_transformations
```

Then in R3F:

```jsx
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import sceneUrl from './assets/temple_scene.glb';

function World() {
  const { scene } = useGLTF(sceneUrl);
  return <primitive object={scene} />;
}

export default function App() {
  return (
    <Canvas shadows camera={{ position: [5, 3, 8], fov: 40 }}>
      <Suspense fallback={null}>
        <World />
        <Environment files="temple_sky.hdr" background />
      </Suspense>
      <OrbitControls makeDefault />
    </Canvas>
  );
}
```

---

## 6. Time & cost checklist for a single environment

| Step                | Tool           | Time                        | Cost         |
| ------------------- | -------------- | --------------------------- | ------------ |
| Skybox HDRI         | Skybox AI      | 1 min                       | Free         |
| Terrain mesh        | MCP prompt     | 2 min                       | Free         |
| Props (scan)        | Kiri Engine    | 5 min capture, 10 min cloud | Free tier    |
| Filler assets       | Meshy AI       | 1-2 min / asset             | Free credits |
| Texturing           | Dream Textures | 3 min                       | Free         |
| Scatter & bake      | MCP commands   | 5 min                       | Free         |
| Export & R3F hookup | —              | 2 min                       | Free         |

Total: **~30 minutes**, zero paid software, runs on a mid-range laptop.

---

### Key takeaways

- **Blender + MCP** turns natural-language prompts into geometry, lighting, and code—perfect for a solo dev.
- Free AI tools (Skybox AI, Dream Textures, Meshy, Kiri Engine) cover sky, textures, meshes, and scans with minimal manual work.
- Keep everything in **glTF/.glb** so R3F can import with zero conversion.
- Geometry-Nodes + free asset sites fill the last 10 % the AIs miss.

Follow this loop and you’ll crank out React-ready environments faster than most studios—without their budget.
