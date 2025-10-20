import React, { useMemo, useState } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiFolder } from 'react-icons/fi';

import { Modal } from './Modal';
import { GeometryPreview } from './GeometryPreview';
import { useGeometryAssets, type GeometryAssetOption } from '@/editor/hooks/useGeometryAssets';

interface IGeometryBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: GeometryAssetOption) => void;
}

const ITEMS_PER_PAGE = 12;

export const GeometryBrowserModal: React.FC<IGeometryBrowserModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const assets = useGeometryAssets();
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    assets.forEach((asset) => {
      if (asset.category) {
        cats.add(asset.category);
      }
    });
    return Array.from(cats).sort();
  }, [assets]);

  const filteredAssets = useMemo(() => {
    let filtered = assets;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((asset) => asset.category === selectedCategory);
    }

    // Filter by search query
    if (query) {
      const lower = query.toLowerCase();
      filtered = filtered.filter((asset) => {
        const haystack = [
          asset.name?.toLowerCase() ?? '',
          asset.path.toLowerCase(),
          ...(asset.tags?.map((tag) => tag.toLowerCase()) ?? []),
          asset.category?.toLowerCase() ?? '',
        ];
        return haystack.some((value) => value.includes(lower));
      });
    }

    return filtered;
  }, [assets, query, selectedCategory]);

  // Reset to first page when search changes
  useMemo(() => {
    setCurrentPage(0);
  }, [query]);

  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const paginatedAssets = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return filteredAssets.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAssets, currentPage]);

  const handleSelect = (asset: GeometryAssetOption) => {
    onSelect(asset);
    onClose();
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Geometry Assets"
      size="xl"
      bodyClassName="p-0"
      containerClassName="bg-gray-900"
    >
      {/* Search Bar and Category Filter */}
      <div className="p-4 border-b border-gray-800 bg-gray-900">
        <div className="relative mb-3">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, path, tag, or category..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500 transition-all"
          />
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                selectedCategory === null
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
              }`}
            >
              All
            </button>
            {categories.map((category) => {
              const parts = category.split('/');
              const displayName = parts.length > 1 ? `${parts[0]} › ${parts[1]}` : category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                  }`}
                >
                  <FiFolder size={12} />
                  {displayName}
                </button>
              );
            })}
          </div>
        )}

        {filteredAssets.length > 0 && (
          <div className="text-xs text-gray-400">
            Showing {paginatedAssets.length} of {filteredAssets.length} assets
            {selectedCategory && ` in ${selectedCategory}`}
          </div>
        )}
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-950 min-h-[500px]">
        {filteredAssets.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500 max-w-md">
              <FiSearch size={48} className="mx-auto mb-4 text-gray-700" />
              <p className="text-sm mb-2">
                {query ? 'No geometry assets match your search' : 'No geometry assets found'}
              </p>
              <p className="text-xs text-gray-600">
                Add <code className="px-1.5 py-0.5 bg-gray-800 rounded">.shape.json</code> files
                under <code className="px-1.5 py-0.5 bg-gray-800 rounded">src/game/geometry/</code>{' '}
                to get started.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedAssets.map((asset) => (
              <div
                key={asset.path}
                className="group bg-gray-900 border border-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5"
                onClick={() => handleSelect(asset)}
              >
                {/* 3D Preview */}
                <div className="aspect-square w-full border-b border-gray-800 group-hover:border-purple-500/50 transition-colors">
                  <GeometryPreview meta={asset.meta} className="w-full h-full" />
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-100 truncate mb-1 group-hover:text-purple-400 transition-colors">
                    {asset.name}
                  </h3>
                  {asset.category && (
                    <p className="text-xs text-purple-400 truncate mb-1 flex items-center gap-1">
                      <FiFolder size={10} />
                      {asset.category}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 truncate mb-2">{asset.path}</p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>{asset.vertexCount.toLocaleString()} verts</span>
                  </div>

                  {/* Attributes */}
                  <div className="flex gap-1 flex-wrap mb-2">
                    {asset.hasNormals && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                        N
                      </span>
                    )}
                    {asset.hasUVs && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                        UV
                      </span>
                    )}
                    {asset.hasTangents && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                        T
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {asset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {asset.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] uppercase tracking-wide bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                      {asset.tags.length > 2 && (
                        <span className="text-[10px] text-gray-500">+{asset.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-800 bg-gray-900 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Page {currentPage + 1} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <FiChevronLeft size={14} />
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              Next
              <FiChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
