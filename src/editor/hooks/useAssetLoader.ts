import { useState } from 'react';
import { ProjectAssetService } from '@core';

interface IUseAssetLoaderProps {
  title?: string;
  basePath?: string;
  allowedExtensions?: string[];
  showPreview?: boolean;
  onSelect?: (assetPath: string) => void;
}

export const useAssetLoader = ({
  title = 'Select Asset',
  basePath,
  allowedExtensions = [],
  showPreview = true,
  onSelect,
}: IUseAssetLoaderProps = {}) => {
  // Use project-scoped base path if not provided
  const projectAssetService = ProjectAssetService.getInstance();
  const resolvedBasePath = basePath || projectAssetService.getAssetBasePath();
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleSelect = (assetPath: string) => {
    onSelect?.(assetPath);
    closeModal();
  };

  return {
    isOpen,
    openModal,
    closeModal,
    handleSelect,
    modalProps: {
      isOpen,
      onClose: closeModal,
      onSelect: handleSelect,
      title,
      basePath: resolvedBasePath,
      allowedExtensions,
      showPreview,
    },
  };
};
