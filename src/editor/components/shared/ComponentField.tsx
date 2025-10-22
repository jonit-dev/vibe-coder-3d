import React, { ReactNode } from 'react';
import { MdDragIndicator } from 'react-icons/md';

import { useDragAxisCamera } from './useDragAxisCamera';

export interface IComponentFieldProps {
  label: string;
  type: 'number' | 'select' | 'checkbox' | 'text';
  value: unknown;
  onChange: (value: unknown) => void;
  onReset?: () => void;
  resetValue?: unknown;
  min?: number;
  max?: number;
  step?: number | string;
  options?: Array<{ value: string; label: string }>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  children?: ReactNode;
  enableDrag?: boolean;
  dragSensitivity?: number;
  dragColor?: string;
}

export const ComponentField: React.FC<IComponentFieldProps> = React.memo(
  ({
    label,
    type,
    value,
    onChange,
    onReset,
    resetValue,
    min,
    max,
    step = 0.1,
    options = [],
    disabled = false,
    placeholder,
    className = '',
    children,
    enableDrag = false,
    dragSensitivity = 0.1,
    dragColor = '#9b59b6',
  }) => {
    const handleReset = () => {
      if (onReset) {
        onReset();
      } else if (resetValue !== undefined) {
        onChange(resetValue);
      }
    };

    // Drag functionality for number inputs
    const { dragActive, onDragStart } = useDragAxisCamera(
      type === 'number' && enableDrag ? Number(value) : 0,
      onChange,
      dragSensitivity,
    );

    const renderInput = () => {
      const baseInputClasses = `w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white focus:border-cyan-400 focus:outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;

      switch (type) {
        case 'number':
          if (enableDrag) {
            return (
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  value={String(value)}
                  onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                  className={`flex-1 ${baseInputClasses}`}
                  min={min}
                  max={max}
                  step={step}
                  disabled={disabled}
                  placeholder={placeholder}
                />
                <div
                  className={`w-6 h-6 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border border-gray-600/50 rounded-sm cursor-ew-resize select-none transition-all duration-200 relative group shadow-sm ${
                    dragActive ? 'ring-1 ring-cyan-500/50 scale-105' : ''
                  }`}
                  onMouseDown={onDragStart}
                  tabIndex={0}
                  role="button"
                  aria-label={`Drag to change ${label} value`}
                  style={{ borderColor: dragColor + '50' }}
                >
                  <MdDragIndicator
                    className="text-gray-300 group-hover:text-white transition-colors duration-200"
                    size={10}
                  />
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-1.5 px-1 py-px text-[9px] bg-black/80 text-white rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 backdrop-blur-sm border border-gray-600/30 transition-opacity duration-200">
                    Drag {label}
                  </div>
                </div>
              </div>
            );
          }
          return (
            <input
              type="number"
              value={String(value)}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              className={baseInputClasses}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              placeholder={placeholder}
            />
          );

        case 'select':
          return (
            <select
              value={String(value)}
              onChange={(e) => onChange(e.target.value)}
              className={baseInputClasses}
              disabled={disabled}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );

        case 'checkbox':
          return (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`checkbox-${label.replace(/\s+/g, '-').toLowerCase()}`}
                checked={Boolean(value)}
                onChange={(e) => onChange(e.target.checked)}
                className="w-3 h-3 text-cyan-600 bg-gray-800 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2"
                disabled={disabled}
              />
              <label
                htmlFor={`checkbox-${label.replace(/\s+/g, '-').toLowerCase()}`}
                className="text-xs text-gray-300"
              >
                {placeholder || 'Enable'}
              </label>
            </div>
          );

        case 'text':
          return (
            <input
              type="text"
              value={String(value)}
              onChange={(e) => onChange(e.target.value)}
              className={baseInputClasses}
              disabled={disabled}
              placeholder={placeholder}
            />
          );

        default:
          return null;
      }
    };

    if (type === 'checkbox') {
      return (
        <div className="space-y-0.5">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[11px] font-medium text-gray-300">{label}</span>
            {(onReset || resetValue !== undefined) && (
              <button
                className="text-[9px] text-gray-400 hover:text-cyan-300 bg-black/30 hover:bg-gray-700/50 border border-gray-600/30 hover:border-cyan-500/30 rounded-sm px-1 py-px transition-all duration-200"
                onClick={handleReset}
                disabled={disabled}
              >
                Reset
              </button>
            )}
          </div>
          {renderInput()}
          {children}
        </div>
      );
    }

    return (
      <div className="space-y-0.5">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[11px] font-medium text-gray-300">{label}</span>
          {(onReset || resetValue !== undefined) && (
            <button
              className="text-[9px] text-gray-400 hover:text-cyan-300 bg-black/30 hover:bg-gray-700/50 border border-gray-600/30 hover:border-cyan-500/30 rounded-sm px-1 py-px transition-all duration-200"
              onClick={handleReset}
              disabled={disabled}
            >
              Reset
            </button>
          )}
        </div>
        {renderInput()}
        {children}
      </div>
    );
  },
);
