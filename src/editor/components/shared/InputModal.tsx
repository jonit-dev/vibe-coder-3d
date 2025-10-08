import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { useInputSettings } from '@editor/hooks/useInputSettings';

export interface IInputModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'keyboard' | 'mouse' | 'actions' | 'gamepad';

export const InputModal: React.FC<IInputModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('keyboard');
  const { settings, updateSetting } = useInputSettings();

  if (!isOpen) return null;

  const handleSave = () => {
    // Settings are auto-saved via localStorage in the hook
    onClose();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'keyboard':
        return (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Keyboard Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-300 block">
                    Prevent default on arrow keys
                  </label>
                  <p className="text-xs text-gray-500">
                    Prevents browser scroll when using arrow keys
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={settings.preventDefaultArrows}
                  onChange={(e) => updateSetting('preventDefaultArrows', e.target.checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-300 block">Prevent default on space</label>
                  <p className="text-xs text-gray-500">Prevents page scroll when pressing space</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={settings.preventDefaultSpace}
                  onChange={(e) => updateSetting('preventDefaultSpace', e.target.checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-300 block">Prevent default on Tab</label>
                  <p className="text-xs text-gray-500">Keeps focus within the application</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={settings.preventDefaultTab}
                  onChange={(e) => updateSetting('preventDefaultTab', e.target.checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">
                  Key repeat delay: {settings.keyRepeatDelay}ms
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="50"
                  value={settings.keyRepeatDelay}
                  onChange={(e) => updateSetting('keyRepeatDelay', Number(e.target.value))}
                  className="input input-sm input-bordered w-24 bg-gray-700 text-gray-200"
                />
              </div>
            </div>
          </div>
        );

      case 'mouse':
        return (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Mouse Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 block mb-2">
                  Mouse Sensitivity: {settings.mouseSensitivity.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={settings.mouseSensitivity}
                  onChange={(e) => updateSetting('mouseSensitivity', Number(e.target.value))}
                  className="range range-primary range-sm"
                />
                <div className="text-xs text-gray-500 mt-1">Affects camera rotation speed</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-300 block">Invert Y-axis</label>
                  <p className="text-xs text-gray-500">Invert vertical mouse movement</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={settings.invertY}
                  onChange={(e) => updateSetting('invertY', e.target.checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-300 block">Invert X-axis</label>
                  <p className="text-xs text-gray-500">Invert horizontal mouse movement</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={settings.invertX}
                  onChange={(e) => updateSetting('invertX', e.target.checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-300 block">Smooth mouse movement</label>
                  <p className="text-xs text-gray-500">Apply smoothing to mouse delta</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={settings.smoothMouse}
                  onChange={(e) => updateSetting('smoothMouse', e.target.checked)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 block mb-2">
                  Scroll sensitivity: {settings.scrollSensitivity.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={settings.scrollSensitivity}
                  onChange={(e) => updateSetting('scrollSensitivity', Number(e.target.value))}
                  className="range range-primary range-sm"
                />
              </div>
            </div>
          </div>
        );

      case 'actions':
        return (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-200">Input Action Maps</h3>
              <button className="btn btn-sm btn-primary">+ New Action Map</button>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 space-y-3">
              <div className="text-sm text-gray-400">
                Input Action Maps allow you to bind logical actions to physical inputs (keyboard,
                mouse, gamepad). Configure them to decouple your game logic from specific input
                devices.
              </div>

              <div className="border-t border-gray-700 pt-3">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Quick Start</h4>
                <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Create an action map for your game context (e.g., "Gameplay", "UI")</li>
                  <li>Define actions (e.g., "Move", "Jump", "Fire")</li>
                  <li>Bind inputs to each action (keys, mouse buttons, axes)</li>
                  <li>Use in scripts via `input.getActionValue()` or `input.onAction()`</li>
                </ol>
              </div>

              <div className="pt-3">
                <button className="btn btn-sm btn-outline btn-primary w-full">
                  Open Input Actions Editor
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-300">Example Action Maps</h4>
              <div className="space-y-2">
                <div className="bg-gray-700 rounded p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-200">Gameplay</div>
                    <div className="text-xs text-gray-400">Move, Jump, Fire, Interact</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-xs btn-ghost">Edit</button>
                    <button className="btn btn-xs btn-ghost">Delete</button>
                  </div>
                </div>
                <div className="bg-gray-700 rounded p-3 flex items-center justify-between opacity-50">
                  <div>
                    <div className="text-sm text-gray-200">UI Navigation</div>
                    <div className="text-xs text-gray-400">Select, Cancel, Menu</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-xs btn-ghost">Edit</button>
                    <button className="btn btn-xs btn-ghost">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'gamepad':
        return (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Gamepad Settings</h3>
            <div className="space-y-4">
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-400 mb-2">
                  <span className="text-sm font-semibold">Coming Soon</span>
                </div>
                <p className="text-xs text-yellow-200/70">
                  Gamepad support is planned for a future release. You'll be able to configure Xbox,
                  PlayStation, and generic controllers here.
                </p>
              </div>

              <div className="space-y-3 opacity-50">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">Enable gamepad support</label>
                  <input type="checkbox" className="toggle toggle-primary" disabled />
                </div>
                <div>
                  <label className="text-sm text-gray-300 block mb-2">Dead zone</label>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    defaultValue="0.1"
                    className="range range-primary range-sm"
                    disabled
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">Vibration</label>
                  <input type="checkbox" className="toggle toggle-primary" disabled />
                </div>
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
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-200">Input Settings</h2>
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
                { id: 'keyboard', label: 'Keyboard' },
                { id: 'mouse', label: 'Mouse' },
                { id: 'actions', label: 'Action Maps' },
                { id: 'gamepad', label: 'Gamepad' },
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
            Close
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
