import { useMemo } from 'react';

interface IUseEntityValidationProps {
  entityId: number;
  transform: { data: any } | null | undefined;
  isPlaying: boolean;
}

export const useEntityValidation = ({
  entityId,
  transform,
  isPlaying,
}: IUseEntityValidationProps) => {
  // Memoized validation check
  const isValid = useMemo(() => {
    return !!transform?.data;
  }, [transform?.data]);

  // Memoized entity state
  const entityState = useMemo(() => {
    return {
      id: entityId,
      exists: isValid,
      hasTransform: !!transform?.data,
      isInPhysicsMode: isPlaying,
    };
  }, [entityId, isValid, transform?.data, isPlaying]);

  return {
    isValid,
    entityState,
  };
};
