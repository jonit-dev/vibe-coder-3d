import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearCurrentPlan,
  executePlanning,
  getCurrentPlan,
} from '@editor/services/agent/tools/PlanningTool';

describe('PlanningTool', () => {
  beforeEach(() => {
    clearCurrentPlan();
  });

  it('clears the plan after all steps are completed', async () => {
    await executePlanning({
      action: 'create_plan',
      goal: 'Test goal',
      steps: [
        {
          id: 1,
          description: 'Add cube',
          tool: 'scene_manipulation',
        },
      ],
    });

    expect(getCurrentPlan()).not.toBeNull();

    const result = await executePlanning({
      action: 'update_step',
      step_id: 1,
      status: 'completed',
    });

    expect(result).toContain('Plan completed');
    expect(getCurrentPlan()).toBeNull();
  });
});
