import React from 'react';

interface IMeshRendererFieldProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
  type?: 'select' | 'checkbox' | 'text';
  options?: { value: string; label: string }[];
  disabled?: boolean;
}

export const MeshRendererField: React.FC<IMeshRendererFieldProps> = ({
  label,
  value,
  onChange,
  type = 'select',
  options = [],
  disabled = false,
}) => {
  const fieldWrapper = 'flex items-center justify-between mb-1';
  const fieldLabel = 'text-xs';
  const fieldSelect = 'select select-xs select-bordered min-h-0 h-6 py-0';
  const fieldCheckbox = 'checkbox checkbox-xs';

  if (type === 'checkbox') {
    return (
      <div className={fieldWrapper}>
        <span className={fieldLabel}>{label}</span>
        <input
          type="checkbox"
          className={fieldCheckbox}
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className={fieldWrapper}>
        <span className={fieldLabel}>{label}</span>
        <input
          className="input input-bordered input-xs w-24 h-6 py-0"
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="None (Transform)"
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className={fieldWrapper}>
      <span className={fieldLabel}>{label}</span>
      <select
        className={fieldSelect}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
