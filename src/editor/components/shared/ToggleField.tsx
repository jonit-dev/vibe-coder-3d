import React from 'react';

export interface IToggleFieldProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  resetValue?: boolean;
  color?: 'green' | 'cyan' | 'orange' | 'purple' | 'red';
}

export const ToggleField: React.FC<IToggleFieldProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  resetValue = true,
  color = 'green',
}) => {
  const handleReset = () => {
    onChange(resetValue);
  };

  const colorClasses = {
    green: value ? 'bg-green-500' : 'bg-gray-600',
    cyan: value ? 'bg-cyan-500' : 'bg-gray-600',
    orange: value ? 'bg-orange-500' : 'bg-gray-600',
    purple: value ? 'bg-purple-500' : 'bg-gray-600',
    red: value ? 'bg-red-500' : 'bg-gray-600',
  };

  return (
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

        <button
          onClick={() => !disabled && onChange(!value)}
          disabled={disabled}
          className={`
            relative inline-flex h-5 w-8 items-center rounded-full transition-colors duration-200
            ${colorClasses[color]}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span
            className={`
              inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200
              ${value ? 'translate-x-4' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
    </div>
  );
};
