import React, { useState } from 'react';
import { FiX, FiPlus, FiTrash2, FiEdit2, FiCopy } from 'react-icons/fi';
import { useCurrentAsset, useInputStore } from '@editor/store/inputStore';
import { IActionMap, IInputAction, IBinding } from '@core/lib/input/inputTypes';
import { ActionMapDialog, ActionDialog, BindingDialog } from './InputDialogs';

export interface IInputSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InputSettingsModal: React.FC<IInputSettingsModalProps> = ({ isOpen, onClose }) => {
  const currentAsset = useCurrentAsset();
  const store = useInputStore();

  const [selectedActionMap, setSelectedActionMap] = useState<string | null>(
    currentAsset?.actionMaps[0]?.name ?? null
  );
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  // Dialog states
  const [showActionMapDialog, setShowActionMapDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showBindingDialog, setShowBindingDialog] = useState(false);
  const [editingActionMap, setEditingActionMap] = useState<IActionMap | null>(null);
  const [editingAction, setEditingAction] = useState<IInputAction | null>(null);
  const [editingBindingIndex, setEditingBindingIndex] = useState<number | null>(null);

  if (!isOpen || !currentAsset) return null;

  const actionMap = currentAsset.actionMaps.find((m) => m.name === selectedActionMap);
  const action = actionMap?.actions.find((a) => a.name === selectedAction);

  // Action Map handlers
  const handleAddActionMap = () => {
    setEditingActionMap(null);
    setShowActionMapDialog(true);
  };

  const handleEditActionMap = (map: IActionMap) => {
    setEditingActionMap(map);
    setShowActionMapDialog(true);
  };

  const handleDeleteActionMap = (mapName: string) => {
    if (confirm(`Delete action map "${mapName}"?`)) {
      store.removeActionMap(currentAsset.name, mapName);
      if (selectedActionMap === mapName) {
        setSelectedActionMap(currentAsset.actionMaps[0]?.name ?? null);
        setSelectedAction(null);
      }
    }
  };

  // Action handlers
  const handleAddAction = () => {
    if (!selectedActionMap) return;
    setEditingAction(null);
    setShowActionDialog(true);
  };

  const handleEditAction = (act: IInputAction) => {
    setEditingAction(act);
    setShowActionDialog(true);
  };

  const handleDeleteAction = (actionName: string) => {
    if (!selectedActionMap) return;
    if (confirm(`Delete action "${actionName}"?`)) {
      store.removeAction(currentAsset.name, selectedActionMap, actionName);
      if (selectedAction === actionName) {
        setSelectedAction(null);
      }
    }
  };

  // Binding handlers
  const handleAddBinding = () => {
    if (!selectedAction) return;
    setEditingBindingIndex(null);
    setShowBindingDialog(true);
  };

  const handleEditBinding = (index: number) => {
    setEditingBindingIndex(index);
    setShowBindingDialog(true);
  };

  const handleDuplicateBinding = (binding: IBinding) => {
    if (!selectedActionMap || !selectedAction || !action) return;
    const updatedAction = {
      ...action,
      bindings: [...action.bindings, binding],
    };
    store.updateAction(currentAsset.name, selectedActionMap, selectedAction, updatedAction);
  };

  const handleDeleteBinding = (index: number) => {
    if (!selectedActionMap || !selectedAction || !action) return;
    if (confirm('Delete this binding?')) {
      const updatedAction = {
        ...action,
        bindings: action.bindings.filter((_, i) => i !== index),
      };
      store.updateAction(currentAsset.name, selectedActionMap, selectedAction, updatedAction);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10000]">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-200">Input Settings</h2>
            <p className="text-sm text-gray-400 mt-1">
              Configure input actions, bindings, and control schemes
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Close"
          >
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content - 3 Column Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Column - Action Maps */}
          <div className="w-56 bg-gray-900 border-r border-gray-700 flex flex-col">
            <div className="p-3 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300">Action Maps</h3>
              <button
                onClick={handleAddActionMap}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Add Action Map"
              >
                <FiPlus className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {currentAsset.actionMaps.map((map) => (
                <ActionMapItem
                  key={map.name}
                  map={map}
                  isSelected={selectedActionMap === map.name}
                  onClick={() => {
                    setSelectedActionMap(map.name);
                    setSelectedAction(null);
                  }}
                  onEdit={() => handleEditActionMap(map)}
                  onDelete={() => handleDeleteActionMap(map.name)}
                />
              ))}
            </div>
          </div>

