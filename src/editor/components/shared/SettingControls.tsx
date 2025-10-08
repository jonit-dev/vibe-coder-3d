import React from 'react';

export interface IToggleSettingProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const ToggleSetting: React.FC<IToggleSettingProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) => {
  const id = React.useId();

  return (
    <div className="flex items-center justify-between">
      <div>
        <label htmlFor={id} className="text-sm text-gray-300 block">
          {label}
        </label>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <input
        id={id}
        type="checkbox"
        className="toggle toggle-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
    </div>
  );
};

export interface IRangeSettingProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  disabled?: boolean;
}

export const RangeSetting: React.FC<IRangeSettingProps> = ({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
  formatValue = (v) => v.toFixed(1),
  disabled = false,
}) => {
  const id = React.useId();

  return (
    <div>
      <label htmlFor={id} className="text-sm text-gray-300 block mb-2">
        {label}: {formatValue(value)}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range range-primary range-sm"
        disabled={disabled}
      />
      {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}
    </div>
  );
};

export interface INumberSettingProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  disabled?: boolean;
}

export const NumberSetting: React.FC<INumberSettingProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = '',
  disabled = false,
}) => {
  const id = React.useId();

  return (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-sm text-gray-300">
        {label}: {value}
        {unit}
      </label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input input-sm input-bordered w-24 bg-gray-700 text-gray-200"
        disabled={disabled}
      />
    </div>
  );
};
