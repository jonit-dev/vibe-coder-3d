import { useState } from 'react';

interface IUseAssetLoaderProps {
  title?: string;
  basePath?: string;
  allowedExtensions?: string[];
  showPreview?: boolean;
  onSelect?: (assetPath: string) => void;
}

export const useAssetLoader = ({
  title = 'Select Asset',
  basePath = '/assets',
  allowedExtensions = [],
  showPreview = true,
  onSelect,
}: IUseAssetLoaderProps = {}) => {
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
      basePath,
      allowedExtensions,
      showPreview,
    },
  };
};
