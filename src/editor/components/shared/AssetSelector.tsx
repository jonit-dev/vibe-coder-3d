import React from 'react';
import { FiEye } from 'react-icons/fi';

import { useAssetLoaderStore } from '@/editor/store/assetLoaderStore';
import { InspectorButton } from './InspectorButton';

export interface IAssetSelectorProps {
  label: string;
  value?: string;
  onChange: (assetPath: string | undefined) => void;
  placeholder?: string;
  buttonIcon?: React.ReactNode;
  buttonText?: string;
  buttonTitle?: string;
  basePath?: string;
  allowedExtensions?: string[];
  showPreview?: boolean;
}

export const AssetSelector: React.FC<IAssetSelectorProps> = ({
  label,
  value,
  onChange,
  placeholder = 'No asset selected',
  buttonIcon = <FiEye />,
  buttonText = 'Browse',
  buttonTitle = 'Browse assets',
  basePath = '/assets',
  allowedExtensions = [],
  showPreview = true,
}) => {
  const { openModal } = useAssetLoaderStore();

  const handleBrowse = () => {
    openModal({
      title: `Select ${label}`,
      basePath,
      allowedExtensions,
      showPreview,
      onSelect: onChange,
    });
  };

  return (
    <div className="space-y-0.5">
      <span className="text-[11px] font-medium text-gray-300">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex-1 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white min-h-[24px] flex items-center">
          {value ? (
            <span className="truncate text-gray-300">
              {value
                .split('/')
                .pop()
                ?.replace(/\.\w+$/i, '')}{' '}
              {/* Remove any file extension */}
            </span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <InspectorButton
          onClick={handleBrowse}
          icon={buttonIcon}
          variant="secondary"
          size="xs"
          title={buttonTitle}
        >
          {buttonText}
        </InspectorButton>
      </div>
    </div>
  );
};
