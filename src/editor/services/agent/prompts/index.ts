/**
 * Prompt Builder - Composes AI prompts from markdown templates
 *
 * Benefits:
 * - Cleaner separation of concerns (code vs. prompt engineering)
 * - Easier to maintain and version prompts
 * - Better context engineering for LLMs
 * - Enables A/B testing of different prompt strategies
 */

import systemBasePrompt from './system-base.md?raw';
import planningWorkflowPrompt from './planning-workflow.md?raw';
import toolSelectionPrompt from './tool-selection.md?raw';
import materialsColorsPrompt from './materials-colors.md?raw';
import screenshotVerificationPrompt from './screenshot-verification.md?raw';
import screenshotAnalysisPrompt from './screenshot-analysis-instructions.md?raw';

interface IPromptContext {
  projectRoot: string;
  currentScene: string | null;
  selectedEntities: number[];
  shapesInfo: string;
}

interface IScreenshotContext {
  entityCount: number;
}

/**
 * Replaces template variables in prompt text
 */
function interpolate(template: string, variables: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Builds the main system prompt from modular components
 */
export function buildSystemPrompt(context: IPromptContext): string {
  const selectedEntitiesText =
    context.selectedEntities.length > 0 ? context.selectedEntities.join(', ') : 'None';

  const basePrompt = interpolate(systemBasePrompt, {
    projectRoot: context.projectRoot,
    currentScene: context.currentScene || 'None',
    selectedEntities: selectedEntitiesText,
    shapesInfo: context.shapesInfo,
  });

  // Compose full system prompt from modular sections
  return [
    basePrompt,
    '',
    planningWorkflowPrompt,
    '',
    toolSelectionPrompt,
    '',
    materialsColorsPrompt,
    '',
    screenshotVerificationPrompt,
  ].join('\n');
}

/**
 * Builds screenshot analysis instructions with dynamic context
 */
export function buildScreenshotAnalysisInstructions(
  result: string,
  context: IScreenshotContext,
): string {
  const instructions = interpolate(screenshotAnalysisPrompt, {
    entityCount: context.entityCount,
  });

  return `${result}\n\n${instructions}`;
}
