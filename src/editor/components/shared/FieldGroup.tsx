import React, { ReactNode } from 'react';

export interface IFieldGroupProps {
  label?: string;
  children: ReactNode;
  className?: string;
}

export const FieldGroup: React.FC<IFieldGroupProps> = ({ label, children, className = '' }) => {
  if (!label) {
    return <div className={`space-y-1 ${className}`}>{children}</div>;
  }

  return (
    <div className={`space-y-0.5 ${className}`}>
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[11px] font-medium text-gray-300">{label}</span>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
};
