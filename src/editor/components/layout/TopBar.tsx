import React, { useState } from 'react';
import { BiCube } from 'react-icons/bi';
import {
  FiActivity,
  FiChevronDown,
  FiCpu,
  FiFolder,
  FiImage,
  FiMessageSquare,
  FiPause,
  FiPlay,
  FiSave,
  FiSettings,
  FiSquare,
  FiTrash2,
} from 'react-icons/fi';

import { ToolbarButton } from '../shared/ToolbarButton';
import { ToolbarGroup } from '../shared/ToolbarGroup';
import { MenuBar, IMenuItem } from './MenuBar';
import { ShapeType } from '../../types/shapes';

export interface ITopBarProps {
  entityCount: number;
  onSave: () => void;
  onSaveAs: () => void;
  onLoad: () => void;
  onClear: () => void;
  onAddObject: () => void;
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
}

export const TopBar: React.FC<ITopBarProps> = ({
  entityCount,
  onSave,
  onSaveAs,
  onLoad,
  onClear,
  onAddObject,
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
}) => {
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);

  const menuItems: IMenuItem[] = [
    {
      label: 'File',
      items: [
        {
          label: 'New Scene',
          shortcut: 'Ctrl+N',
          action: onClear,
        },
        { divider: true },
        {
          label: 'Open Scene...',
          shortcut: 'Ctrl+O',
          action: onLoad,
        },
        { divider: true },
        {
          label: 'Save',
          shortcut: 'Ctrl+S',
          action: onSave,
          disabled: !currentSceneName,
        },
        {
          label: 'Save As...',
          shortcut: 'Ctrl+Shift+S',
          action: onSaveAs,
        },
        { divider: true },
        {
          label: 'Import Asset...',
          disabled: true,
        },
        {
          label: 'Export Scene...',
          disabled: true,
        },
      ],
    },
    {
      label: 'Edit',
      items: [
        {
          label: 'Undo',
          shortcut: 'Ctrl+Z',
          disabled: true,
        },
        {
          label: 'Redo',
          shortcut: 'Ctrl+Y',
          disabled: true,
        },
        { divider: true },
        {
          label: 'Cut',
          shortcut: 'Ctrl+X',
          disabled: true,
        },
        {
          label: 'Copy',
          shortcut: 'Ctrl+C',
          disabled: true,
        },
        {
          label: 'Paste',
          shortcut: 'Ctrl+V',
          disabled: true,
        },
        {
          label: 'Duplicate',
          shortcut: 'Ctrl+D',
          disabled: true,
        },
        { divider: true },
        {
          label: 'Delete',
          shortcut: 'Del',
          disabled: true,
        },
        { divider: true },
        {
          label: 'Select All',
          shortcut: 'Ctrl+A',
          disabled: true,
        },
        {
          label: 'Deselect All',
          shortcut: 'Ctrl+Shift+A',
          disabled: true,
        },
      ],
    },
    {
      label: 'Scene',
      items: [
        {
          label: 'Play',
          shortcut: 'Space',
          action: onPlay,
          disabled: isPlaying,
        },
        {
          label: 'Pause',
          action: onPause,
          disabled: !isPlaying,
        },
        {
          label: 'Stop',
          action: onStop,
        },
        { divider: true },
        {
          label: 'Clear Scene',
          action: onClear,
        },
        { divider: true },
        {
          label: 'Scene Settings',
          disabled: true,
        },
        {
          label: 'Lighting Settings',
          disabled: true,
        },
        {
          label: 'Physics Settings',
          disabled: true,
        },
      ],
    },
    {
      label: 'GameObject',
      items: [
        {
          label: 'Create Empty',
          action: () => onAddObject('Entity'),
        },
        { divider: true },
        {
          label: '3D Objects',
          submenu: [
            { label: 'Cube', action: () => onAddObject(ShapeType.Cube) },
            { label: 'Sphere', action: () => onAddObject(ShapeType.Sphere) },
            { label: 'Cylinder', action: () => onAddObject(ShapeType.Cylinder) },
            { label: 'Cone', action: () => onAddObject(ShapeType.Cone) },
            { label: 'Plane', action: () => onAddObject(ShapeType.Plane) },
            { label: 'Capsule', action: () => onAddObject(ShapeType.Capsule) },
            { label: 'Torus', action: () => onAddObject(ShapeType.Torus) },
          ],
        },
        {
          label: 'Light',
          submenu: [
            { label: 'Directional Light', action: () => onAddObject('DirectionalLight') },
            { label: 'Point Light', action: () => onAddObject('PointLight') },
            { label: 'Spot Light', action: () => onAddObject('SpotLight') },
            { label: 'Ambient Light', action: () => onAddObject('AmbientLight') },
          ],
        },
        {
          label: 'Effects',
          submenu: [
            { label: 'Particle System', disabled: true },
            { label: 'Audio Source', disabled: true },
          ],
        },
        { divider: true },
        {
          label: 'Camera',
          action: () => onAddObject(ShapeType.Camera),
        },
      ],
    },
    {
      label: 'Window',
      items: [
        {
          label: 'Chat Panel',
          shortcut: 'Ctrl+/',
          action: onToggleChat,
        },
        {
          label: 'Materials Panel',
          action: onToggleMaterials,
        },
        { divider: true },
        {
          label: 'Inspector',
          disabled: true,
        },
        {
          label: 'Hierarchy',
          disabled: true,
        },
        {
          label: 'Viewport',
          disabled: true,
        },
      ],
    },
    {
      label: 'Help',
      items: [
        {
          label: 'Documentation',
          disabled: true,
        },
        {
          label: 'Keyboard Shortcuts',
          disabled: true,
        },
        { divider: true },
        {
          label: 'Preferences...',
          shortcut: 'Ctrl+,',
          action: onOpenPreferences,
        },
        { divider: true },
        {
          label: 'About VibeEngine',
          disabled: true,
        },
      ],
    },
  ];

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
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
              <FiCpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                VibeEngine
              </h1>
              <div className="text-xs text-gray-400">v1.0.0</div>
            </div>
          </div>

          <div className="h-4 w-px bg-gray-700"></div>

          <div className="flex items-center space-x-3">
            <div className="px-2 py-1 bg-cyan-950/30 border border-cyan-800/30 rounded text-cyan-300 text-xs flex items-center space-x-1">
              <BiCube className="w-3 h-3" />
              <span>{entityCount} Objects</span>
            </div>

            <div className="px-2 py-1 bg-green-950/30 border border-green-800/30 rounded text-green-300 text-xs flex items-center space-x-1">
              <FiActivity className="w-3 h-3" />
              <span>Ready</span>
            </div>
          </div>
        </div>

        {/* Center section - Active scene and Playback controls */}
        <div className="flex items-center space-x-3">
          {/* Active scene display */}
          <div className="px-2 py-1 bg-purple-950/30 border border-purple-800/30 rounded text-purple-300 text-xs flex items-center space-x-1">
            <FiFolder className="w-3 h-3" />
            <span>Scene: {currentSceneName || 'None'}</span>
          </div>

          <div className="h-4 w-px bg-gray-700"></div>

          <ToolbarGroup>
            <ToolbarButton
              onClick={onPlay}
              disabled={isPlaying}
              variant="success"
              title="Play (Space)"
            >
              <FiPlay className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={onPause} disabled={!isPlaying} variant="warning" title="Pause">
              <FiPause className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={onStop} variant="danger" title="Stop">
              <FiSquare className="w-4 h-4" />
            </ToolbarButton>
          </ToolbarGroup>
        </div>

        {/* Right section - File operations and settings */}
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

            {/* Save dropdown group */}
            <div className="relative">
              <div className="flex">
                <ToolbarButton
                  onClick={onSave}
                  variant="primary"
                  title={
                    currentSceneName ? `Save ${currentSceneName} (Ctrl+S)` : 'Save Scene (Ctrl+S)'
                  }
                  className="rounded-r-none border-r-0"
                >
                  <FiSave className="w-4 h-4" />
                </ToolbarButton>
                <button
                  type="button"
                  onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                  className="px-1 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 hover:text-gray-200 rounded-l-none text-xs transition-colors"
                  title="Save options"
                >
                  <FiChevronDown className="w-3 h-3" />
                </button>
              </div>

              {showSaveDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-gray-900 border border-gray-700 rounded shadow-lg z-50 min-w-32">
                  <button
                    type="button"
                    onClick={() => {
                      onSave();
                      setShowSaveDropdown(false);
                    }}
                    disabled={!currentSceneName}
                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSaveAs();
                      setShowSaveDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
                  >
                    Save As...
                  </button>
                </div>
              )}
            </div>

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
      </div>

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
    </header>
  );
};
