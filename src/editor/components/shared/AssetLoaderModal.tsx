import React, { useEffect, useMemo, useState } from 'react';
import {
  FiArrowUp,
  FiFile,
  FiFolder,
  FiImage,
  FiSearch,
  FiX,
  FiBox,
  FiVolume2,
} from 'react-icons/fi';
import { scanAssetsDirectory } from '@/utils/assetScanner';
import { Model3DPreview } from './Model3DPreview';
import { AudioPreview } from './AudioPreview';

interface IAssetFile {
  name: string;
  path: string;
  type: 'file' | 'folder';
  extension?: string;
}

interface IAssetLoaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assetPath: string) => void;
  title?: string;
  basePath?: string;
  allowedExtensions?: string[];
  showPreview?: boolean;
}

export const AssetLoaderModal: React.FC<IAssetLoaderModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Select Asset',
  basePath = '/assets',
  allowedExtensions = [],
  showPreview = true,
}) => {
  const [currentPath, setCurrentPath] = useState(basePath);
  const [assets, setAssets] = useState<IAssetFile[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const [previewType, setPreviewType] = useState<'image' | '3d' | 'audio' | 'none'>('none');

  // Dynamic asset discovery function that scans the actual filesystem
  const discoverAssets = async (path: string): Promise<IAssetFile[]> => {
    setLoading(true);
    try {
      return await scanAssetsDirectory(path);
    } finally {
      setLoading(false);
    }
  };

  // Load assets for current path
  useEffect(() => {
    if (isOpen) {
      discoverAssets(currentPath).then(setAssets);
    }
  }, [currentPath, isOpen]);

  // Reset state when modal opens and set initial path
  useEffect(() => {
    if (isOpen) {
      setCurrentPath(basePath); // Start at the specified basePath
      setSearchTerm('');
      setSelectedAsset('');
      setPreviewUrl('');
      setPreviewError(false);
      setPreviewType('none');
    }
  }, [isOpen, basePath]);

  // Filter and search assets
  const filteredAssets = useMemo(() => {
    let filtered = assets.filter((asset) => {
      // Always show folders for navigation
      if (asset.type === 'folder') return true;

      // If no extensions specified, show all files
      if (allowedExtensions.length === 0) return true;

      // Strict filtering: only show files with allowed extensions
      const fileExtension = asset.extension?.toLowerCase();

      // Normalize extensions - remove dots if present
      const normalizedAllowedExtensions = allowedExtensions.map((ext) =>
        ext.toLowerCase().replace(/^\./, ''),
      );

      const matches = fileExtension && normalizedAllowedExtensions.includes(fileExtension);

      return matches;
    });

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((asset) =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    return filtered;
  }, [assets, allowedExtensions, searchTerm]);

  // Count files for better user feedback
  const fileCount = filteredAssets.filter((asset) => asset.type === 'file').length;

  const handleAssetClick = (asset: IAssetFile) => {
    if (asset.type === 'folder') {
      setCurrentPath(asset.path);
      setSelectedAsset('');
      setPreviewUrl('');
      setPreviewError(false);
      setPreviewType('none');
      setSearchTerm(''); // Clear search when navigating
    } else {
      setSelectedAsset(asset.path);
      setPreviewError(false);

      if (showPreview && asset.extension) {
        const ext = asset.extension.toLowerCase();

        // Check for image extensions
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
          setPreviewUrl(asset.path);
          setPreviewType('image');
        }
        // Check for 3D model extensions
        else if (['gltf', 'glb'].includes(ext)) {
          setPreviewUrl(asset.path);
          setPreviewType('3d');
        }
        // Check for audio extensions
        else if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)) {
          setPreviewUrl(asset.path);
          setPreviewType('audio');
        }
        // No preview available for other file types
        else {
          setPreviewUrl('');
          setPreviewType('none');
        }
      } else {
        setPreviewUrl('');
        setPreviewType('none');
      }
    }
  };

  const handleGoUp = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    if (pathParts.length > 1) {
      pathParts.pop();
      setCurrentPath('/' + pathParts.join('/'));
      setSearchTerm(''); // Clear search when navigating
    }
  };

  const handleSelect = () => {
    if (selectedAsset) {
      onSelect(selectedAsset);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedAsset('');
    setPreviewUrl('');
    setPreviewError(false);
    setPreviewType('none');
    setSearchTerm('');
    setCurrentPath(basePath);
    onClose();
  };

  const getBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'assets', path: '/assets' }];

    let currentBreadcrumbPath = '/assets';
    for (let i = 1; i < parts.length; i++) {
      currentBreadcrumbPath += '/' + parts[i];
      breadcrumbs.push({ name: parts[i], path: currentBreadcrumbPath });
    }

    return breadcrumbs;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[110]">
      <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md border border-gray-700/50 rounded-lg w-[480px] max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800/70 to-gray-700/70 border-b border-cyan-500/30 px-4 py-3 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
              <h3 className="text-sm font-semibold text-cyan-400">{title}</h3>
            </div>
            <button
              onClick={handleCancel}
              className="w-6 h-6 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-sm transition-all duration-200 flex items-center justify-center"
            >
              <FiX size={14} />
            </button>
          </div>
        </div>

        {/* Navigation & Search */}
        <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700/30">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-xs text-gray-300 mb-2">
            {getBreadcrumbs().map((breadcrumb, index) => (
              <React.Fragment key={breadcrumb.path}>
                {index > 0 && <span className="text-gray-500">/</span>}
                <button
                  onClick={() => {
                    setCurrentPath(breadcrumb.path);
                    setSearchTerm('');
                  }}
                  className="hover:text-cyan-400 transition-colors font-mono"
                >
                  {breadcrumb.name}
                </button>
              </React.Fragment>
            ))}
            {currentPath !== basePath && (
              <>
                <span className="mx-2 text-gray-500">|</span>
                <button
                  onClick={handleGoUp}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  <FiArrowUp size={12} />
                  Up
                </button>
              </>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <FiSearch
              className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
              size={12}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assets..."
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 min-h-0">
          {/* Asset List */}
          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="text-center text-gray-400 py-8 text-xs">
                <div className="animate-pulse">Loading assets...</div>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-xs">
                {searchTerm ? (
                  <div>
                    <div>No assets found matching "{searchTerm}"</div>
                    {allowedExtensions.length > 0 && (
                      <div className="mt-1 text-[10px] text-gray-500">
                        Only showing {allowedExtensions.join(', ')} files
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {allowedExtensions.length > 0 ? (
                      <div>
                        <div>No {allowedExtensions.join(', ')} files found in this folder</div>
                        <div className="mt-1 text-[10px] text-gray-500">
                          Navigate to a folder containing {allowedExtensions.join(' or ')} files
                        </div>
                      </div>
                    ) : (
                      'No assets found in this folder'
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.path}
                    onClick={() => handleAssetClick(asset)}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all duration-200 ${
                      selectedAsset === asset.path
                        ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/30'
                        : 'hover:bg-gray-700/50 text-gray-200 border border-transparent hover:border-gray-600/30'
                    }`}
                  >
                    {asset.type === 'folder' ? (
                      <FiFolder className="text-yellow-400 flex-shrink-0" size={14} />
                    ) : (
                      <FiFile
                        className={`flex-shrink-0 ${
                          allowedExtensions.length > 0 &&
                          asset.extension &&
                          allowedExtensions
                            .map((ext) => ext.toLowerCase().replace(/^\./, ''))
                            .includes(asset.extension.toLowerCase())
                            ? 'text-green-400'
                            : 'text-blue-400'
                        }`}
                        size={14}
                      />
                    )}
                    <span className="flex-1 truncate text-xs">{asset.name}</span>
                    {asset.extension && (
                      <span
                        className={`text-[10px] uppercase font-mono px-1 py-0.5 rounded ${
                          allowedExtensions.length > 0 &&
                          allowedExtensions
                            .map((ext) => ext.toLowerCase().replace(/^\./, ''))
                            .includes(asset.extension.toLowerCase())
                            ? 'text-green-400 bg-green-900/20 border border-green-500/20'
                            : 'text-gray-400 bg-gray-800/50'
                        }`}
                      >
                        {asset.extension}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="w-40 border-l border-gray-700/30 bg-gray-900/30 flex flex-col">
              <div className="p-2 border-b border-gray-700/30">
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                  {previewType === '3d' ? (
                    <FiBox size={10} />
                  ) : previewType === 'audio' ? (
                    <FiVolume2 size={10} />
                  ) : (
                    <FiImage size={10} />
                  )}
                  {previewType === '3d'
                    ? '3D Preview'
                    : previewType === 'audio'
                      ? 'Audio Preview'
                      : 'Preview'}
                </div>
              </div>
              <div className="flex-1 p-2">
                {previewUrl ? (
                  <div className="h-full">
                    {previewType === '3d' ? (
                      <Model3DPreview modelPath={previewUrl} className="h-full" />
                    ) : previewType === 'audio' ? (
                      <AudioPreview audioPath={previewUrl} className="h-full" />
                    ) : (
                      <div className="bg-gray-800/50 rounded-md p-2 h-full flex items-center justify-center border border-gray-700/30">
                        {!previewError ? (
                          <img
                            src={previewUrl}
                            alt="Asset preview"
                            className="max-h-full max-w-full object-contain rounded-sm"
                            onError={() => setPreviewError(true)}
                            onLoad={() => setPreviewError(false)}
                          />
                        ) : (
                          <div className="text-center text-gray-500 text-[10px]">
                            <FiFile size={20} className="mx-auto mb-1 opacity-50" />
                            Preview unavailable
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center text-gray-500 text-[10px]">
                    {selectedAsset ? (
                      <div>
                        <FiFile size={20} className="mx-auto mb-1 opacity-50" />
                        No preview available
                      </div>
                    ) : (
                      <div>Select an asset to preview</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-700/30 bg-gray-800/30">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] text-gray-400 font-mono">
              {selectedAsset ? (
                <span className="text-cyan-400">Selected: {selectedAsset.split('/').pop()}</span>
              ) : (
                'Select an asset to continue'
              )}
            </div>
            {allowedExtensions.length > 0 && (
              <div className="text-[10px] text-gray-500">
                Showing: {allowedExtensions.join(', ')} files
                {fileCount > 0 && ` (${fileCount} found)`}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-md transition-colors border border-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedAsset}
              className="flex-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded-md transition-colors border border-cyan-500/30 disabled:border-gray-600"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
