import {
  ActionType,
  CompositeType,
  ControlType,
  DeviceType,
  IActionMap,
  IBinding,
  IInputAction,
  ISimpleBinding,
} from '@core/lib/input/inputTypes';
import { useInputStore } from '@editor/store/inputStore';
import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

// Action Map Dialog
export interface IActionMapDialogProps {
  actionMap: IActionMap | null;
  assetName: string;
  onClose: () => void;
}

export const ActionMapDialog: React.FC<IActionMapDialogProps> = ({
  actionMap,
  assetName,
  onClose,
}) => {
  const store = useInputStore();
  const [name, setName] = useState(actionMap?.name ?? '');
  const [enabled, setEnabled] = useState(actionMap?.enabled ?? true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!actionMap && store.getAsset(assetName)?.actionMaps.some((m) => m.name === name)) {
      setError('Action map with this name already exists');
      return;
    }

    if (actionMap) {
      // Update
      store.updateActionMap(assetName, actionMap.name, { name, enabled });
    } else {
      // Create
      store.addActionMap(assetName, { name, enabled, actions: [] });
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-200">
            {actionMap ? 'Edit Action Map' : 'New Action Map'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-sm text-gray-300 block mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-gray-200 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
              placeholder="e.g., Gameplay, UI"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">Enabled</label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="toggle toggle-primary"
            />
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors"
            >
              {actionMap ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Action Dialog
export interface IActionDialogProps {
  action: IInputAction | null;
  assetName: string;
  mapName: string;
  onClose: () => void;
}

export const ActionDialog: React.FC<IActionDialogProps> = ({
  action,
  assetName,
  mapName,
  onClose,
}) => {
  const store = useInputStore();
  const [name, setName] = useState(action?.name ?? '');
  const [actionType, setActionType] = useState(action?.actionType ?? ActionType.Button);
  const [controlType, setControlType] = useState(action?.controlType ?? ControlType.Button);
  const [enabled, setEnabled] = useState(action?.enabled ?? true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    const map = store.getActionMap(assetName, mapName);
    if (!action && map?.actions.some((a) => a.name === name)) {
      setError('Action with this name already exists');
      return;
    }

    if (action) {
      // Update
      store.updateAction(assetName, mapName, action.name, {
        name,
        actionType,
        controlType,
        enabled,
      });
    } else {
      // Create
      store.addAction(assetName, mapName, {
        name,
        actionType,
        controlType,
        enabled,
        bindings: [],
      });
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-200">
            {action ? 'Edit Action' : 'New Action'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-sm text-gray-300 block mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-gray-200 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
              placeholder="e.g., Jump, Fire, Move"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 block mb-2">Action Type</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as ActionType)}
                className="w-full px-3 py-2 bg-gray-700 text-gray-200 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
              >
                <option value={ActionType.Button}>Button</option>
                <option value={ActionType.Value}>Value</option>
                <option value={ActionType.PassThrough}>Pass Through</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-300 block mb-2">Control Type</label>
              <select
                value={controlType}
                onChange={(e) => setControlType(e.target.value as ControlType)}
                className="w-full px-3 py-2 bg-gray-700 text-gray-200 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
              >
                <option value={ControlType.Button}>Button</option>
                <option value={ControlType.Axis}>Axis</option>
                <option value={ControlType.Vector2}>Vector 2</option>
                <option value={ControlType.Vector3}>Vector 3</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">Enabled</label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="toggle toggle-primary"
            />
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors"
            >
              {action ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Binding Dialog
export interface IBindingDialogProps {
  binding: IBinding | null;
  assetName: string;
  mapName: string;
  actionName: string;
  action: IInputAction;
  onClose: () => void;
}

export const BindingDialog: React.FC<IBindingDialogProps> = ({
  binding,
  assetName,
  mapName,
  actionName,
  action,
  onClose,
}) => {
  const store = useInputStore();
  const [bindingType, setBindingType] = useState<'simple' | 'composite'>(
    binding && 'compositeType' in binding ? 'composite' : 'simple',
  );
  const [deviceType, setDeviceType] = useState<'keyboard' | 'mouse' | 'gamepad'>(
    binding && 'type' in binding ? binding.type : 'keyboard',
  );
  const [path, setPath] = useState(binding && 'path' in binding ? binding.path : '');
  const [compositeType, setCompositeType] = useState<'1DAxis' | '2DVector' | '3DVector'>(
    binding && 'compositeType' in binding ? binding.compositeType : '2DVector',
  );
  const [error, setError] = useState('');

  // Composite bindings state
  const [compositeBindings, setCompositeBindings] = useState<Record<string, ISimpleBinding>>(
    binding && 'bindings' in binding ? binding.bindings : {},
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let newBinding: IBinding;

    if (bindingType === 'simple') {
      if (!path.trim()) {
        setError('Path is required');
        return;
      }
      newBinding = { type: deviceType, path } as ISimpleBinding;
    } else {
      // Composite
      const requiredKeys =
        compositeType === CompositeType.TwoDVector
          ? ['up', 'down', 'left', 'right']
          : compositeType === CompositeType.OneModifier
            ? ['positive', 'negative']
            : ['up', 'down', 'left', 'right', 'forward', 'backward'];

      const missingKeys = requiredKeys.filter((key) => !compositeBindings[key]);
      if (missingKeys.length > 0) {
        setError(`Missing bindings: ${missingKeys.join(', ')}`);
        return;
      }

      newBinding = { compositeType, bindings: compositeBindings };
    }

    const bindingIndex = binding ? action.bindings.indexOf(binding) : -1;
    const updatedBindings =
      bindingIndex >= 0
        ? action.bindings.map((b, i) => (i === bindingIndex ? newBinding : b))
        : [...action.bindings, newBinding];

    store.updateAction(assetName, mapName, actionName, { bindings: updatedBindings });
    onClose();
  };

  const updateCompositeBinding = (
    key: string,
    type: DeviceType.Keyboard | DeviceType.Mouse | DeviceType.Gamepad,
    bindingPath: string,
  ) => {
    setCompositeBindings((prev) => ({
      ...prev,
      [key]: { type, path: bindingPath },
    }));
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-200">
            {binding ? 'Edit Binding' : 'New Binding'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-sm text-gray-300 block mb-2">Binding Type</label>
            <select
              value={bindingType}
              onChange={(e) => setBindingType(e.target.value as 'simple' | 'composite')}
              className="w-full px-3 py-2 bg-gray-700 text-gray-200 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
            >
              <option value="simple">Simple</option>
              <option value="composite">Composite</option>
            </select>
          </div>

          {bindingType === 'simple' ? (
            <>
              <div>
                <label className="text-sm text-gray-300 block mb-2">Device</label>
                <select
                  value={deviceType}
                  onChange={(e) =>
                    setDeviceType(
                      e.target.value as DeviceType.Keyboard | DeviceType.Mouse | DeviceType.Gamepad,
                    )
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-gray-200 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
                >
                  <option value={DeviceType.Keyboard}>Keyboard</option>
                  <option value={DeviceType.Mouse}>Mouse</option>
                  <option value={DeviceType.Gamepad}>Gamepad</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-300 block mb-2">Path</label>
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-gray-200 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
                  placeholder={
                    deviceType === DeviceType.Keyboard
                      ? 'e.g., w, space, shift'
                      : deviceType === DeviceType.Mouse
                        ? 'e.g., leftButton, delta, scroll'
                        : 'e.g., buttonSouth, leftStick/x'
                  }
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm text-gray-300 block mb-2">Composite Type</label>
                <select
                  value={compositeType}
                  onChange={(e) => setCompositeType(e.target.value as CompositeType)}
                  className="w-full px-3 py-2 bg-gray-700 text-gray-200 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
                >
                  <option value={CompositeType.OneModifier}>1D Axis</option>
                  <option value={CompositeType.TwoDVector}>2D Vector</option>
                  <option value={CompositeType.ThreeDVector}>3D Vector</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-300 block mb-2">Composite Bindings</label>
                {compositeType === CompositeType.TwoDVector &&
                  ['up', 'down', 'left', 'right'].map((key) => (
                    <CompositeBindingInput
                      key={key}
                      label={key}
                      binding={compositeBindings[key]}
                      onChange={(type, bindingPath) =>
                        updateCompositeBinding(
                          key,
                          type as DeviceType.Keyboard | DeviceType.Mouse | DeviceType.Gamepad,
                          bindingPath,
                        )
                      }
                    />
                  ))}
                {compositeType === CompositeType.OneModifier &&
                  ['positive', 'negative'].map((key) => (
                    <CompositeBindingInput
                      key={key}
                      label={key}
                      binding={compositeBindings[key]}
                      onChange={(type, bindingPath) =>
                        updateCompositeBinding(
                          key,
                          type as DeviceType.Keyboard | DeviceType.Mouse | DeviceType.Gamepad,
                          bindingPath,
                        )
                      }
                    />
                  ))}
              </div>
            </>
          )}

          {error && <div className="text-sm text-red-400">{error}</div>}
        </form>

        <div className="flex gap-3 p-4 border-t border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            type="submit"
            className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors"
          >
            {binding ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Composite Binding Input Component
interface ICompositeBindingInputProps {
  label: string;
  binding: ISimpleBinding | undefined;
  onChange: (type: 'keyboard' | 'mouse' | 'gamepad', path: string) => void;
}

const CompositeBindingInput: React.FC<ICompositeBindingInputProps> = ({
  label,
  binding,
  onChange,
}) => {
  const [type, setType] = useState<'keyboard' | 'mouse' | 'gamepad'>(binding?.type ?? 'keyboard');
  const [path, setPath] = useState(binding?.path ?? '');

  const handleTypeChange = (newType: 'keyboard' | 'mouse' | 'gamepad') => {
    setType(newType);
    onChange(newType, path);
  };

  const handlePathChange = (newPath: string) => {
    setPath(newPath);
    onChange(type, newPath);
  };

  return (
    <div className="flex gap-2 items-center">
      <label className="text-xs text-gray-400 w-16 capitalize">{label}</label>
      <select
        value={type}
        onChange={(e) =>
          handleTypeChange(
            e.target.value as DeviceType.Keyboard | DeviceType.Mouse | DeviceType.Gamepad,
          )
        }
        className="px-2 py-1 bg-gray-700 text-gray-200 rounded border border-gray-600 text-sm"
      >
        <option value={DeviceType.Keyboard}>Key</option>
        <option value={DeviceType.Mouse}>Mouse</option>
        <option value={DeviceType.Gamepad}>Gamepad</option>
      </select>
      <input
        type="text"
        value={path}
        onChange={(e) => handlePathChange(e.target.value)}
        className="flex-1 px-2 py-1 bg-gray-700 text-gray-200 rounded border border-gray-600 text-sm"
        placeholder="path..."
      />
    </div>
  );
};
