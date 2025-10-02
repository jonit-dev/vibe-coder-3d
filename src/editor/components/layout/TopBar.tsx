import React from 'react';

import { MenuBar } from './MenuBar';
import { TopBarLogo } from './TopBarLogo';
import { TopBarStatusSection } from './TopBarStatusSection';
import { TopBarPlaybackControls } from './TopBarPlaybackControls';
import { TopBarActions } from './TopBarActions';
import { createMenuItems } from './menuConfig';
import { useSaveDropdown } from './hooks/useSaveDropdown';

export interface ITopBarProps {
  entityCount: number;
  onSave: () => void;
  onSaveAs: () => void;
  onLoad: () => void;
  onClear: () => void;
  onAddObject: (type: string, modelPath?: string) => void;
  onToggleAddMenu: () => void;
  addButtonRef?: React.RefObject<HTMLButtonElement | null>;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  onToggleMaterials?: () => void;
  isMaterialsOpen?: boolean;
  currentSceneName?: string | null;
  onOpenPreferences?: () => void;
  onCreatePrefab?: () => void;
  onBrowsePrefabs?: () => void;
}

export const TopBar: React.FC<ITopBarProps> = React.memo(
  ({
    entityCount,
    onSave,
    onSaveAs,
    onLoad,
    onClear,
    onAddObject,
    onToggleAddMenu,
    addButtonRef,
    isPlaying = false,
    onPlay,
    onPause,
    onStop,
    onToggleChat,
    isChatOpen = false,
    onToggleMaterials,
    isMaterialsOpen = false,
    currentSceneName,
    onOpenPreferences,
    onCreatePrefab,
    onBrowsePrefabs,
  }) => {
    const saveDropdown = useSaveDropdown();

    const menuItems = createMenuItems({
      onSave,
      onSaveAs,
      onLoad,
      onClear,
      onAddObject,
      onPlay,
      onPause,
      onStop,
      onToggleChat,
      onToggleMaterials,
      onOpenPreferences,
      onCreatePrefab,
      onBrowsePrefabs,
      currentSceneName,
      isPlaying,
    });

    return (
      <header className="flex flex-col bg-gradient-to-r from-[#0a0a0b] via-[#12121a] to-[#0a0a0b] border-b border-cyan-900/20 shadow-lg relative z-20">
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/5 via-purple-900/5 to-cyan-900/5 animate-pulse pointer-events-none"></div>

        {/* Menu Bar */}
        <div className="relative z-30">
          <MenuBar items={menuItems} />
        </div>

        <div className="relative z-10 flex items-center justify-between h-10 px-4 py-1">
          {/* Left section - Logo and project info */}
          <div className="flex items-center space-x-4">
            <TopBarLogo />

            <div className="h-4 w-px bg-gray-700"></div>

            <TopBarStatusSection entityCount={entityCount} currentSceneName={currentSceneName} />
          </div>

          {/* Center section - Playback controls */}
          <div className="flex items-center space-x-3">
            <div className="h-4 w-px bg-gray-700"></div>

            <TopBarPlaybackControls
              isPlaying={isPlaying}
              onPlay={onPlay}
              onPause={onPause}
              onStop={onStop}
            />
          </div>

          {/* Right section - File operations and settings */}
          <TopBarActions
            addButtonRef={addButtonRef}
            currentSceneName={currentSceneName}
            isChatOpen={isChatOpen}
            isMaterialsOpen={isMaterialsOpen}
            saveDropdownOpen={saveDropdown.isOpen}
            onAddObject={onToggleAddMenu}
            onSave={onSave}
            onSaveAs={onSaveAs}
            onLoad={onLoad}
            onClear={onClear}
            onToggleChat={onToggleChat}
            onToggleMaterials={onToggleMaterials}
            onToggleSaveDropdown={saveDropdown.toggle}
            onCloseSaveDropdown={saveDropdown.close}
          />
        </div>

        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
      </header>
    );
  },
);

TopBar.displayName = 'TopBar';
