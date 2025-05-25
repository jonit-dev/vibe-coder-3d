import { useCallback, useEffect, useState } from 'react';

type GizmoMode = 'translate' | 'rotate' | 'scale';

interface IUseGizmoInteractionProps {
  selected: boolean;
  setGizmoMode?: (mode: GizmoMode) => void;
  setIsTransforming?: (isTransforming: boolean) => void;
}

export const useGizmoInteraction = ({
  selected,
  setGizmoMode,
  setIsTransforming,
}: IUseGizmoInteractionProps) => {
  const [isTransformingLocal, setIsTransformingLocal] = useState(false);

  // Memoized transform changing handler
  const handleSetIsTransforming = useCallback(
    (val: boolean) => {
      setIsTransformingLocal(val);
      if (setIsTransforming) setIsTransforming(val);
    },
    [setIsTransforming],
  );

  // Keyboard shortcuts for gizmo modes
  useEffect(() => {
    if (!selected || !setGizmoMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W') setGizmoMode('translate');
      else if (e.key === 'e' || e.key === 'E') setGizmoMode('rotate');
      else if (e.key === 'r' || e.key === 'R') setGizmoMode('scale');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, setGizmoMode]);

  return {
    isTransformingLocal,
    handleSetIsTransforming,
  };
};
