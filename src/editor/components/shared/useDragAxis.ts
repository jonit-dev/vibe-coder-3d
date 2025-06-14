import { useCallback, useEffect, useRef, useState } from 'react';

import { transformSystem } from '@/core/systems/transformSystem';

export interface IUseDragAxis {
  dragActive: boolean;
  onDragStart: (e: React.MouseEvent) => void;
  cleanup: () => void;
}

export function useDragAxis(
  value: number,
  onChange: (val: number) => void,
  sensitivity: number = 0.1,
): IUseDragAxis {
  const [dragActive, setDragActive] = useState(false);
  const dragStartValueRef = useRef(value);
  const dragStartXRef = useRef(0);
  const latestOnChange = useRef(onChange);
  const latestSensitivity = useRef(sensitivity);

  useEffect(() => {
    latestOnChange.current = onChange;
    latestSensitivity.current = sensitivity;
  }, [onChange, sensitivity]);

  const handleDragMove = useCallback((e: MouseEvent) => {
    const delta = (e.clientX - dragStartXRef.current) * latestSensitivity.current;
    const next = Number((dragStartValueRef.current + delta).toFixed(2));

    latestOnChange.current(next);

    // Run transform system to update the 3D view
    transformSystem();
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragActive(false);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.body.style.userSelect = '';

    // Ensure final transform update is applied
    transformSystem();
  }, [handleDragMove]);

  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      setDragActive(true);
      dragStartValueRef.current = value;
      dragStartXRef.current = e.clientX;
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.body.style.userSelect = 'none';
    },
    [value, handleDragMove, handleDragEnd],
  );

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.body.style.userSelect = '';
    };
  }, [handleDragMove, handleDragEnd]);

  return { dragActive, onDragStart, cleanup: handleDragEnd };
}
