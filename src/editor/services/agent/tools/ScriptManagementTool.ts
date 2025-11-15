/**
 * Script Management Tool
 * Allows the AI to create, edit, and manage Lua scripts for entity behavior
 */

import { Logger } from '@core/lib/logger';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { getAvailableAPIs, getAPIDetails } from './scriptApiParser';

const logger = Logger.create('ScriptManagementTool');

// Script parameter types
export interface IScriptParameters extends Record<string, unknown> {
  [key: string]: string | number | boolean | unknown;
}

// Script management tool parameter types
interface IScriptManagementParams {
  action: 'create_custom' | 'attach_to_entity' | 'detach_from_entity' | 'set_parameters' | 'list_scripts' | 'get_script_code' | 'list_available_apis' | 'get_api_details' | 'get_api_reference';
  api_names?: string[];
  entity_id?: number;
  script_name?: string;
  script_id?: string;
  code?: string;
  parameters?: IScriptParameters;
}

export const scriptManagementTool = {
  name: 'script_management',
  description: `Create and manage TypeScript scripts for entity behavior.

CRITICAL SCRIPT WRITING RULES:
❌ DO NOT use export/import statements (causes "exports is not defined" errors)
✅ Write plain TypeScript functions: function onStart() {}, function onUpdate(deltaTime: number) {}
✅ All APIs are globally available - no imports needed
✅ Use parameters object to access configurable values from editor

Script lifecycle methods (write as plain functions):
- function onStart(): void - Called once when entity/script loads
- function onUpdate(deltaTime: number): void - Called every frame during play mode
- function onDestroy(): void - Called when entity/script is destroyed

Available global APIs (complete reference at src/game/scripts/script-api.d.ts):
- entity: Transform, components, hierarchy, physics
- time: Time tracking (time.time, time.deltaTime, time.frameCount)
- input: Keyboard, mouse, gamepad, action system
- math: Math utilities (lerp, clamp, distance, trig functions)
- console: Logging (log, warn, error, info)
- parameters: Script parameters from editor (access via parameters.yourParamName)
- events: Event bus for inter-entity communication
- audio: Sound playback (2D and 3D spatial audio)
- timer: setTimeout, setInterval, nextTick
- query: Scene queries, raycasting
- prefab: Entity spawning
- entities: Cross-entity operations
- gameObject: Runtime entity creation/destruction

COMMON MISTAKES TO AVOID:
1. ❌ Using export: "export function onStart()" → ✅ "function onStart()"
2. ❌ Hardcoding values: "rotate(0, deltaTime * 0.5, 0)" → ✅ "rotate(0, deltaTime * (parameters.speed || 0.5), 0)"
3. ❌ Forgetting to use parameters: User sets speed=10 but script uses 0.5 hardcoded
4. ❌ Not providing defaults: "parameters.speed" → ✅ "parameters.speed || 0.5"

Example script with parameters (CORRECT):
function onStart(): void {
  console.log('Entity started with speed:', parameters.speed);
}

function onUpdate(deltaTime: number): void {
  // Use parameters with fallback defaults
  const rotationSpeed = (parameters.speed as number) || 0.5;
  entity.transform.rotate(0, deltaTime * rotationSpeed, 0);
}

For detailed API reference:
- Use 'list_available_apis' to see all 20+ available APIs organized by category
- Use 'get_api_details' with specific API names to get detailed documentation and examples
- Use 'get_api_reference' to get the complete TypeScript definitions file`,
  input_schema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: [
          'create_custom',
          'attach_to_entity',
          'detach_from_entity',
          'set_parameters',
          'list_scripts',
          'get_script_code',
          'list_available_apis',
          'get_api_details',
          'get_api_reference',
        ],
        description: 'Script management action to perform',
      },
      api_names: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Array of API names to fetch details for (e.g., ["transform", "parameters", "rigidBody"]) - for get_api_details action',
      },
      entity_id: {
        type: 'number',
        description:
          'Entity ID (for create_custom, attach_to_entity, detach_from_entity, set_parameters)',
      },
      script_name: {
        type: 'string',
        description: 'Display name for the script (for create_custom)',
      },
      script_id: {
        type: 'string',
        description:
          'Script identifier (e.g., "entity-3.script", "rotating-cube") for attach_to_entity or get_script_code',
      },
      code: {
        type: 'string',
        description: 'TypeScript script code (for create_custom)',
      },
      parameters: {
        type: 'object',
        description:
          'Script parameters as key-value pairs (e.g., { speed: 45.0, color: "#ff0000" })',
      },
    },
    required: ['action'],
  },
};

