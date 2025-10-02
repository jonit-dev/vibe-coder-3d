import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

export interface IPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'general' | 'graphics' | 'audio';

export const PreferencesModal: React.FC<IPreferencesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');

  if (!isOpen) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">General Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Auto-save</label>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Show tooltips</label>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Confirm before delete</label>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </div>
            </div>
          </div>
        );

      case 'graphics':
        return (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Graphics Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Anti-aliasing</label>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Shadows</label>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Show FPS counter</label>
                <input type="checkbox" className="toggle toggle-primary" />
              </div>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Audio Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 block mb-2">Master Volume</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="100"
                  className="range range-primary range-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 block mb-2">SFX Volume</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="80"
                  className="range range-primary range-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 block mb-2">Music Volume</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="60"
                  className="range range-primary range-sm"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10000]">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-200">Preferences</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Close"
          >
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 bg-gray-900 border-r border-gray-700">
            <nav className="p-2">
              {[
                { id: 'general', label: 'General' },
                { id: 'graphics', label: 'Graphics' },
                { id: 'audio', label: 'Audio' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full text-left px-4 py-2 rounded mb-1 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-cyan-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">{renderTabContent()}</div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
