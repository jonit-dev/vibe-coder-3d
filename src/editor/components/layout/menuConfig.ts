import { IMenuItem } from './MenuBar';
import { ShapeType } from '@editor/types/shapes';

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
        { divider: true },
        {
          label: 'Create Prefab from Selection',
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
        {
          label: 'Prefabs Panel',
          disabled: true,
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
};
