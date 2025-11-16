/**
 * Planning Tool
 * Allows the AI to create and manage a plan before executing actions.
 *
 * This is the primary coordination primitive for the agent:
 * - First, create a plan with high‑level, ordered steps.
 * - Then, execute tools step‑by‑step and keep this plan in sync via update_step.
 * - Finally, use get_plan to inspect progress or recover after errors.
 */

import { Logger } from '@core/lib/logger';

const logger = Logger.create('PlanningTool');

export const planningTool = {
  name: 'planning',
  description: `Create and manage an execution plan before taking actions.

MANDATORY: You MUST use this tool FIRST before executing ANY scene modifications.

PLANNING WORKFLOW:
- Start with create_plan to outline 3–10 concise, ordered steps.
- Each step MUST include the tool to call and a short description of the intended outcome.
- Use params_summary to capture key parameters (entity ids, positions, materials, etc.).
- After executing a step's tool, immediately call update_step with the final status and any notes.
- Call get_plan whenever you need to recall the current goal, progress, or remaining steps.

IMPORTANT GUIDELINES FOR ENTITY CREATION:
- Always consider material choices (color, metalness, roughness) for visual appeal
- Think about appropriate scales for objects (e.g., tables are wider than they are tall)
- Use proper rotations to orient objects correctly (e.g., planes as floors)
- Check available materials with get_available_materials before creating entities
- Create entities with thoughtful details, not just default values
- Consider the scene composition and how objects relate to each other

Actions:
- create_plan: Create a new plan with ordered steps
- update_step: Mark a step as completed or update its status
- get_plan: Get the current plan status`,
  input_schema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: ['create_plan', 'update_step', 'get_plan'],
        description: 'The planning action to perform',
      },
      goal: {
        type: 'string',
        description: 'The overall goal of the plan (for create_plan)',
      },
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Step number/ID',
            },
            description: {
              type: 'string',
              description: 'What this step will do',
            },
            tool: {
              type: 'string',
              description:
                'Which tool will be used (scene_manipulation, prefab_management, screenshot_feedback, etc.)',
            },
            params_summary: {
              type: 'string',
              description: 'Brief summary of the parameters that will be used',
            },
          },
          required: ['id', 'description', 'tool'],
        },
        description: 'Array of steps in the plan (for create_plan)',
      },
      step_id: {
        type: 'number',
        description: 'Step ID to update (for update_step)',
      },
      status: {
        type: 'string',
        enum: ['pending', 'in_progress', 'completed', 'failed'],
        description: 'New status for the step (for update_step)',
      },
      notes: {
        type: 'string',
        description: 'Additional notes about the step execution (for update_step)',
      },
    },
    required: ['action'],
  },
};

export interface IPlanStep {
  id: number;
  description: string;
  tool: string;
  params_summary?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  notes?: string;
}

export interface IPlan {
  goal: string;
  steps: IPlanStep[];
  created_at: string;
}

// Store the current plan in memory (could be moved to a store later)
let currentPlan: IPlan | null = null;

// Planning tool parameter types
export interface IPlanningParams {
  action: 'create_plan' | 'update_step' | 'get_plan';
  goal?: string;
  steps?: Omit<IPlanStep, 'status'>[];
  step_id?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
  notes?: string;
}

/**
 * Execute planning tool
 */
export async function executePlanning(params: IPlanningParams): Promise<string> {
  logger.info('Executing planning tool', { params });

  const { action, goal, steps, step_id, status, notes } = params;

  switch (action) {
    case 'create_plan':
      if (!goal || !steps || !Array.isArray(steps)) {
        return 'Error: goal and steps array are required for create_plan';
      }
      return createPlan(goal, steps);

    case 'update_step':
      if (step_id === undefined || !status) {
        return 'Error: step_id and status are required for update_step';
      }
      return updateStep(step_id, status, notes);

    case 'get_plan':
      return getPlan();

    default:
      return `Unknown action: ${action}`;
  }
}

/**
 * Validate the provided plan steps and return human‑readable warnings.
 * This is intentionally non‑fatal to preserve behavior while guiding the agent.
 */