          {/* Middle Column - Actions */}
          <div className="w-72 bg-gray-850 border-r border-gray-700 flex flex-col">
            <div className="p-3 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300">
                {actionMap ? `Actions (${actionMap.actions.length})` : 'Actions'}
              </h3>
              <button
                onClick={handleAddAction}
                className="p-1 hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Add Action"
                disabled={!actionMap}
              >
                <FiPlus className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {actionMap?.actions.map((act) => (
                <ActionItem
                  key={act.name}
                  action={act}
                  isSelected={selectedAction === act.name}
                  onClick={() => setSelectedAction(act.name)}
                  onEdit={() => handleEditAction(act)}
                  onDelete={() => handleDeleteAction(act.name)}
                />
              ))}
              {!actionMap && (
                <div className="text-center text-gray-500 text-sm mt-8">
                  Select an Action Map
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Properties */}
          <div className="flex-1 bg-gray-800 overflow-y-auto">
            {action ? (
              <ActionProperties
                action={action}
                onAddBinding={handleAddBinding}
                onEditBinding={handleEditBinding}
                onDuplicateBinding={handleDuplicateBinding}
                onDeleteBinding={handleDeleteBinding}
              />
            ) : selectedActionMap ? (
              <ActionMapProperties actionMap={actionMap!} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select an Action Map or Action to view properties
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            Asset: <span className="text-gray-300 font-medium">{currentAsset.name}</span>
          </div>
          <div className="flex gap-3">
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

      {/* Action Map Dialog */}
      {showActionMapDialog && (
        <ActionMapDialog
          actionMap={editingActionMap}
          assetName={currentAsset.name}
          onClose={() => {
            setShowActionMapDialog(false);
            setEditingActionMap(null);
          }}
        />
      )}

      {/* Action Dialog */}
      {showActionDialog && selectedActionMap && (
        <ActionDialog
          action={editingAction}
          assetName={currentAsset.name}
          mapName={selectedActionMap}
          onClose={() => {
            setShowActionDialog(false);
            setEditingAction(null);
          }}
        />
      )}

      {/* Binding Dialog */}
      {showBindingDialog && selectedActionMap && selectedAction && action && (
        <BindingDialog
          binding={editingBindingIndex !== null ? action.bindings[editingBindingIndex] : null}
          assetName={currentAsset.name}
          mapName={selectedActionMap}
          actionName={selectedAction}
          action={action}
          onClose={() => {
            setShowBindingDialog(false);
            setEditingBindingIndex(null);
          }}
        />
      )}
    </div>
  );
};

// Action Map Item Component
interface IActionMapItemProps {
  map: IActionMap;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ActionMapItem: React.FC<IActionMapItemProps> = ({
  map,
  isSelected,
  onClick,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      className={`p-2 mb-1 rounded transition-colors group ${
        isSelected ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-800'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
          <div className="text-sm font-medium truncate">{map.name}</div>
          <div className="text-xs opacity-75">
            {map.actions.length} action{map.actions.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          {map.enabled && <div className="w-2 h-2 bg-green-400 rounded-full"></div>}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-700 rounded transition-all"
            title="Edit"
          >
            <FiEdit2 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-700 rounded transition-all"
            title="Delete"
          >
            <FiTrash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Action Item Component
interface IActionItemProps {
  action: IInputAction;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ActionItem: React.FC<IActionItemProps> = ({
  action,
  isSelected,
  onClick,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      className={`p-2 mb-1 rounded transition-colors group ${
        isSelected ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
          <div className="text-sm font-medium truncate">{action.name}</div>
          <div className="text-xs opacity-75">
            {action.controlType} • {action.bindings.length} binding
            {action.bindings.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          {action.enabled && <div className="w-2 h-2 bg-green-400 rounded-full"></div>}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-700 rounded transition-all"
            title="Edit"
          >
            <FiEdit2 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-700 rounded transition-all"
            title="Delete"
          >
            <FiTrash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Action Map Properties Component
interface IActionMapPropertiesProps {
  actionMap: IActionMap;
}

const ActionMapProperties: React.FC<IActionMapPropertiesProps> = ({ actionMap }) => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Action Map Properties</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 block mb-2">Name</label>
            <input
              type="text"
              value={actionMap.name}
              className="w-full px-3 py-2 bg-gray-700 text-gray-200 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
              readOnly
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">Enabled</label>
            <input
              type="checkbox"
              checked={actionMap.enabled}
              className="toggle toggle-primary"
              readOnly
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 block mb-2">Actions ({actionMap.actions.length})</label>
            <div className="bg-gray-900 rounded p-3 space-y-1">
              {actionMap.actions.map((action) => (
                <div key={action.name} className="text-sm text-gray-400">
                  • {action.name} ({action.controlType})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Action Properties Component
interface IActionPropertiesProps {
  action: IInputAction;
  onAddBinding: () => void;
  onEditBinding: (index: number) => void;
  onDuplicateBinding: (binding: IBinding) => void;
  onDeleteBinding: (index: number) => void;
}

const ActionProperties: React.FC<IActionPropertiesProps> = ({
  action,
  onAddBinding,
  onEditBinding,
  onDuplicateBinding,
  onDeleteBinding,
}) => {
  const getBindingLabel = (binding: { compositeType?: string; type: string; path: string }): string => {
    if ('compositeType' in binding) {
      return `${binding.compositeType} Composite`;
    }
    return `${binding.type}: ${binding.path}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Action Properties</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 block mb-2">Name</label>
            <input
              type="text"
              value={action.name}
              className="w-full px-3 py-2 bg-gray-700 text-gray-200 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
              readOnly
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 block mb-2">Action Type</label>
              <select
                value={action.actionType}
                className="w-full px-3 py-2 bg-gray-700 text-gray-200 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
                disabled
              >
                <option value="button">Button</option>
                <option value="value">Value</option>
                <option value="passthrough">Pass Through</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-300 block mb-2">Control Type</label>
              <select
                value={action.controlType}
                className="w-full px-3 py-2 bg-gray-700 text-gray-200 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
                disabled
              >
                <option value="button">Button</option>
                <option value="axis">Axis</option>
                <option value="vector2">Vector 2</option>
                <option value="vector3">Vector 3</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">Enabled</label>
            <input
              type="checkbox"
              checked={action.enabled}
              className="toggle toggle-primary"
              readOnly
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300">Bindings ({action.bindings.length})</label>
              <button
                onClick={onAddBinding}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Add Binding"
              >
                <FiPlus className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="bg-gray-900 rounded p-3 space-y-2">
              {action.bindings.map((binding, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-gray-800 rounded"
                >
                  <span className="text-sm text-gray-300">{getBindingLabel(binding)}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditBinding(idx)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 className="w-3 h-3 text-gray-400" />
                    </button>
                    <button
                      onClick={() => onDuplicateBinding(binding)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                      title="Duplicate"
                    >
                      <FiCopy className="w-3 h-3 text-gray-400" />
                    </button>
                    <button
                      onClick={() => onDeleteBinding(idx)}
                      className="p-1 hover:bg-red-700 rounded transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
              {action.bindings.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-4">
                  No bindings configured
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
