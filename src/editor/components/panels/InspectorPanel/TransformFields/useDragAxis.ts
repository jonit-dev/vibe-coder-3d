import { useCallback, useEffect, useRef, useState } from 'react';

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

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      const delta = (e.clientX - dragStartXRef.current) * sensitivity;
      const next = Number((dragStartValueRef.current + delta).toFixed(2));
      onChange(next);
    },
    [onChange, sensitivity],
  );

  const handleDragEnd = useCallback(() => {
    setDragActive(false);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  }, [handleDragMove]);

  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      setDragActive(true);
      dragStartValueRef.current = value;
      dragStartXRef.current = e.clientX;
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
    },
    [value, handleDragMove, handleDragEnd],
  );

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  return { dragActive, onDragStart, cleanup: handleDragEnd };
}
