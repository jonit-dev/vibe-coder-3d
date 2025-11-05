import React from 'react';

interface IComponentDependencyWarningProps {
  /** Title of the warning (e.g., "Missing Physics Components") */
  title: string;
  /** Description text explaining what's needed */
  description: string;
  /** Button text (e.g., "Add Physics Components") */
  buttonText: string;
  /** Callback when button is clicked */
  onButtonClick: () => void;
  /** Optional footer text showing what will be added */
  footerText?: string;
  /** Icon to display (defaults to ⚠️) */
  icon?: React.ReactNode;
}

/**
 * Reusable warning component for component dependencies
 * Uses consistent yellow warning style across inspector panels
 */
export const ComponentDependencyWarning: React.FC<IComponentDependencyWarningProps> = ({
  title,
  description,
  buttonText,
  onButtonClick,
  footerText,
  icon = '⚠️',
}) => {
  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
      <div className="flex items-start space-x-2">
        <div className="text-yellow-400 text-sm">{icon}</div>
        <div className="flex-1">
          <div className="text-xs font-medium text-yellow-300 mb-1">{title}</div>
          <div className="text-xs text-yellow-200 mb-2">{description}</div>
          <button
            onClick={onButtonClick}
            className="px-3 py-1.5 text-xs font-medium bg-yellow-600 hover:bg-yellow-500 text-white rounded transition-colors"
          >
            {buttonText}
          </button>
          {footerText && <div className="text-[10px] text-yellow-400 mt-2">{footerText}</div>}
        </div>
      </div>
    </div>
  );
};
