/**
 * Script Component Definition
 * Allows entities to run custom JavaScript/TypeScript code with secure access to entity properties
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { Logger } from '@/core/lib/logger';
import { ComponentCategory, ComponentFactory, componentRegistry } from '../../ComponentRegistry';
import { EntityId } from '../../types';
import { getStringFromHash, storeString } from '../../utils/stringHashUtils';

// BitECS component interface for Script component
export interface IScriptBitECSComponent {
  enabled: Record<number, number>;
  executeInUpdate: Record<number, number>;
  executeOnStart: Record<number, number>;
  executeOnEnable: Record<number, number>;
  maxExecutionTime: Record<number, number>;
  hasErrors: Record<number, number>;
  lastExecutionTime: Record<number, number>;
  executionCount: Record<number, number>;
  codeHash: Record<number, number>;
  scriptNameHash: Record<number, number>;
  descriptionHash: Record<number, number>;
  lastErrorMessageHash: Record<number, number>;
  parametersHash: Record<number, number>;
  compiledCodeHash: Record<number, number>;
  scriptRefHash: Record<number, number>;
  scriptPathHash: Record<number, number>;
  lastModified: Record<number, number>;
  needsCompilation: Record<number, number>;
  needsExecution: Record<number, number>;
}

// Script reference for external scripts
export const ScriptRefSchema = z.object({
  scriptId: z.string().describe('Unique script identifier (e.g., "game.player-controller")'),
  source: z.enum(['external', 'inline']).describe('Script source type'),
  path: z.string().optional().describe('Path to external script file'),
  codeHash: z.string().optional().describe('SHA-256 hash for change detection'),
  lastModified: z.number().optional().describe('Last modification timestamp'),
});

export type IScriptRef = z.infer<typeof ScriptRefSchema>;

// Script Schema
const ScriptSchema = z.object({
  code: z.string().default('').describe('User script code'),
  enabled: z.boolean().default(true).describe('Enable/disable script execution'),

  // Script metadata
  scriptName: z.string().default('Script').describe('Display name for the script'),
  description: z.string().default('').describe('Script description'),

  // External script reference
  scriptRef: ScriptRefSchema.optional().describe('Reference to external script file'),

  // Lua script path (for Rust runtime execution)
  scriptPath: z.string().optional().describe('Path to compiled .lua file for runtime execution'),

  // Execution control (simplified - scripts auto-run onStart/onUpdate during play mode)
  executeInUpdate: z.boolean().default(true).describe('[Internal] Execute script in update loop'),
  executeOnStart: z.boolean().default(true).describe('[Internal] Execute script when play starts'),
  executeOnEnable: z
    .boolean()
    .default(false)
    .describe('[Internal] Execute script when component is enabled'),

  // Performance monitoring
  maxExecutionTime: z
    .number()
    .min(1)
    .max(100)
    .default(16)
    .describe('Max execution time per frame (ms)'),

  // Runtime state (managed by system)
  hasErrors: z.boolean().default(false).describe('Script has compilation or runtime errors'),
  lastErrorMessage: z.string().default('').describe('Last error message'),
  lastExecutionTime: z.number().default(0).describe('Last execution time in ms'),
  executionCount: z.number().default(0).describe('Number of times script has executed'),

  // Parameters that can be configured in editor
  parameters: z
    .record(z.unknown())
    .default({})
    .describe('Script parameters configurable from editor'),

  // Hot reload support
  lastModified: z.number().default(0).describe('Timestamp of last modification'),
  compiledCode: z.string().default('').describe('Cached compiled version of the script'),
});

const logger = Logger.create('ScriptComponent');

// Script Component Definition
export const scriptComponent = ComponentFactory.create({
  id: 'Script',
  name: 'Script',
  category: ComponentCategory.Gameplay,
  schema: ScriptSchema,
  fields: {
    // Core properties
    enabled: Types.ui8,

    // Execution control
    executeInUpdate: Types.ui8,
    executeOnStart: Types.ui8,
    executeOnEnable: Types.ui8,

    // Performance monitoring
    maxExecutionTime: Types.f32,
    hasErrors: Types.ui8,
    lastExecutionTime: Types.f32,
    executionCount: Types.ui32,

    // String hashes for text content
    codeHash: Types.ui32,
    scriptNameHash: Types.ui32,
    descriptionHash: Types.ui32,
    lastErrorMessageHash: Types.ui32,
    parametersHash: Types.ui32,
    compiledCodeHash: Types.ui32,
    scriptRefHash: Types.ui32, // JSON serialized scriptRef
    scriptPathHash: Types.ui32, // Path to compiled .lua file

    // Timestamps
    lastModified: Types.f64,

    // Update flags
    needsCompilation: Types.ui8,
    needsExecution: Types.ui8,
  },
  serialize: (eid: EntityId, component: unknown) => {
    const scriptComponent = component as IScriptBitECSComponent;
    return {
      code: getStringFromHash(scriptComponent.codeHash[eid]),
      enabled: Boolean(scriptComponent.enabled[eid]),
      scriptName: getStringFromHash(scriptComponent.scriptNameHash[eid]) || 'Script',
      description: getStringFromHash(scriptComponent.descriptionHash[eid]) || '',
      scriptRef: (() => {
        try {
          const refStr = getStringFromHash(scriptComponent.scriptRefHash[eid]);
          return refStr ? JSON.parse(refStr) : undefined;
        } catch {
          return undefined;
        }
      })(),

      scriptPath: getStringFromHash(scriptComponent.scriptPathHash[eid]) || undefined,

      executeInUpdate: Boolean(scriptComponent.executeInUpdate[eid]),
      executeOnStart: Boolean(scriptComponent.executeOnStart[eid]),
      executeOnEnable: Boolean(scriptComponent.executeOnEnable[eid]),

      maxExecutionTime: scriptComponent.maxExecutionTime[eid],
      hasErrors: Boolean(scriptComponent.hasErrors[eid]),
      lastErrorMessage: getStringFromHash(scriptComponent.lastErrorMessageHash[eid]) || '',
      lastExecutionTime: scriptComponent.lastExecutionTime[eid],
      executionCount: scriptComponent.executionCount[eid],

      parameters: (() => {
        try {
          const params = getStringFromHash(scriptComponent.parametersHash[eid]);
          return params ? JSON.parse(params) : {};
        } catch {
          return {};
        }
      })(),

      lastModified: scriptComponent.lastModified[eid],
      compiledCode: getStringFromHash(scriptComponent.compiledCodeHash[eid]) || '',
    };
  },
  deserialize: (eid: EntityId, data: ScriptData, component: unknown) => {
    const scriptComponent = component as IScriptBitECSComponent;
    // Core properties
    scriptComponent.enabled[eid] = (data.enabled ?? true) ? 1 : 0;

    // Execution control
    scriptComponent.executeInUpdate[eid] = (data.executeInUpdate ?? true) ? 1 : 0;
    // Default to true so scripts run onStart when play begins
    scriptComponent.executeOnStart[eid] = (data.executeOnStart ?? true) ? 1 : 0;
    scriptComponent.executeOnEnable[eid] = (data.executeOnEnable ?? false) ? 1 : 0;

    // Performance
    scriptComponent.maxExecutionTime[eid] = data.maxExecutionTime ?? 16;
    scriptComponent.hasErrors[eid] = (data.hasErrors ?? false) ? 1 : 0;
    scriptComponent.lastExecutionTime[eid] = data.lastExecutionTime ?? 0;
    scriptComponent.executionCount[eid] = data.executionCount ?? 0;

    // If no code is provided, initialize with default Hello World template
    const defaultCode = `/// <reference path="./script-api.d.ts" />

// Hello World TypeScript Script
function onStart(): void {
  const meshRenderer = entity.getComponent('MeshRenderer');
  if (meshRenderer) {
    console.log('Entity has a MeshRenderer component!');
  }
}

function onUpdate(deltaTime: number): void {
  entity.transform.rotate(0, deltaTime * 0.5, 0);
}`;

    // String properties - use provided code or default template
    const codeToStore = data.code || defaultCode;
    scriptComponent.codeHash[eid] = storeString(codeToStore);
    scriptComponent.scriptNameHash[eid] = storeString(data.scriptName || 'Script');
    scriptComponent.descriptionHash[eid] = storeString(data.description || '');
    scriptComponent.lastErrorMessageHash[eid] = storeString(data.lastErrorMessage || '');
    scriptComponent.compiledCodeHash[eid] = storeString(data.compiledCode || '');

    // Script reference
    try {
      scriptComponent.scriptRefHash[eid] = data.scriptRef
        ? storeString(JSON.stringify(data.scriptRef))
        : 0;
    } catch {
      scriptComponent.scriptRefHash[eid] = 0;
    }

    // Script path (compiled .lua file for Rust runtime)
    scriptComponent.scriptPathHash[eid] = storeString(data.scriptPath || '');

    // Parameters
    try {
      scriptComponent.parametersHash[eid] = storeString(JSON.stringify(data.parameters || {}));
    } catch {
      scriptComponent.parametersHash[eid] = storeString('{}');
    }

    // Timestamps
    scriptComponent.lastModified[eid] = data.lastModified ?? Date.now();

    // Check if script needs compilation (flags indicate the script should be active)
    if (
      (data.executeOnStart ?? false) ||
      (data.executeInUpdate ?? true) ||
      (data.executeOnEnable ?? false)
    ) {
      scriptComponent.needsCompilation[eid] = 1;
    }

    // Mark for compilation if code was provided OR if script has execution flags enabled
    // Always mark new scripts with default code for compilation
    scriptComponent.needsCompilation[eid] = 1;

    // Mark for execution if enabled and configured to execute on start
    scriptComponent.needsExecution[eid] = data.enabled && data.executeOnStart ? 1 : 0;
  },
  onAdd: (eid: EntityId, data: ScriptData) => {
    logger.info(
      `Script component "${data.scriptName}" added to entity ${eid} with default Hello World code`,
    );

    // In development, auto-create an external script file when the component is first added
    // to ensure scripts are not dumped inline on scene save. Skip if already external.
    try {
      // Only run in browser/dev environments where the script API is available
      // Guards protect tests and SSR contexts
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const isBrowser = typeof window !== 'undefined' && typeof fetch !== 'undefined';
      const isDev = Boolean(import.meta.env?.DEV);

      if (!isBrowser || !isDev) {
        return;
      }

      // If caller provided an external reference already, do nothing
      if (data?.scriptRef && data.scriptRef.source === 'external') {
        return;
      }

      // Async fire-and-forget to avoid blocking ECS pipeline
      (async () => {
        try {
          const code = typeof data?.code === 'string' ? data.code : '';

          // Build a stable script ID: entity-<eid>.<sanitized-script-name>
          const scriptName =
            typeof data?.scriptName === 'string' && data.scriptName.trim() !== ''
              ? data.scriptName
              : 'Script';
          const sanitized = scriptName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
          const scriptId = `entity-${eid}.${sanitized || 'script'}`;

          // Save file via Script API
          const resp = await fetch('/api/script/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: scriptId,
              code,
              description: `Auto-generated script for ${scriptName}`,
            }),
          });

          const result = await resp.json();
          if (!result?.success) {
            logger.warn(
              'Failed to auto-create external script on add:',
              result?.error || 'unknown error',
            );
            return;
          }

          // Update component with external scriptRef so serializers strip inline code
          const ref = {
            scriptId,
            source: 'external' as const,
            path: result.path as string | undefined,
            codeHash: result.hash as string | undefined,
            lastModified: Date.now(),
          };

          // Persist to ECS storage
          try {
            void (scriptComponent as unknown as { fields?: unknown }).fields; // access ensures bundlers keep component reference
          } catch {
            // no-op
          }

          try {
            componentRegistry.updateComponent(eid, 'Script', {
              scriptRef: ref,
              lastModified: Date.now(),
            });
          } catch (err) {
            logger.warn('Failed to persist external scriptRef to ECS:', err);
          }
        } catch (err) {
          logger.warn('Auto-create external script failed:', err);
        }
      })();
    } catch (err) {
      logger.warn('Skipped auto-create external script due to environment:', err);
    }
  },
  onRemove: (eid: EntityId) => {
    logger.info(`Script component removed from entity ${eid}`);
  },
  metadata: {
    description: 'Custom TypeScript scripting system with secure entity access',
    version: '1.0.0',
    tags: ['scripting', 'typescript', 'gameplay'],
  },
});

export type ScriptData = z.infer<typeof ScriptSchema>;
