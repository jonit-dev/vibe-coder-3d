/**
 * Script Component Definition
 * Allows entities to run custom JavaScript/TypeScript code with secure access to entity properties
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { EntityId } from '../../types';
import { getStringFromHash, storeString } from '../../utils/stringHashUtils';
import { Logger } from '@/core/lib/logger';

// Script Schema
const ScriptSchema = z.object({
  code: z.string().default('').describe('User script code'),
  language: z.enum(['javascript', 'typescript']).default('javascript').describe('Script language'),
  enabled: z.boolean().default(true).describe('Enable/disable script execution'),

  // Script metadata
  scriptName: z.string().default('Script').describe('Display name for the script'),
  description: z.string().default('').describe('Script description'),

  // Execution control
  executeInUpdate: z.boolean().default(true).describe('Execute script in update loop'),
  executeOnStart: z.boolean().default(false).describe('Execute script when entity starts'),
  executeOnEnable: z.boolean().default(false).describe('Execute script when component is enabled'),

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
  parameters: z.record(z.any()).default({}).describe('Script parameters configurable from editor'),

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
    language: Types.ui8, // 0 = javascript, 1 = typescript

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

    // Timestamps
    lastModified: Types.f64,

    // Update flags
    needsCompilation: Types.ui8,
    needsExecution: Types.ui8,
  },
  serialize: (eid: EntityId, component: any) => ({
    code: getStringFromHash(component.codeHash[eid]),
    language: (component.language[eid] === 0 ? 'javascript' : 'typescript') as
      | 'javascript'
      | 'typescript',
    enabled: Boolean(component.enabled[eid]),

    scriptName: getStringFromHash(component.scriptNameHash[eid]) || 'Script',
    description: getStringFromHash(component.descriptionHash[eid]) || '',

    executeInUpdate: Boolean(component.executeInUpdate[eid]),
    executeOnStart: Boolean(component.executeOnStart[eid]),
    executeOnEnable: Boolean(component.executeOnEnable[eid]),

    maxExecutionTime: component.maxExecutionTime[eid],
    hasErrors: Boolean(component.hasErrors[eid]),
    lastErrorMessage: getStringFromHash(component.lastErrorMessageHash[eid]) || '',
    lastExecutionTime: component.lastExecutionTime[eid],
    executionCount: component.executionCount[eid],

    parameters: (() => {
      try {
        const params = getStringFromHash(component.parametersHash[eid]);
        return params ? JSON.parse(params) : {};
      } catch {
        return {};
      }
    })(),

    lastModified: component.lastModified[eid],
    compiledCode: getStringFromHash(component.compiledCodeHash[eid]) || '',
  }),
  deserialize: (eid: EntityId, data, component: any) => {
    // Core properties
    component.enabled[eid] = (data.enabled ?? true) ? 1 : 0;
    component.language[eid] = data.language === 'typescript' ? 1 : 0;

    // Execution control
    component.executeInUpdate[eid] = (data.executeInUpdate ?? true) ? 1 : 0;
    component.executeOnStart[eid] = (data.executeOnStart ?? false) ? 1 : 0;
    component.executeOnEnable[eid] = (data.executeOnEnable ?? false) ? 1 : 0;

    // Performance
    component.maxExecutionTime[eid] = data.maxExecutionTime ?? 16;
    component.hasErrors[eid] = (data.hasErrors ?? false) ? 1 : 0;
    component.lastExecutionTime[eid] = data.lastExecutionTime ?? 0;
    component.executionCount[eid] = data.executionCount ?? 0;

    // If no code is provided, initialize with default Hello World template
    const defaultCode =
      data.language === 'typescript'
        ? `// Hello World TypeScript Script
function onStart(): void {

  if (three.mesh) {
    three.material.setColor("#00ff00");
  }
}

function onUpdate(deltaTime: number): void {
  entity.transform.rotate(0, deltaTime * 0.5, 0);
}`
        : `// Hello World JavaScript Script
function onStart() {

  if (three.mesh) {
    three.material.setColor("#00ff00");
  }
}

function onUpdate(deltaTime) {
  entity.transform.rotate(0, deltaTime * 0.5, 0);
}`;

    // String properties - use provided code or default template
    const codeToStore = data.code || defaultCode;
    component.codeHash[eid] = storeString(codeToStore);
    component.scriptNameHash[eid] = storeString(data.scriptName || 'Script');
    component.descriptionHash[eid] = storeString(data.description || '');
    component.lastErrorMessageHash[eid] = storeString(data.lastErrorMessage || '');
    component.compiledCodeHash[eid] = storeString(data.compiledCode || '');

    // Parameters
    try {
      component.parametersHash[eid] = storeString(JSON.stringify(data.parameters || {}));
    } catch {
      component.parametersHash[eid] = storeString('{}');
    }

    // Timestamps
    component.lastModified[eid] = data.lastModified ?? Date.now();

    // Check if script needs compilation (flags indicate the script should be active)
    if ((data.executeOnStart ?? false) ||
        (data.executeInUpdate ?? true) ||
        (data.executeOnEnable ?? false)) {
      component.needsCompilation[eid] = 1;
    }

    // Mark for compilation if code was provided OR if script has execution flags enabled
    // Always mark new scripts with default code for compilation
    component.needsCompilation[eid] = 1;

    // Mark for execution if enabled and configured to execute on start
    component.needsExecution[eid] = data.enabled && data.executeOnStart ? 1 : 0;
  },
  onAdd: (eid: EntityId, data) => {
    logger.info(
      `Script component "${data.scriptName}" added to entity ${eid} with default Hello World code`,
    );
  },
  onRemove: (eid: EntityId) => {
    logger.info(`Script component removed from entity ${eid}`);
  },
  metadata: {
    description: 'Custom JavaScript/TypeScript scripting system with secure entity access',
    version: '1.0.0',
    tags: ['scripting', 'javascript', 'typescript', 'gameplay'],
  },
});

export type ScriptData = z.infer<typeof ScriptSchema>;