/**
 * Execute script management tool
 */
export async function executeScriptManagement(params: IScriptManagementParams): Promise<string> {
  logger.info('Executing script management', { params });

  const { action, entity_id, script_name, script_id, code, parameters, api_names } = params;

  switch (action) {
    case 'create_custom':
      if (!entity_id || !code) {
        return 'Error: entity_id and code are required for create_custom';
      }
      return createCustomScript(entity_id, script_name || 'CustomScript', code, parameters);

    case 'attach_to_entity':
      if (!entity_id || !script_id) {
        return 'Error: entity_id and script_id are required for attach_to_entity';
      }
      return attachToEntity(entity_id, script_id, parameters);

    case 'detach_from_entity':
      if (!entity_id) {
        return 'Error: entity_id is required for detach_from_entity';
      }
      return detachFromEntity(entity_id);

    case 'set_parameters':
      if (!entity_id || !parameters) {
        return 'Error: entity_id and parameters are required for set_parameters';
      }
      return setParameters(entity_id, parameters);

    case 'list_scripts':
      return listScripts();

    case 'get_script_code':
      if (!script_id) {
        return 'Error: script_id is required for get_script_code';
      }
      return getScriptCode(script_id);

    case 'list_available_apis':
      return await listAvailableAPIs();

    case 'get_api_details':
      if (!api_names || !Array.isArray(api_names) || api_names.length === 0) {
        return 'Error: api_names array is required for get_api_details (e.g., ["transform", "parameters"])';
      }
      return getAPIDetails(api_names);

    case 'get_api_reference':
      return getAPIReference();

    default:
      return `Unknown action: ${action}`;
  }
}

/**
 * Create custom script with AI-generated code
 */
