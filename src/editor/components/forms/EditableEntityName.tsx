import React, { useCallback, useEffect, useRef, useState } from 'react';

import { getEntityName } from '@/core/lib/ecs';
import { useEntityManager } from '@/editor/hooks/useEntityManager';

export interface IEditableEntityNameProps {
  entityId: number;
  className?: string;
  placeholder?: string;
  onEditStart?: () => void;
  onEditEnd?: () => void;
  onDoubleClick?: () => void;
  enableDoubleClick?: boolean;
  enableClickToEdit?: boolean;
  maxLength?: number;
}

export const EditableEntityName: React.FC<IEditableEntityNameProps> = ({
  entityId,
  className = '',
  placeholder,
  onEditStart,
  onEditEnd,
  onDoubleClick,
  enableDoubleClick = false,
  enableClickToEdit = false,
  maxLength = 50,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('');
  const [originalValue, setOriginalValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const entityManager = useEntityManager();

  // Get current entity name
  const currentName = getEntityName(entityId) || `Entity ${entityId}`;

  // Update value when entity name changes externally
  useEffect(() => {
    if (!isEditing) {
      setValue(currentName);
    }
  }, [currentName, isEditing]);

  const startEditing = useCallback(() => {
    const name = getEntityName(entityId) || `Entity ${entityId}`;
    setValue(name);
    setOriginalValue(name);
    setIsEditing(true);
    onEditStart?.();
  }, [entityId, onEditStart]);

  const stopEditing = useCallback(
    (save: boolean = true) => {
      if (save && value.trim() !== originalValue) {
        const trimmedValue = value.trim();
        if (trimmedValue) {
          entityManager.updateEntityName(entityId, trimmedValue);
        }
      } else if (!save) {
        setValue(originalValue);
      }
      setIsEditing(false);
      onEditEnd?.();
    },
    [entityId, value, originalValue, onEditEnd],
  );

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        stopEditing(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        stopEditing(false);
      }
    },
    [stopEditing],
  );

  const handleBlur = useCallback(() => {
    stopEditing(true);
  }, [stopEditing]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (enableDoubleClick) {
        startEditing();
      }
      onDoubleClick?.();
    },
    [enableDoubleClick, startEditing, onDoubleClick],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (enableClickToEdit && !isEditing) {
        e.preventDefault();
        e.stopPropagation();
        startEditing();
      }
    },
    [enableClickToEdit, isEditing, startEditing],
  );

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`bg-blue-600/20 border border-blue-500/50 rounded px-1 outline-none text-inherit ${className}`}
        placeholder={placeholder}
        maxLength={maxLength}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      className={`${enableDoubleClick || enableClickToEdit ? 'cursor-pointer select-none' : ''} ${className}`}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
      title={
        enableDoubleClick ? 'Double-click to edit' : enableClickToEdit ? 'Click to edit' : undefined
      }
    >
      {currentName}
    </span>
  );
};
