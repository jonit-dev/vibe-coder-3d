# Game Editor Scene Serialization

This document outlines the functionality for saving and loading scene data within the Vibe Coder 3D Editor.

## Goal

The primary goal is to allow users to save the current state of the scene (entities and their relevant components) to a JSON file and load it back into the editor, enabling persistence of work.

## Current Implementation

Scene serialization is handled by the `useSceneSerialization` hook located at `src/editor/hooks/useSceneSerialization.ts`. This hook provides two core functions:

- `exportScene(): ISerializedScene`: Iterates through all entities in the `bitecs` world that have a `Transform` component. For each valid entity, it extracts all registered component data (see the component registry) and packages it into an `ISerializedEntity` object. It returns an `ISerializedScene` object containing an array of these entities.
- `importScene(scene: ISerializedScene)`: Takes an `ISerializedScene` object as input. It first calls `resetWorld()` from `@core/lib/ecs` to clear the current ECS state. Then, it iterates through the `entities` array in the input scene object. For each serialized entity, it calls `createEntity()` to create a new entity in the world and sets all registered component data based on the loaded information. It also marks the transform for update (`Transform.needsUpdate[eid] = 1`).
- ✅ **Component registry:** All serializable components are registered in one place. To add a new component, just add it to the registry and (optionally) the Zod schema for validation.
- ✅ **Zod schema validation:** Scene files are validated against a Zod schema before import, providing clear error messages for invalid files.

### Integration in Editor.tsx

The `Editor` component (`src/editor/Editor.tsx`) utilizes this hook:

- **Save:** The `handleSave` function calls `exportScene()` to get the scene data and then uses a helper function `downloadJSON` to trigger a browser download of the data as `scene.json`.
- **Load:** The `handleLoad` function is triggered by a hidden file input (`<input type="file">`). When a file is selected, it reads the file content, parses it as JSON, and calls `importScene()` with the parsed data.
- **Clear:** The `handleClear` function effectively loads an empty scene by calling `importScene({ entities: [] })` and resets the selected entity ID.
- **UI:** Buttons for "Save Scene", "Load Scene", and "Clear" are present in the editor's header, wired to these handler functions.

### Save Process Diagram

```mermaid
sequenceDiagram
    actor User
    participant EditorUI as Editor.tsx (UI)
    participant Handlers as Editor.tsx (Handlers)
    participant SerializationHook as useSceneSerialization
    participant ECS as @core/lib/ecs
    participant Browser

    User->>EditorUI: Click "Save Scene" Button
    EditorUI->>Handlers: handleSave()
    Handlers->>SerializationHook: exportScene()
    activate SerializationHook
    SerializationHook->>ECS: Read all registered component data
    ECS-->>SerializationHook: Component data
    SerializationHook-->>Handlers: ISerializedScene object
    deactivate SerializationHook
    Handlers->>Handlers: downloadJSON(scene, 'scene.json')
    Handlers->>Browser: JSON.stringify()
    Handlers->>Browser: Create Blob & Object URL
    Handlers->>Browser: Trigger file download (<a> tag)
    Handlers->>Browser: Revoke Object URL
    Handlers->>EditorUI: Update status message('Scene saved...')
```

### Load Process Diagram

```mermaid
sequenceDiagram
    actor User
    participant EditorUI as Editor.tsx (UI)
    participant Handlers as Editor.tsx (Handlers)
    participant Browser
    participant SerializationHook as useSceneSerialization
    participant ECS as @core/lib/ecs

    User->>EditorUI: Click "Load Scene" Button
    EditorUI->>Browser: Trigger file input click
    Browser->>User: Show file selection dialog
    User->>Browser: Select scene.json file
    Browser->>Handlers: onChange event with File object
    Handlers->>Handlers: handleLoad(event)
    Handlers->>Browser: new FileReader()
    Handlers->>Browser: reader.readAsText(file)
    activate Browser
    Browser-->>Handlers: reader.onload event (file content as string)
    deactivate Browser
    Handlers->>Browser: JSON.parse(fileContent)
    Browser-->>Handlers: Parsed JSON (ISerializedScene)
    Handlers->>SerializationHook: importScene(parsedJson)
    activate SerializationHook
    SerializationHook->>ECS: resetWorld()
    loop For each entity in parsedJson.entities
        SerializationHook->>ECS: createEntity()
        ECS-->>SerializationHook: new entity ID (eid)
        SerializationHook->>ECS: Set all registered component data
        opt If entity.name exists
            SerializationHook->>ECS: setEntityName(eid, entity.name)
        end
    end
    SerializationHook-->>Handlers: void
    deactivate SerializationHook
    Handlers->>EditorUI: Update status message('Scene loaded...')
```

### Clear Process Diagram

```mermaid
sequenceDiagram
    actor User
    participant EditorUI as Editor.tsx (UI)
    participant Handlers as Editor.tsx (Handlers)
    participant SerializationHook as useSceneSerialization
    participant ECS as @core/lib/ecs

    User->>EditorUI: Click "Clear" Button
    EditorUI->>Handlers: handleClear()
    Handlers->>SerializationHook: importScene({ entities: [] })
    activate SerializationHook
    SerializationHook->>ECS: resetWorld()
    SerializationHook-->>Handlers: void (empty loop)
    deactivate SerializationHook
    Handlers->>Handlers: setSelectedId(null)
    Handlers->>EditorUI: Update status message('Scene cleared.')
```

## Data Format

The serialization format is defined by TypeScript interfaces within `useSceneSerialization.ts` and validated by Zod:

```typescript
export interface ISerializedEntity {
  id: number; // Note: This ID is informational during export, not strictly used during import
  name?: string;
  meshType?: MeshTypeEnum;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number, number]; // Quaternion (x, y, z, w)
    scale: [number, number, number];
  };
  velocity?: IVelocityComponent;
  // Future components can be added here via the registry
}

export interface ISerializedScene {
  version: number;
  entities: ISerializedEntity[];
}
```

## ✅ Limitations & Future Improvements

- ✅ **Component registry:** All serializable components are registered in one place. To add a new component, just add it to the registry and (optionally) the Zod schema for validation.
- ✅ **Zod schema validation:** Scene files are validated against a Zod schema before import, providing clear error messages for invalid files.
- ✅ **Versioning:** The format includes a version number for future compatibility.
- ✅ **Name support:** The entity's name is exported and imported if present.
- ✅ **Extensible:** Adding new components is as simple as adding them to the registry and schema.
- ✅ **Entity ID handling:** Exported IDs are informational; new IDs are created on import.
- ❌ **Serializing entity relationships/hierarchy:** Not present, but can be added if needed in the future.
- ❌ **Serializing materials, physics settings, or custom game components:** Add to the registry and schema as needed.
- ❌ **UI feedback: loading indicators, more specific error/success messages:** Currently only status messages are shown.

**To add new components:**

- Add your component to the `componentRegistry` in `useSceneSerialization.ts` with `serialize` and `deserialize` logic.
- (Optionally) Add a Zod schema for validation.
- That's it! No need to change the core serialization logic.
