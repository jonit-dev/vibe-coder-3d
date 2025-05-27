import React from 'react';
import { FiCheck } from 'react-icons/fi';

export interface ICheckboxFieldProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  resetValue?: boolean;
  description?: string;
  color?: 'green' | 'cyan' | 'orange' | 'purple' | 'red' | 'blue';
}

export const CheckboxField: React.FC<ICheckboxFieldProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  resetValue = false,
  description,
  color = 'cyan',
}) => {
  const handleReset = () => {
    onChange(resetValue);
  };

  const colorClasses = {
    green: {
      checked: 'bg-green-500 border-green-500',
      unchecked: 'bg-gray-800 border-gray-600 hover:border-green-400',
      focus: 'ring-green-500/30',
    },
    cyan: {
      checked: 'bg-cyan-500 border-cyan-500',
      unchecked: 'bg-gray-800 border-gray-600 hover:border-cyan-400',
      focus: 'ring-cyan-500/30',
    },
    orange: {
      checked: 'bg-orange-500 border-orange-500',
      unchecked: 'bg-gray-800 border-gray-600 hover:border-orange-400',
      focus: 'ring-orange-500/30',
    },
    purple: {
      checked: 'bg-purple-500 border-purple-500',
      unchecked: 'bg-gray-800 border-gray-600 hover:border-purple-400',
      focus: 'ring-purple-500/30',
    },
    red: {
      checked: 'bg-red-500 border-red-500',
      unchecked: 'bg-gray-800 border-gray-600 hover:border-red-400',
      focus: 'ring-red-500/30',
    },
    blue: {
      checked: 'bg-blue-500 border-blue-500',
      unchecked: 'bg-gray-800 border-gray-600 hover:border-blue-400',
      focus: 'ring-blue-500/30',
    },
  };

  const currentColors = colorClasses[color];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">{label}</span>

        <div className="flex items-center space-x-2">
          <button
            className="text-[9px] text-gray-400 hover:text-cyan-300 bg-black/30 hover:bg-gray-700/50 border border-gray-600/30 hover:border-cyan-500/30 rounded-sm px-1 py-px transition-all duration-200"
            onClick={handleReset}
            disabled={disabled}
          >
            Reset
          </button>

          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => !disabled && onChange(e.target.checked)}
              disabled={disabled}
              className="sr-only"
              id={`checkbox-${label.replace(/\s+/g, '-').toLowerCase()}`}
            />
            <label
              htmlFor={`checkbox-${label.replace(/\s+/g, '-').toLowerCase()}`}
              className={`
                relative flex items-center justify-center w-4 h-4 rounded border-2 cursor-pointer transition-all duration-200 transform
                ${value ? currentColors.checked : currentColors.unchecked}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                focus-within:ring-2 ${currentColors.focus}
              `}
            >
              <FiCheck
                className={`
                  w-2.5 h-2.5 text-white transition-all duration-200 transform
                  ${value ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
                `}
              />
            </label>
          </div>
        </div>
      </div>

      {description && (
        <p className="text-[10px] text-gray-500 leading-relaxed pl-0">{description}</p>
      )}
    </div>
  );
};
