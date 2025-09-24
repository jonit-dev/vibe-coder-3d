import { create } from 'zustand';
import { ProjectAssetService } from '@core';

interface IAssetLoaderState {
  isOpen: boolean;
  title: string;
  basePath: string;
  allowedExtensions: string[];
  showPreview: boolean;
  onSelect?: (assetPath: string) => void;

  // Actions
  openModal: (config: {
    title: string;
    basePath?: string;
    allowedExtensions?: string[];
    showPreview?: boolean;
    onSelect: (assetPath: string) => void;
  }) => void;
  closeModal: () => void;
  selectAsset: (assetPath: string) => void;
}

export const useAssetLoaderStore = create<IAssetLoaderState>((set, get) => ({
  isOpen: false,
  title: 'Select Asset',
  basePath: ProjectAssetService.getInstance().getAssetBasePath(),
  allowedExtensions: [],
  showPreview: true,
  onSelect: undefined,

  openModal: (config) => {
    const projectAssetService = ProjectAssetService.getInstance();
    set({
      isOpen: true,
      title: config.title,
      basePath: config.basePath || projectAssetService.getAssetBasePath(),
      allowedExtensions: config.allowedExtensions || [],
      showPreview: config.showPreview ?? true,
      onSelect: config.onSelect,
    });
  },

  closeModal: () => {
    set({
      isOpen: false,
      onSelect: undefined,
    });
  },

  selectAsset: (assetPath: string) => {
    const { onSelect } = get();
    onSelect?.(assetPath);
    get().closeModal();
  },
}));
