import React from 'react';
import { FiSave, FiChevronDown } from 'react-icons/fi';
import { ToolbarButton } from '../shared/ToolbarButton';

export interface ITopBarSaveDropdownProps {
  isOpen: boolean;
  currentSceneName?: string | null;
  onToggle: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onClose: () => void;
}

export const TopBarSaveDropdown: React.FC<ITopBarSaveDropdownProps> = React.memo(
  ({ isOpen, currentSceneName, onToggle, onSave, onSaveAs, onClose }) => {
    const handleSave = () => {
      onSave();
      onClose();
    };

    const handleSaveAs = () => {
      onSaveAs();
      onClose();
    };

    return (
      <div className="relative">
        <div className="flex">
          <ToolbarButton
            onClick={onSave}
            variant="primary"
            title={currentSceneName ? `Save ${currentSceneName} (Ctrl+S)` : 'Save Scene (Ctrl+S)'}
            className="rounded-r-none border-r-0"
          >
            <FiSave className="w-4 h-4" />
          </ToolbarButton>
          <button
            type="button"
            onClick={onToggle}
            className="px-1 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 hover:text-gray-200 rounded-l-none text-xs transition-colors"
            title="Save options"
          >
            <FiChevronDown className="w-3 h-3" />
          </button>
        </div>

        {isOpen && (
          <div className="absolute top-full right-0 mt-1 bg-gray-900 border border-gray-700 rounded shadow-lg z-50 min-w-32">
            <button
              type="button"
              onClick={handleSave}
              disabled={!currentSceneName}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleSaveAs}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
            >
              Save As...
            </button>
          </div>
        )}
      </div>
    );
  },
);

TopBarSaveDropdown.displayName = 'TopBarSaveDropdown';
