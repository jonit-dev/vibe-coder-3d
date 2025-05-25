import { useMemo } from 'react';

interface IEditorStats {
  entities: number;
  fps: number;
  memory: string;
}

interface IUseEditorStatsProps {
  entityCount: number;
  averageFPS: number | undefined;
}

export const useEditorStats = ({ entityCount, averageFPS }: IUseEditorStatsProps): IEditorStats => {
  return useMemo(
    () => ({
      entities: entityCount,
      fps: Math.round(averageFPS || 0),
      memory: '128MB', // placeholder - no memory tracking yet
    }),
    [entityCount, averageFPS],
  );
};
