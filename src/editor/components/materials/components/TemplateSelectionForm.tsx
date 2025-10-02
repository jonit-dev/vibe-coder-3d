import React from 'react';
import { FiSearch } from 'react-icons/fi';
import type { IMaterialTemplate } from '../constants/materialTemplates';
import { MaterialPreview2D } from '../MaterialPreview2D';

export interface ITemplateSelectionFormProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filteredTemplates: IMaterialTemplate[];
  selectedTemplate: string;
  onTemplateSelect: (templateId: string) => void;
}

export const TemplateSelectionForm: React.FC<ITemplateSelectionFormProps> = ({
  searchTerm,
  onSearchChange,
  filteredTemplates,
  selectedTemplate,
  onTemplateSelect,
}) => (
  <div className="flex flex-col h-full min-h-0">
    {/* Search Bar - Compact */}
    <div className="px-3 py-2 border-b border-gray-600 flex-shrink-0">
      <div className="relative">
        <FiSearch
          className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={14}
        />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-sm"
        />
      </div>
    </div>

    {/* Template Grid - Scrollable */}
    <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
      <div className="grid grid-cols-2 gap-3">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateSelect(template.id)}
            className={`p-2 border rounded text-left transition-colors ${
              selectedTemplate === template.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
            }`}
          >
            <div className="flex flex-col items-center space-y-1">
              {/* Material Preview */}
              <MaterialPreview2D
                material={template.previewMaterial}
                size={40}
                className="border border-gray-600 rounded"
              />

              {/* Template Info - Compact */}
              <div className="text-center w-full">
                <div className="font-medium text-white text-xs truncate">{template.name}</div>
                <div className="text-[10px] text-gray-400 truncate">{template.description}</div>
                <div className="text-[10px] text-gray-500">
                  {template.shader} • {template.materialType}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <div className="text-lg mb-2">No templates found</div>
          <div className="text-sm">Try a different search term</div>
        </div>
      )}
    </div>
  </div>
);
