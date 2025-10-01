import React from 'react';
import { BiCube } from 'react-icons/bi';
import { FiFolder, FiTrash2, FiSettings, FiImage, FiMessageSquare } from 'react-icons/fi';
import { ToolbarButton } from '../shared/ToolbarButton';
import { ToolbarGroup } from '../shared/ToolbarGroup';
import { TopBarSaveDropdown } from './TopBarSaveDropdown';

export interface ITopBarActionsProps {
  addButtonRef?: React.RefObject<HTMLButtonElement | null>;
  currentSceneName?: string | null;
  isChatOpen?: boolean;
  isMaterialsOpen?: boolean;
  saveDropdownOpen: boolean;
  onAddObject: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onLoad: () => void;
  onClear: () => void;
  onToggleChat?: () => void;
  onToggleMaterials?: () => void;
  onToggleSaveDropdown: () => void;
  onCloseSaveDropdown: () => void;
}

export const TopBarActions: React.FC<ITopBarActionsProps> = React.memo(
  ({
    addButtonRef,
    currentSceneName,
    isChatOpen = false,
    isMaterialsOpen = false,
    saveDropdownOpen,
    onAddObject,
    onSave,
    onSaveAs,
    onLoad,
    onClear,
    onToggleChat,
    onToggleMaterials,
    onToggleSaveDropdown,
    onCloseSaveDropdown,
  }) => {
    return (
      <div className="flex items-center space-x-1">
        <ToolbarGroup>
          <button
            ref={addButtonRef}
            onClick={onAddObject}
            className="px-2 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded text-xs font-medium flex items-center space-x-1 shadow-lg"
            title="Add Object (Ctrl+N)"
          >
            <BiCube className="w-3 h-3" />
            <span>Add</span>
          </button>

          <TopBarSaveDropdown
            isOpen={saveDropdownOpen}
            currentSceneName={currentSceneName}
            onToggle={onToggleSaveDropdown}
            onSave={onSave}
            onSaveAs={onSaveAs}
            onClose={onCloseSaveDropdown}
          />

          <ToolbarButton onClick={onLoad} variant="info" title="Load Scene">
            <FiFolder className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton onClick={onClear} variant="danger" title="Clear Scene">
            <FiTrash2 className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarButton variant="default">
          <FiSettings className="w-4 h-4" />
        </ToolbarButton>

        {onToggleMaterials && (
          <ToolbarButton
            onClick={onToggleMaterials}
            variant="primary"
            active={isMaterialsOpen}
            title="Toggle Materials Panel"
          >
            <FiImage className="w-4 h-4" />
          </ToolbarButton>
        )}

        <ToolbarButton
          onClick={onToggleChat}
          variant="primary"
          active={isChatOpen}
          title="Toggle AI Chat (Ctrl+/)"
        >
          <FiMessageSquare className="w-4 h-4" />
        </ToolbarButton>
      </div>
    );
  },
);

TopBarActions.displayName = 'TopBarActions';
