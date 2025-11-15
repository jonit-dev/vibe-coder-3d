/**
 * Planning Tool
 * Allows the AI to create and manage a plan before executing actions
 */

import { Logger } from '@core/lib/logger';

const logger = Logger.create('PlanningTool');

export const planningTool = {
  name: 'planning',
  description: `Create and manage an execution plan before taking actions.

MANDATORY: You MUST use this tool FIRST before executing ANY scene modifications.

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

interface IPlanStep {
  id: number;
  description: string;
  tool: string;
  params_summary?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  notes?: string;
}

interface IPlan {
  goal: string;
  steps: IPlanStep[];
  created_at: string;
}

// Store the current plan in memory (could be moved to a store later)
let currentPlan: IPlan | null = null;

// Planning tool parameter types
interface IPlanningParams {
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

function createPlan(goal: string, steps: Omit<IPlanStep, 'status'>[]): string {
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
  });

  // Dispatch event so UI can display the plan
  window.dispatchEvent(
    new CustomEvent('agent:plan-created', {
      detail: currentPlan,
    }),
  );

  const formattedSteps = steps
    .map(
      (step, idx) =>
        `  ${idx + 1}. ${step.description}\n     Tool: ${step.tool}${step.params_summary ? `\n     Params: ${step.params_summary}` : ''}`,
    )
    .join('\n\n');

  return `✓ Plan created successfully

Goal: ${goal}

Steps (${steps.length}):
${formattedSteps}

Now execute each step in order, calling update_step after each completion.`;
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
  window.dispatchEvent(
    new CustomEvent('agent:plan-step-updated', {
      detail: { stepId, status, notes },
    }),
  );

  const completedCount = currentPlan.steps.filter((s) => s.status === 'completed').length;
  const totalCount = currentPlan.steps.length;

  return `✓ Step ${stepId} marked as ${status}${notes ? ` - ${notes}` : ''}

Progress: ${completedCount}/${totalCount} steps completed`;
}

function getPlan(): string {
  if (!currentPlan) {
    return 'No active plan. Create one first using create_plan action.';
  }

  const formattedSteps = currentPlan.steps
    .map(
      (step) =>
        `  ${step.id}. [${step.status.toUpperCase()}] ${step.description}\n     Tool: ${step.tool}${step.notes ? `\n     Notes: ${step.notes}` : ''}`,
    )
    .join('\n\n');

  const completedCount = currentPlan.steps.filter((s) => s.status === 'completed').length;

  return `Current Plan
Goal: ${currentPlan.goal}

Progress: ${completedCount}/${currentPlan.steps.length} steps completed

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
