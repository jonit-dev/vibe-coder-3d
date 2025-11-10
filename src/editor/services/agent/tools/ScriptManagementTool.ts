/**
 * Script Management Tool
 * Allows the AI to create, edit, and manage Lua scripts for entity behavior
 */

import { Logger } from '@core/lib/logger';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';

const logger = Logger.create('ScriptManagementTool');

export const scriptManagementTool = {
  name: 'script_management',
  description: `Create and manage TypeScript scripts for entity behavior.

CRITICAL SCRIPT WRITING RULES:
- DO NOT use export/import statements (they cause "exports is not defined" errors)
- Write plain TypeScript functions: function onStart() {}, function onUpdate(deltaTime: number) {}
- Scripts execute directly in the engine's sandbox
- The transpiler will remove any export/import keywords, but avoid them

Script lifecycle methods (write as plain functions):
- function onStart(): void - Called once when entity/script loads
- function onUpdate(deltaTime: number): void - Called every frame during play mode
- function onDestroy(): void - Called when entity/script is destroyed

Available global APIs (already in scope, no imports needed):
- entity: Transform, components, hierarchy (entity.transform.rotate(), entity.transform.setPosition())
- time: Time tracking (time.time, time.deltaTime, time.frameCount)
- input: Keyboard/mouse input (input.isKeyDown('w'), input.getMousePosition())
- math: Math utilities (math.lerp(), math.clamp(), math.distance())
- console: Logging (console.log(), console.warn(), console.error())
- parameters: Script parameters from editor (parameters.speed, parameters.color)

Example script (CORRECT - no exports):
function onStart(): void {
  console.log('Entity started!');
}

function onUpdate(deltaTime: number): void {
  entity.transform.rotate(0, deltaTime * 0.5, 0);
}`,
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
        ],
        description: 'Script management action to perform',
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
export async function executeScriptManagement(params: any): Promise<string> {
  logger.info('Executing script management', { params });

  const { action, entity_id, script_name, script_id, code, parameters } = params;

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
  parameters?: Record<string, any>,
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
  parameters?: Record<string, any>,
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
function setParameters(entityId: number, parameters: Record<string, any>): string {
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