function validatePlanSteps(steps: Omit<IPlanStep, 'status'>[]): string[] {
  const warnings: string[] = [];

  if (steps.length === 0) {
    warnings.push(
      'Plan has no steps. Consider adding at least one actionable step to make the plan useful.',
    );
  }

  const idCounts = new Map<number, number>();
  for (const step of steps) {
    const currentCount = idCounts.get(step.id) ?? 0;
    idCounts.set(step.id, currentCount + 1);
  }

  const duplicateIds = Array.from(idCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
  if (duplicateIds.length > 0) {
    warnings.push(
      `Duplicate step ids detected: ${duplicateIds.join(
        ', ',
      )}. The update_step action will only affect the first matching step for a given id.`,
    );
  }

  const stepsWithEmptyDescriptions = steps.filter(
    (step) => !step.description || step.description.trim().length === 0,
  );
  if (stepsWithEmptyDescriptions.length > 0) {
    warnings.push(
      `Some steps have empty descriptions (ids: ${stepsWithEmptyDescriptions
        .map((step) => step.id)
        .join(', ')}). Provide clear descriptions so the plan is easy to follow.`,
    );
  }

  const stepsWithEmptyTool = steps.filter((step) => !step.tool || step.tool.trim().length === 0);
  if (stepsWithEmptyTool.length > 0) {
    warnings.push(
      `Some steps have missing or empty tool names (ids: ${stepsWithEmptyTool
        .map((step) => step.id)
        .join(', ')}). Each step should specify which tool will be used.`,
    );
  }

  return warnings;
}

function createPlan(goal: string, steps: Omit<IPlanStep, 'status'>[]): string {
  const validationWarnings = validatePlanSteps(steps);

  currentPlan = {
    goal,
    steps: steps.map((step) => ({
      ...step,
      status: 'pending' as const,
    })),
    created_at: new Date().toISOString(),
  };

  logger.info('Plan created', {
    goal,
    stepCount: steps.length,
    tools: steps.map((s) => s.tool),
    hasWarnings: validationWarnings.length > 0,
  });

  if (validationWarnings.length > 0) {
    logger.warn('Plan created with validation warnings', {
      warnings: validationWarnings,
    });
  }

  // Dispatch event so UI can display the plan
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('agent:plan-created', {
        detail: currentPlan,
      }),
    );
  } else {
    logger.warn('Plan created but window is undefined; UI event agent:plan-created was not fired.');
  }

  const formattedSteps = steps
    .map(
      (step, idx) =>
        `  ${idx + 1}. ${step.description}\n     Tool: ${step.tool}${step.params_summary ? `\n     Params: ${step.params_summary}` : ''}`,
    )
    .join('\n\n');

  const warningsText =
    validationWarnings.length > 0 ? `\n\nWarnings:\n- ${validationWarnings.join('\n- ')}` : '';

  return `✓ Plan created successfully

Goal: ${goal}

Steps (${steps.length}):
${formattedSteps}

Now execute each step in order, calling update_step after each completion.${warningsText}`;
}

function updateStep(stepId: number, status: IPlanStep['status'], notes?: string): string {
  if (!currentPlan) {
    return 'Error: No active plan. Create a plan first using create_plan.';
  }

  const step = currentPlan.steps.find((s) => s.id === stepId);
  if (!step) {
    return `Error: Step ${stepId} not found in current plan`;
  }

  step.status = status as IPlanStep['status'];
  if (notes) {
    step.notes = notes;
  }

  logger.info('Step updated', { stepId, status, notes });

  // Dispatch event for UI updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('agent:plan-step-updated', {
        detail: { stepId, status, notes },
      }),
    );
  } else {
    logger.warn(
      'Plan step updated but window is undefined; UI event agent:plan-step-updated was not fired.',
      { stepId, status },
    );
  }

  const completedCount = currentPlan.steps.filter((s) => s.status === 'completed').length;
  const failedCount = currentPlan.steps.filter((s) => s.status === 'failed').length;
  const totalCount = currentPlan.steps.length;
  const allStepsCompleted = totalCount > 0 && completedCount === totalCount;
  let completionMessage = '';

  if (allStepsCompleted) {
    const completedPlan = currentPlan;
    const completionDetail = {
      goal: completedPlan.goal,
      completed_at: new Date().toISOString(),
      total_steps: totalCount,
      steps: completedPlan.steps.map((s) => ({
        id: s.id,
        description: s.description,
        status: s.status,
        notes: s.notes,
      })),
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('agent:plan-completed', {
          detail: completionDetail,
        }),
      );
    } else {
      logger.warn(
        'Plan completed but window is undefined; UI event agent:plan-completed was not fired.',
        {
          completionDetail,
        },
      );
    }

    logger.info('All plan steps completed; clearing current plan', {
      goal: completedPlan.goal,
      totalSteps: totalCount,
    });

    currentPlan = null;
    completionMessage =
      '\n\n✓ Plan completed! All steps finished and the plan was cleared. Create a new plan before executing additional changes.';
  }

  return `✓ Step ${stepId} marked as ${status}${notes ? ` - ${notes}` : ''}

Progress: ${completedCount}/${totalCount} steps completed
Failed steps: ${failedCount}/${totalCount}${completionMessage}`;
}

function getPlan(): string {
  if (!currentPlan) {
    return 'No active plan. Create one first using create_plan action.';
  }

  const formattedSteps = currentPlan.steps
    .map(
      (step) =>
        `  ${step.id}. [${step.status.toUpperCase()}] ${step.description}
     Tool: ${step.tool}${
       step.params_summary ? `\n     Params: ${step.params_summary}` : ''
     }${step.notes ? `\n     Notes: ${step.notes}` : ''}`,
    )
    .join('\n\n');

  const completedCount = currentPlan.steps.filter((s) => s.status === 'completed').length;
  const failedCount = currentPlan.steps.filter((s) => s.status === 'failed').length;
  const nextPendingStep = currentPlan.steps.find((s) => s.status === 'pending');

  return `Current Plan
Goal: ${currentPlan.goal}

Created At: ${currentPlan.created_at}

Progress: ${completedCount}/${currentPlan.steps.length} steps completed
Failed steps: ${failedCount}/${currentPlan.steps.length}${
    nextPendingStep
      ? `\nNext pending step: ${nextPendingStep.id} - ${nextPendingStep.description}`
      : ''
  }

Steps:
${formattedSteps}`;
}

/**
 * Get current plan (for external access)
 */
export function getCurrentPlan(): IPlan | null {
  return currentPlan;
}

/**
 * Clear current plan (for external access)
 */
export function clearCurrentPlan(): void {
  currentPlan = null;
  logger.info('Plan cleared');
}