async function createCustomScript(
  entityId: number,
  scriptName: string,
  code: string,
  parameters?: IScriptParameters,
): Promise<string> {
  try {
    const scriptId = `entity-${entityId}.${scriptName.toLowerCase().replace(/\s+/g, '-')}`;

    // Save script file
    const saveResponse = await fetch('/api/script/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: scriptId,
        code,
        description: `Custom script for entity ${entityId}`,
      }),
    });

    const saveData = await saveResponse.json();
    if (!saveData.success) {
      return `Error saving script: ${saveData.error}`;
    }

    // Add Script component to entity
    componentRegistry.addComponent(entityId, 'Script', {
      scriptName,
      scriptPath: `${scriptId}.lua`,
      scriptRef: {
        scriptId,
        source: 'external',
        path: saveData.path,
        codeHash: saveData.hash,
        lastModified: Date.now(),
      },
      enabled: true,
      parameters: parameters || {},
    });

    logger.info('Custom script created', { entityId, scriptName, scriptId });

    const paramInfo = parameters ? ` with parameters ${JSON.stringify(parameters)}` : '';
    return `✅ Created custom script "${scriptName}" for entity ${entityId}${paramInfo}. Script ID: "${scriptId}". The script has been saved and auto-transpiled to Lua.`;
  } catch (error) {
    logger.error('Failed to create custom script', { error, entityId, scriptName });
    return `Error creating custom script: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Attach existing script to entity
 */
function attachToEntity(
  entityId: number,
  scriptId: string,
  parameters?: IScriptParameters,
): string {
  try {
    // Check if Script component already exists
    if (componentRegistry.hasComponent(entityId, 'Script')) {
      return `Entity ${entityId} already has a Script component. Use detach_from_entity first, or use set_parameters to modify existing script parameters.`;
    }

    // Add Script component referencing existing script
    componentRegistry.addComponent(entityId, 'Script', {
      scriptName: scriptId,
      scriptPath: `${scriptId}.lua`,
      scriptRef: {
        scriptId,
        source: 'external',
        path: `/src/game/scripts/${scriptId}.ts`,
        codeHash: '',
        lastModified: Date.now(),
      },
      enabled: true,
      parameters: parameters || {},
    });

    logger.info('Script attached to entity', { entityId, scriptId });

    const paramInfo = parameters ? ` with parameters ${JSON.stringify(parameters)}` : '';
    return `✅ Attached script "${scriptId}" to entity ${entityId}${paramInfo}.`;
  } catch (error) {
    logger.error('Failed to attach script', { error, entityId, scriptId });
    return `Error attaching script: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Detach script from entity
 */
function detachFromEntity(entityId: number): string {
  try {
    if (!componentRegistry.hasComponent(entityId, 'Script')) {
      return `Entity ${entityId} does not have a Script component.`;
    }

    componentRegistry.removeComponent(entityId, 'Script');

    logger.info('Script detached from entity', { entityId });
    return `✅ Removed Script component from entity ${entityId}.`;
  } catch (error) {
    logger.error('Failed to detach script', { error, entityId });
    return `Error detaching script: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Set script parameters
 */
function setParameters(entityId: number, parameters: IScriptParameters): string {
  try {
    if (!componentRegistry.hasComponent(entityId, 'Script')) {
      return `Entity ${entityId} does not have a Script component. Use attach_to_entity or create_from_template first.`;
    }

    // Update Script component parameters
    componentRegistry.updateComponent(entityId, 'Script', {
      parameters,
    });

    logger.info('Script parameters updated', { entityId, parameters });
    return `✅ Updated script parameters for entity ${entityId}: ${JSON.stringify(parameters)}`;
  } catch (error) {
    logger.error('Failed to set script parameters', { error, entityId });
    return `Error setting parameters: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * List available scripts
 */
async function listScripts(): Promise<string> {
  try {
    const response = await fetch('/api/script/list');
    const data = await response.json();

    if (!data.success) {
      return `Error listing scripts: ${data.error}`;
    }

    const scripts = data.scripts as Array<{
      id: string;
      filename: string;
      size: number;
      modified: string;
    }>;

    if (scripts.length === 0) {
      return 'No scripts available. Create scripts using create_custom action.';
    }

    let result = `📜 Available Scripts (${scripts.length}):\n\n`;

    for (const script of scripts) {
      result += `- ${script.id} (${script.filename}, ${(script.size / 1024).toFixed(1)}KB)\n`;
    }

    result += '\n**Usage:**\n';
    result += 'Use `attach_to_entity` with script_id to attach any of these scripts to an entity.';

    logger.info('Listed scripts', { count: scripts.length });
    return result;
  } catch (error) {
    logger.error('Failed to list scripts', { error });
    return `Error listing scripts: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Get script source code
 */
async function getScriptCode(scriptId: string): Promise<string> {
  try {
    const response = await fetch(`/api/script/load?id=${scriptId}`);
    const data = await response.json();

    if (!data.success) {
      return `Error: Script "${scriptId}" not found. Use list_scripts to see available scripts.`;
    }

    logger.info('Retrieved script code', { scriptId });
    return `📄 Script "${scriptId}" (${data.path}):\n\n\`\`\`typescript\n${data.code}\n\`\`\`\n\nHash: ${data.hash}\nLast modified: ${data.modified}`;
  } catch (error) {
    logger.error('Failed to get script code', { error, scriptId });
    return `Error getting script code: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * List all available script APIs organized by category
 */
async function listAvailableAPIs(): Promise<string> {
  try {
    const apis = await getAvailableAPIs();

    if (apis.length === 0) {
      return 'Error: Could not load script APIs. Please check that script-api.d.ts exists.';
    }

    // Group by category
    const byCategory = apis.reduce(
      (acc, api) => {
        if (!acc[api.category]) {
          acc[api.category] = [];
        }
        acc[api.category].push(api);
        return acc;
      },
      {} as Record<string, typeof apis>,
    );

    let result = `📚 Available Script APIs (${apis.length} total)\n\n`;
    result += `All these APIs are globally available in scripts - no imports needed!\n\n`;

    // Output by category
    const categories = Object.keys(byCategory).sort();
    for (const category of categories) {
      const categoryAPIs = byCategory[category];
      result += `## ${category} (${categoryAPIs.length} APIs)\n\n`;

      for (const api of categoryAPIs) {
        result += `- **${api.name}** (${api.type}): ${api.description}\n`;
        if (api.methods && api.methods.length > 0) {
          result += `  Methods: ${api.methods.slice(0, 5).join(', ')}${api.methods.length > 5 ? ` + ${api.methods.length - 5} more` : ''}\n`;
        }
        if (
          api.properties &&
          api.properties.length > 0 &&
          api.properties[0] !== '(dynamic - defined by user)'
        ) {
          result += `  Properties: ${api.properties.slice(0, 5).join(', ')}${api.properties.length > 5 ? ` + ${api.properties.length - 5} more` : ''}\n`;
        }
      }
      result += '\n';
    }

    result += `\n**Next Steps:**\n`;
    result += `- Use \`get_api_details\` with api_names array to get detailed info and examples\n`;
    result += `  Example: { "action": "get_api_details", "api_names": ["transform", "parameters", "rigidBody"] }\n`;
    result += `- Use \`get_api_reference\` to see the complete TypeScript definitions\n`;

    logger.info('Listed available APIs', { count: apis.length });
    return result;
  } catch (error) {
    logger.error('Failed to list available APIs', { error });
    return `Error listing APIs: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Get API reference documentation
 * Reads the script-api.d.ts file to provide complete API documentation
 */
async function getAPIReference(): Promise<string> {
  try {
    // Load the script API type definitions
    const response = await fetch('/src/game/scripts/script-api.d.ts');

    if (!response.ok) {
      return `Error: Could not load API reference (status: ${response.status})`;
    }

    const apiDefs = await response.text();

    logger.info('Retrieved API reference');

    return `📚 Script API Reference

This is the complete TypeScript API available in all scripts. All these APIs are globally available - no imports needed.

**Key Points:**
- Access parameters via \`parameters.yourParamName\`
- Always provide fallback defaults: \`parameters.speed || 0.5\`
- All APIs are in global scope (entity, time, input, math, console, etc.)
- NO export/import statements

**Full Type Definitions:**

\`\`\`typescript
${apiDefs}
\`\`\`

**Common Usage Patterns:**

1. **Using Parameters:**
\`\`\`typescript
function onUpdate(deltaTime: number): void {
  const speed = (parameters.speed as number) || 1.0;
  const direction = (parameters.direction as string) || 'forward';
  entity.transform.rotate(0, deltaTime * speed, 0);
}
\`\`\`

2. **Physics & Collisions:**
\`\`\`typescript
function onStart(): void {
  if (entity.rigidBody) {
    entity.rigidBody.setMass(2.0);
    entity.rigidBody.setGravityScale(1.0);
  }

  entity.physicsEvents?.onCollisionEnter((otherEntityId) => {
    console.log('Collided with entity:', otherEntityId);
  });
}
\`\`\`

3. **Input Handling:**
\`\`\`typescript
function onUpdate(deltaTime: number): void {
  const speed = 5.0;
  if (input.isKeyDown('w')) {
    entity.transform.translate(0, 0, -speed * deltaTime);
  }
  if (input.isKeyDown('s')) {
    entity.transform.translate(0, 0, speed * deltaTime);
  }
}
\`\`\`

4. **Creating Entities at Runtime:**
\`\`\`typescript
function onStart(): void {
  // Create a red cube
  const cubeId = gameObject.createPrimitive('cube', {
    name: 'DynamicCube',
    transform: { position: [0, 5, 0] },
    material: { color: '#ff0000' },
    physics: { body: 'dynamic', mass: 2 }
  });

  console.log('Created cube:', cubeId);
}
\`\`\``;
  } catch (error) {
    logger.error('Failed to get API reference', { error });
    return `Error getting API reference: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
