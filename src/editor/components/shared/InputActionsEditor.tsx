import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiChevronRight, FiChevronDown, FiSettings } from 'react-icons/fi';
import {
  IInputActionsAsset,
  IActionMap,
  IInputAction,
  IBinding,
  ISimpleBinding,
  ICompositeBinding,
  DeviceType,
  ActionType,
  ControlType,
  CompositeType,
} from '@core/lib/input/inputTypes';

export interface IInputActionsEditorProps {
  asset: IInputActionsAsset;
  onAssetChange: (asset: IInputActionsAsset) => void;
}

type SelectionType =
  | { type: 'action-map'; mapIndex: number }
  | { type: 'action'; mapIndex: number; actionIndex: number }
  | { type: 'binding'; mapIndex: number; actionIndex: number; bindingIndex: number }
  | null;

export const InputActionsEditor: React.FC<IInputActionsEditorProps> = ({
  asset,
  onAssetChange,
}) => {
  const [expandedMaps, setExpandedMaps] = useState<Set<number>>(new Set([0]));
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<SelectionType>(null);

  // Helper: Update asset immutably
  const updateAsset = (updater: (draft: IInputActionsAsset) => void) => {
    const newAsset = JSON.parse(JSON.stringify(asset)) as IInputActionsAsset;
    updater(newAsset);
    onAssetChange(newAsset);
  };

  // Action Map operations
  const addActionMap = () => {
    updateAsset((draft) => {
      draft.actionMaps.push({
        name: `NewActionMap${draft.actionMaps.length + 1}`,
        enabled: true,
        actions: [],
      });
    });
  };

  const deleteActionMap = (mapIndex: number) => {
    updateAsset((draft) => {
      draft.actionMaps.splice(mapIndex, 1);
    });
    setSelection(null);
  };

  const toggleActionMap = (mapIndex: number) => {
    const newExpanded = new Set(expandedMaps);
    if (newExpanded.has(mapIndex)) {
      newExpanded.delete(mapIndex);
    } else {
      newExpanded.add(mapIndex);
    }
    setExpandedMaps(newExpanded);
  };

  // Action operations
  const addAction = (mapIndex: number) => {
    updateAsset((draft) => {
      const map = draft.actionMaps[mapIndex];
      map.actions.push({
        name: `NewAction${map.actions.length + 1}`,
        actionType: ActionType.Button,
        controlType: ControlType.Button,
        enabled: true,
        bindings: [],
      });
    });
  };

  const deleteAction = (mapIndex: number, actionIndex: number) => {
    updateAsset((draft) => {
      draft.actionMaps[mapIndex].actions.splice(actionIndex, 1);
    });
    setSelection(null);
  };

  const toggleAction = (mapIndex: number, actionIndex: number) => {
    const key = `${mapIndex}-${actionIndex}`;
    const newExpanded = new Set(expandedActions);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedActions(newExpanded);
  };

  // Binding operations
  const addBinding = (mapIndex: number, actionIndex: number, isComposite: boolean = false) => {
    updateAsset((draft) => {
      const action = draft.actionMaps[mapIndex].actions[actionIndex];

      if (isComposite) {
        // Add 2D Vector composite
        const compositeBinding: ICompositeBinding = {
          compositeType: CompositeType.TwoDVector,
          bindings: {
            up: { type: DeviceType.Keyboard, path: 'w' },
            down: { type: DeviceType.Keyboard, path: 's' },
            left: { type: DeviceType.Keyboard, path: 'a' },
            right: { type: DeviceType.Keyboard, path: 'd' },
          },
        };
        action.bindings.push(compositeBinding);
      } else {
        // Add simple binding
        const simpleBinding: ISimpleBinding = {
          type: DeviceType.Keyboard,
          path: 'space',
        };
        action.bindings.push(simpleBinding);
      }

      // Auto-expand the action
      const key = `${mapIndex}-${actionIndex}`;
      setExpandedActions((prev) => new Set(prev).add(key));
    });
  };

  const deleteBinding = (mapIndex: number, actionIndex: number, bindingIndex: number) => {
    updateAsset((draft) => {
      draft.actionMaps[mapIndex].actions[actionIndex].bindings.splice(bindingIndex, 1);
    });
    setSelection(null);
  };

  // Render binding display text
  const getBindingDisplayText = (binding: IBinding): string => {
    if ('compositeType' in binding) {
      const composite = binding as ICompositeBinding;
      if (composite.compositeType === CompositeType.TwoDVector) {
        return `2D Vector Composite`;
      }
      if (composite.compositeType === CompositeType.OneModifier) {
        return `1D Axis Composite`;
      }
      return 'Composite';
    }

    const simple = binding as ISimpleBinding;
    return `${simple.type}: ${simple.path}`;
  };

  // Render a binding
  const renderBinding = (
    binding: IBinding,
    mapIndex: number,
    actionIndex: number,
    bindingIndex: number,
  ) => {
    const isComposite = 'compositeType' in binding;
    const isSelected =
      selection?.type === 'binding' &&
      selection.mapIndex === mapIndex &&
      selection.actionIndex === actionIndex &&
      selection.bindingIndex === bindingIndex;

    return (
      <div
        key={bindingIndex}
        className={`ml-8 px-2 py-1 flex items-center justify-between group hover:bg-gray-700 rounded cursor-pointer ${
          isSelected ? 'bg-cyan-700' : ''
        }`}
        onClick={(e) => {
          e.stopPropagation();
          setSelection({ type: 'binding', mapIndex, actionIndex, bindingIndex });
        }}
      >
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded ${isComposite ? 'bg-purple-500' : 'bg-blue-500'}`} />
          <span className="text-xs text-gray-300">{getBindingDisplayText(binding)}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteBinding(mapIndex, actionIndex, bindingIndex);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600 rounded transition-all"
        >
          <FiTrash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  // Render an action
  const renderAction = (action: IInputAction, mapIndex: number, actionIndex: number) => {
    const key = `${mapIndex}-${actionIndex}`;
    const isExpanded = expandedActions.has(key);
    const isSelected =
      selection?.type === 'action' &&
      selection.mapIndex === mapIndex &&
      selection.actionIndex === actionIndex;

    return (
      <div key={actionIndex} className="ml-4">
        <div
          className={`px-2 py-1.5 flex items-center justify-between group hover:bg-gray-700 rounded cursor-pointer ${
            isSelected ? 'bg-cyan-700' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setSelection({ type: 'action', mapIndex, actionIndex });
          }}
        >
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleAction(mapIndex, actionIndex);
              }}
              className="p-0.5 hover:bg-gray-600 rounded"
            >
              {isExpanded ? (
                <FiChevronDown className="w-3 h-3" />
              ) : (
                <FiChevronRight className="w-3 h-3" />
              )}
            </button>
            <span className="text-sm text-gray-200">{action.name}</span>
            <span className="text-xs text-gray-500">
              ({action.actionType} / {action.controlType})
            </span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                addBinding(mapIndex, actionIndex, false);
              }}
              className="p-1 hover:bg-cyan-600 rounded text-xs"
              title="Add Binding"
            >
              <FiPlus className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteAction(mapIndex, actionIndex);
              }}
              className="p-1 hover:bg-red-600 rounded"
            >
              <FiTrash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Bindings */}
        {isExpanded && (
          <div className="mt-1">
            {action.bindings.length === 0 ? (
              <div className="ml-8 text-xs text-gray-500 italic py-1">No bindings</div>
            ) : (
              action.bindings.map((binding, bindingIndex) =>
                renderBinding(binding, mapIndex, actionIndex, bindingIndex),
              )
            )}
            <div className="ml-8 mt-1 flex gap-2">
              <button
                onClick={() => addBinding(mapIndex, actionIndex, false)}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <FiPlus className="w-3 h-3" /> Add Binding
              </button>
              <button
                onClick={() => addBinding(mapIndex, actionIndex, true)}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <FiPlus className="w-3 h-3" /> Add Composite
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render an action map
  const renderActionMap = (map: IActionMap, mapIndex: number) => {
    const isExpanded = expandedMaps.has(mapIndex);
    const isSelected = selection?.type === 'action-map' && selection.mapIndex === mapIndex;

    return (
      <div key={mapIndex} className="mb-2">
        <div
          className={`px-2 py-2 flex items-center justify-between group hover:bg-gray-700 rounded cursor-pointer ${
            isSelected ? 'bg-cyan-700' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setSelection({ type: 'action-map', mapIndex });
          }}
        >
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleActionMap(mapIndex);
              }}
              className="p-0.5 hover:bg-gray-600 rounded"
            >
              {isExpanded ? (
                <FiChevronDown className="w-4 h-4" />
              ) : (
                <FiChevronRight className="w-4 h-4" />
              )}
            </button>
            <span className="text-sm font-semibold text-gray-100">{map.name}</span>
            <span className="text-xs text-gray-500">({map.actions.length} actions)</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                addAction(mapIndex);
              }}
              className="p-1 hover:bg-cyan-600 rounded"
              title="Add Action"
            >
              <FiPlus className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteActionMap(mapIndex);
              }}
              className="p-1 hover:bg-red-600 rounded"
            >
              <FiTrash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Actions */}
        {isExpanded && (
          <div className="mt-1">
            {map.actions.length === 0 ? (
              <div className="ml-8 text-xs text-gray-500 italic py-1">No actions</div>
            ) : (
              map.actions.map((action, actionIndex) => renderAction(action, mapIndex, actionIndex))
            )}
            <button
              onClick={() => addAction(mapIndex)}
              className="ml-8 mt-1 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <FiPlus className="w-3 h-3" /> Add Action
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 text-gray-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <FiSettings className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold">Input Actions</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addActionMap}
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-xs flex items-center gap-1"
          >
            <FiPlus className="w-3 h-3" /> Add Action Map
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4">
        {asset.actionMaps.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm mb-2">No action maps defined</p>
            <button
              onClick={addActionMap}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-sm"
            >
              Create Action Map
            </button>
          </div>
        ) : (
          asset.actionMaps.map((map, mapIndex) => renderActionMap(map, mapIndex))
        )}
      </div>

      {/* Properties panel (right side) */}
      {selection && (
        <div className="border-l border-gray-700 w-80 bg-gray-900 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold mb-3">Properties</h3>
          {selection.type === 'action-map' && (
            <ActionMapProperties
              map={asset.actionMaps[selection.mapIndex]}
              onChange={(updated) => {
                updateAsset((draft) => {
                  draft.actionMaps[selection.mapIndex] = updated;
                });
              }}
            />
          )}
          {selection.type === 'action' && (
            <ActionProperties
              action={asset.actionMaps[selection.mapIndex].actions[selection.actionIndex]}
              onChange={(updated) => {
                updateAsset((draft) => {
                  draft.actionMaps[selection.mapIndex].actions[selection.actionIndex] = updated;
                });
              }}
            />
          )}
          {selection.type === 'binding' && (
            <BindingProperties
              binding={
                asset.actionMaps[selection.mapIndex].actions[selection.actionIndex].bindings[
                  selection.bindingIndex
                ]
              }
              onChange={(updated) => {
                updateAsset((draft) => {
                  draft.actionMaps[selection.mapIndex].actions[selection.actionIndex].bindings[
                    selection.bindingIndex
                  ] = updated;
                });
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Properties components
const ActionMapProperties: React.FC<{
  map: IActionMap;
  onChange: (map: IActionMap) => void;
}> = ({ map, onChange }) => (
  <div className="space-y-3">
    <div>
      <label className="text-xs text-gray-400 block mb-1">Name</label>
      <input
        type="text"
        value={map.name}
        onChange={(e) => onChange({ ...map, name: e.target.value })}
        className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
      />
    </div>
    <div className="flex items-center justify-between">
      <label className="text-xs text-gray-400">Enabled</label>
      <input
        type="checkbox"
        checked={map.enabled}
        onChange={(e) => onChange({ ...map, enabled: e.target.checked })}
        className="toggle toggle-sm toggle-primary"
      />
    </div>
  </div>
);

const ActionProperties: React.FC<{
  action: IInputAction;
  onChange: (action: IInputAction) => void;
}> = ({ action, onChange }) => (
  <div className="space-y-3">
    <div>
      <label className="text-xs text-gray-400 block mb-1">Name</label>
      <input
        type="text"
        value={action.name}
        onChange={(e) => onChange({ ...action, name: e.target.value })}
        className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
      />
    </div>
    <div>
      <label className="text-xs text-gray-400 block mb-1">Action Type</label>
      <select
        value={action.actionType}
        onChange={(e) => onChange({ ...action, actionType: e.target.value as ActionType })}
        className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
      >
        <option value={ActionType.Button}>Button</option>
        <option value={ActionType.Value}>Value</option>
        <option value={ActionType.PassThrough}>PassThrough</option>
      </select>
    </div>
    <div>
      <label className="text-xs text-gray-400 block mb-1">Control Type</label>
      <select
        value={action.controlType}
        onChange={(e) => onChange({ ...action, controlType: e.target.value as ControlType })}
        className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
      >
        <option value={ControlType.Button}>Button</option>
        <option value={ControlType.Axis}>Axis</option>
        <option value={ControlType.Vector2}>Vector2</option>
        <option value={ControlType.Vector3}>Vector3</option>
      </select>
    </div>
    <div className="flex items-center justify-between">
      <label className="text-xs text-gray-400">Enabled</label>
      <input
        type="checkbox"
        checked={action.enabled}
        onChange={(e) => onChange({ ...action, enabled: e.target.checked })}
        className="toggle toggle-sm toggle-primary"
      />
    </div>
  </div>
);

const BindingProperties: React.FC<{
  binding: IBinding;
  onChange: (binding: IBinding) => void;
}> = ({ binding, onChange }) => {
  if ('compositeType' in binding) {
    const composite = binding as ICompositeBinding;
    return (
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Composite Type</label>
          <select
            value={composite.compositeType}
            onChange={(e) =>
              onChange({ ...composite, compositeType: e.target.value as CompositeType })
            }
            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
          >
            <option value={CompositeType.OneModifier}>1D Axis</option>
            <option value={CompositeType.TwoDVector}>2D Vector</option>
          </select>
        </div>
        <div className="text-xs text-gray-500">
          Composite bindings combine multiple inputs into a single value
        </div>
      </div>
    );
  }

  const simple = binding as ISimpleBinding;
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-400 block mb-1">Device Type</label>
        <select
          value={simple.type}
          onChange={(e) => {
            const newType = e.target.value as
              | DeviceType.Keyboard
              | DeviceType.Mouse
              | DeviceType.Gamepad;
            // Create a new binding with the correct type
            const newBinding: ISimpleBinding = {
              type: newType,
              path: simple.path,
              modifiers: simple.modifiers,
            };
            onChange(newBinding);
          }}
          className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
        >
          <option value={DeviceType.Keyboard}>Keyboard</option>
          <option value={DeviceType.Mouse}>Mouse</option>
          <option value={DeviceType.Gamepad}>Gamepad</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-400 block mb-1">Path</label>
        <input
          type="text"
          value={simple.path}
          onChange={(e) => onChange({ ...simple, path: e.target.value })}
          className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
          placeholder="e.g., w, space, leftButton"
        />
      </div>
    </div>
  );
};
