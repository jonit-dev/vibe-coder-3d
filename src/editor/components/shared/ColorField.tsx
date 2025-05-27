import React from 'react';

export interface IColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  resetValue?: string;
  placeholder?: string;
}

export const ColorField: React.FC<IColorFieldProps> = ({
  label,
  value,
  onChange,
  resetValue = '#ffffff',
  placeholder = '#ffffff',
}) => {
  const handleReset = () => {
    onChange(resetValue);
  };

  return (
    <div className="space-y-0.5">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[11px] font-medium text-gray-300">{label}</span>
        <button
          className="text-[9px] text-gray-400 hover:text-cyan-300 bg-black/30 hover:bg-gray-700/50 border border-gray-600/30 hover:border-cyan-500/30 rounded-sm px-1 py-px transition-all duration-200"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>

      <div className="flex space-x-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 rounded border border-gray-600/30 bg-black/30 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50 focus:bg-black/50 transition-all duration-200"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};
