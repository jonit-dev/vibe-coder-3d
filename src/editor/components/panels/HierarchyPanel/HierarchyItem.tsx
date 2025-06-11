import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { forwardRef } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';

import { EditableEntityName } from '@/editor/components/forms/EditableEntityName';

import { CubeIcon } from './HierarchyPanel';

export interface IHierarchyItemProps {
  id: number;
  selected: boolean;
  onSelect: (id: number, event?: React.MouseEvent) => void;
  onContextMenu: (event: React.MouseEvent, id: number) => void;
  name: string;
  depth?: number;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggleExpanded?: (id: number) => void;
  isDragOver?: boolean;
  isPartOfSelection?: boolean;
}

export const HierarchyItem = forwardRef<HTMLLIElement, IHierarchyItemProps>(
  (
    {
      id,
      selected,
      onSelect,
      onContextMenu,
      depth = 0,
      hasChildren = false,
      isExpanded = false,
      onToggleExpanded,
      isDragOver = false,
      isPartOfSelection = false,
    },
    ref,
  ) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
      useSortable({ id: id.toString() });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    const handleClick = (e: React.MouseEvent) => {
      // Only select if not editing the name
      if (!(e.target as HTMLElement).matches('input')) {
        onSelect(id, e);
      }
    };

    const handleToggleExpanded = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onToggleExpanded) {
        onToggleExpanded(id);
      }
    };

    return (
      <li
        ref={(node) => {
          setNodeRef(node);
          if (ref && typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        style={style}
        className={`relative text-xs flex items-center outline-none transition-all duration-200 rounded ${
          isDragging ? 'opacity-50 z-50' : ''
        } ${
          isDragOver
            ? 'bg-blue-600/30 border-blue-400 ring-1 ring-blue-400/50'
            : isOver
              ? 'bg-blue-600/20 border-blue-400/50'
              : ''
        } ${
          selected && !isDragOver
            ? 'bg-gray-700/60 text-gray-100 border border-gray-600/40 shadow-sm'
            : isPartOfSelection && !isDragOver
              ? 'bg-blue-700/40 text-blue-100 border border-blue-600/40'
              : !isDragOver &&
                'hover:bg-gray-800/50 text-gray-300 border border-transparent hover:border-gray-700/30'
        }`}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(e, id);
        }}
        {...attributes}
      >
        {/* Indentation for hierarchy */}
        <div style={{ width: `${depth * 16}px` }} className="flex-shrink-0 relative">
          {/* Tree line for hierarchy visualization */}
          {depth > 0 && <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-600/30"></div>}
          {depth > 0 && <div className="absolute left-2 top-1/2 w-3 h-px bg-gray-600/30"></div>}
        </div>

        {/* Expand/collapse toggle */}
        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {hasChildren && (
            <button
              onClick={handleToggleExpanded}
              className="hover:bg-gray-600/30 rounded text-gray-400 hover:text-gray-200 p-0.5"
            >
              {isExpanded ? <FiChevronDown size={10} /> : <FiChevronRight size={10} />}
            </button>
          )}
        </div>

        {/* Drag handle and content */}
        <div
          className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer flex-1 min-w-0"
          {...listeners}
        >
          <CubeIcon
            className={`${selected ? 'text-blue-300' : isPartOfSelection ? 'text-blue-400' : 'text-gray-400'} transition-colors duration-200 w-3 h-3 flex-shrink-0`}
          />
          <EditableEntityName
            entityId={id}
            enableDoubleClick={true}
            className="font-medium truncate flex-1 min-w-0"
            onDoubleClick={() => {
              // Prevent selection when double-clicking to edit
            }}
          />
          {(selected || isPartOfSelection) && (
            <div className="ml-auto flex-shrink-0 flex gap-1">
              {selected && <div className="w-1 h-1 bg-blue-400 rounded-full"></div>}
              {isPartOfSelection && !selected && (
                <div className="w-1 h-1 bg-blue-500/60 rounded-full"></div>
              )}
            </div>
          )}
        </div>
      </li>
    );
  },
);
HierarchyItem.displayName = 'HierarchyItem';
