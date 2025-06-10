import React from 'react';

import { useAssetLoaderStore } from '@/editor/store/assetLoaderStore';

import { AssetLoaderModal } from './AssetLoaderModal';

export const GlobalAssetLoaderModal: React.FC = () => {
  const { isOpen, title, basePath, allowedExtensions, showPreview, closeModal, selectAsset } =
    useAssetLoaderStore();

  return (
    <AssetLoaderModal
      isOpen={isOpen}
      onClose={closeModal}
      onSelect={selectAsset}
      title={title}
      basePath={basePath}
      allowedExtensions={allowedExtensions}
      showPreview={showPreview}
    />
  );
};
