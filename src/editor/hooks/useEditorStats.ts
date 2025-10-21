import { useMemo } from 'react';
import { getScriptSystemStats } from '@core/systems/ScriptSystem';

interface IEditorStats {
  entities: number;
  fps: number;
  memory: string;
  scripts?: {
    avgCompileMs: number;
    avgExecuteMs: number;
    pendingCompilations: number;
  };
}

interface IUseEditorStatsProps {
  entityCount: number;
  averageFPS: number | undefined;
}

export const useEditorStats = ({ entityCount, averageFPS }: IUseEditorStatsProps): IEditorStats => {
  return useMemo(() => {
    const scriptStats = getScriptSystemStats();

    return {
      entities: entityCount,
      fps: Math.round(averageFPS || 0),
      memory: '128MB', // placeholder - no memory tracking yet
      scripts: {
        avgCompileMs: scriptStats.compileStats.avgCompileTime,
        avgExecuteMs: scriptStats.executeStats.avgExecuteTime,
        pendingCompilations: scriptStats.pendingCompilations,
      },
    };
  }, [entityCount, averageFPS]);
};
