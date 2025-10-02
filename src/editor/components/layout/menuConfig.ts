import { IMenuItem } from './MenuBar';
import { ShapeType } from '@editor/types/shapes';
import { GAME_OBJECT_CATEGORIES } from '@editor/config/gameObjectMenuData';

export interface IMenuConfig {
  onSave: () => void;
  onSaveAs: () => void;
  onLoad: () => void;
  onClear: () => void;
  onAddObject: (type?: string) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onToggleChat?: () => void;
  onToggleMaterials?: () => void;
  onOpenPreferences?: () => void;
  onCreatePrefab?: () => void;
  onBrowsePrefabs?: () => void;
  currentSceneName?: string | null;
  isPlaying?: boolean;
}

export const createMenuItems = (config: IMenuConfig): IMenuItem[] => {
  const {
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
    isPlaying = false,
  } = config;

  return [
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
        // Convert shared categories to menu items
        ...GAME_OBJECT_CATEGORIES.filter((cat) => cat.label !== 'Assets').map((category) => ({
          label: category.label,
          icon: category.icon,
          submenu: category.items.map((item) => ({
            label: item.label,
            icon: item.icon,
            action: () => onAddObject(item.type),
          })),
        })),
        { divider: true },
        {
          label: 'Camera',
          action: () => onAddObject(ShapeType.Camera),
        },
        { divider: true },
        {
          label: 'Prefab',
          submenu: [
            {
              label: 'Create from Selection',
              action: onCreatePrefab,
              disabled: !onCreatePrefab,
            },
            {
              label: 'Browse Prefabs...',
              action: onBrowsePrefabs,
              disabled: !onBrowsePrefabs,
            },
          ],
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
      ],
    },
    {
      label: 'Help',
      items: [
        {
          label: 'Preferences...',
          shortcut: 'Ctrl+,',
          action: onOpenPreferences,
        },
      ],
    },
  ];
};
