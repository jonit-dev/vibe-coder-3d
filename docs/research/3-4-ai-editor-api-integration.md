# AI Chat and Editor API Integration for Vibe Coder 3D

This document outlines the approach for integrating the AI Chat (Copilot) with the Vibe Coder 3D engine and editor through a dedicated "Editor API" (or "Engine API"). This integration is central to the "AI-first" vision of the project.

## The Role of the Editor API

The "Editor API" (also referred to as `EngineCommands` or similar) serves as the crucial bridge between the natural language instructions processed by the AI and the concrete actions performed by the game engine. The AI will translate user requests into calls to this API.

### Characteristics of the Editor API:

- **Declarative:** Commands should describe _what_ to do, not necessarily _how_ to do it (though some commands might be lower-level).
- **Granular and Composable:** Offer a range of commands from creating entities and adding components to modifying properties and triggering system logic. Complex user requests can be broken down by the AI into a sequence of these commands.
- **Serializable/Structured:** API calls should be representable in a structured format (e.g., JSON) that an LLM can easily generate.
- **Well-Documented & Typed:** Essential for the AI to "understand" and correctly use the API. TypeScript definitions are highly beneficial.
- **Extensible:** Designed to grow as engine and editor capabilities expand.

### Example API Calls (Conceptual):

- `EditorAPI.createEntity({ name: 'MyObject', parentId?: string })`
- `EditorAPI.addComponent({ entityId: string, componentType: string, properties: Record<string, any> })`
- `EditorAPI.removeComponent({ entityId: string, componentType: string })`
- `EditorAPI.setComponentProperty({ entityId: string, componentType: string, propertyPath: string, value: any })`
- `EditorAPI.loadAsset({ assetType: 'model' | 'texture', path: string, name?: string })`
- `EditorAPI.selectEntity({ entityId: string })`
- `EditorAPI.saveScene()`
- `EditorAPI.undo()` / `EditorAPI.redo()`

## AI Interaction Workflow

1.  **User Input:** The user types a command in natural language into the AI chat interface (e.g., "Create a red sphere that bounces.").
2.  **AI Processing (`src/ai`):**
    - The input is sent to a Large Language Model (LLM) (e.g., GPT-4, Claude).
    - The LLM is primed with a system prompt that includes:
      - The definition/schema of the `EditorAPI` (e.g., function signatures, parameter types, descriptions).
      - Examples of natural language commands mapped to `EditorAPI` call sequences (few-shot prompting).
      - Context about the current scene or project state (optional, for more advanced interactions).
3.  **Command Generation:**
    - The LLM generates a structured output, typically a JSON object or a sequence of objects, representing the `EditorAPI` call(s) needed to fulfill the user's request.
    - Modern LLMs with "function calling" capabilities are ideal for this, ensuring the output conforms to the API's schema.
4.  **Validation & Execution:**
    - The AI layer (`src/ai`) receives the structured command(s) from the LLM.
    - **Validation:** Commands are validated against the `EditorAPI` schema. (Are the function names correct? Are parameters of the right type? Are required parameters present?).
    - **Execution:** Valid commands are then translated into actual function calls within the engine/editor's JavaScript/TypeScript environment.
    - This execution directly manipulates the engine state (e.g., creating entities in the ECS, modifying component data, updating the renderer).
5.  **Feedback:**
    - **To User:** The AI chat interface provides feedback to the user about the actions taken, any errors encountered, or requests for clarification if the command was ambiguous.
    - **To LLM (Potentially):** If commands fail validation or execution, this error information can sometimes be fed back to the LLM in a subsequent call to allow it to correct its output (self-correction loop).

## Making the AI "Aware" of the API

- **System Prompt Engineering:** This is the primary method. The system prompt given to the LLM will contain a detailed description of the `EditorAPI` functions, their arguments, expected behavior, and potentially constraints.
- **TypeScript Definitions:** Providing the LLM with the actual TypeScript definition files for the API can be highly effective for models trained on code.
- **Few-Shot Examples:** Crucial for guiding the LLM. Include varied examples of user requests and the corresponding correct API call sequences.
- **Iterative Development & Fine-Tuning (Future):** As the system is used, patterns of incorrect API usage by the LLM can be identified. This can inform prompt adjustments or, in more advanced scenarios, contribute to fine-tuning a dedicated model.
- **Dynamic API Updates:** If the `EditorAPI` is extended, the information provided to the LLM (system prompt, type definitions) must be updated accordingly.

## Bridging Layer (`src/ai`)

This module is responsible for orchestrating the interaction:

- Managing communication with the selected LLM service.
- Formatting user input and context for the LLM.
- Parsing the LLM's structured output (the API calls).
- Performing validation of the generated API calls.
- Invoking the actual `EditorAPI` functions in the engine/editor.
- Handling errors and providing user feedback.

The success of Vibe Coder 3D's AI-first approach hinges on a robust, well-designed `EditorAPI` and a sophisticated AI layer capable of accurately translating natural language into these API calls. This integration is detailed as an "immediate priority" and a core part of the `AI Copilot Architecture` and `AI-First Implementation Plan`.
