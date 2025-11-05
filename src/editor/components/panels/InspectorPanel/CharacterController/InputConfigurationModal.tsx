import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiRotateCcw } from 'react-icons/fi';

import { IInputMapping } from '@/core/lib/ecs/components/accessors/types';

interface IInputConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputMapping: IInputMapping;
  onSave: (mapping: IInputMapping) => void;
}

interface IKeyBindingFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
}

const KeyBindingField: React.FC<IKeyBindingFieldProps> = ({
  label,
  value,
  onChange,
  isListening,
  onStartListening,
  onStopListening,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isListening && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isListening]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();

    // Handle special keys
    let key = e.key.toLowerCase();

    // Map special keys to more readable names
    const keyMap: Record<string, string> = {
      ' ': 'space',
      arrowup: 'up',
      arrowdown: 'down',
      arrowleft: 'left',
      arrowright: 'right',
      shift: 'shift',
      control: 'ctrl',
      alt: 'alt',
      tab: 'tab',
      enter: 'enter',
      escape: 'escape',
    };

    key = keyMap[key] || key;

    // Only allow single characters or special keys
    if (key.length === 1 || keyMap[key]) {
      onChange(key);
      onStopListening();
    }
  };

  const handleBlur = () => {
    if (isListening) {
      onStopListening();
    }
  };

  const displayValue = value === ' ' ? 'space' : value;

  return (
    <div className="flex items-center justify-between py-2">
      <label className="text-sm text-gray-300 capitalize">{label}</label>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={isListening ? undefined : onStartListening}
          readOnly={isListening}
          placeholder={isListening ? 'Press any key...' : 'Click to set key'}
          className={`w-20 px-2 py-1 text-sm text-center bg-gray-800 border rounded focus:outline-none ${
            isListening ? 'border-blue-500 animate-pulse' : 'border-gray-600 hover:border-gray-500'
          }`}
        />
        {value !== label.charAt(0) && (
          <button
            onClick={() => onChange(label.charAt(0))}
            className="p-1 text-gray-400 hover:text-white"
            title="Reset to default"
          >
            <FiRotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export const InputConfigurationModal: React.FC<IInputConfigurationModalProps> = ({
  isOpen,
  onClose,
  inputMapping,
  onSave,
}) => {
  const [localMapping, setLocalMapping] = useState<IInputMapping>(inputMapping);
  const [listeningField, setListeningField] = useState<keyof IInputMapping | null>(null);

  useEffect(() => {
    setLocalMapping(inputMapping);
  }, [inputMapping]);

  const handleSave = () => {
    onSave(localMapping);
    onClose();
  };

  const handleReset = () => {
    const defaultMapping: IInputMapping = {
      forward: 'w',
      backward: 's',
      left: 'a',
      right: 'd',
      jump: 'space',
    };
    setLocalMapping(defaultMapping);
  };

  const updateKey = (field: keyof IInputMapping, value: string) => {
    setLocalMapping((prev) => ({ ...prev, [field]: value }));
  };

  const startListening = (field: keyof IInputMapping) => {
    setListeningField(field);
  };

  const stopListening = () => {
    setListeningField(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">Configure Input</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-gray-400 mb-4">
            Click on any input field and press the key you want to bind. Default: WASD for movement,
            Space for jump. Arrow keys are also supported (use 'up', 'down', 'left', 'right').
          </p>

          <div className="space-y-1">
            <KeyBindingField
              label="Forward"
              value={localMapping.forward}
              onChange={(value) => updateKey('forward', value)}
              isListening={listeningField === 'forward'}
              onStartListening={() => startListening('forward')}
              onStopListening={stopListening}
            />

            <KeyBindingField
              label="Backward"
              value={localMapping.backward}
              onChange={(value) => updateKey('backward', value)}
              isListening={listeningField === 'backward'}
              onStartListening={() => startListening('backward')}
              onStopListening={stopListening}
            />

            <KeyBindingField
              label="Left"
              value={localMapping.left}
              onChange={(value) => updateKey('left', value)}
              isListening={listeningField === 'left'}
              onStartListening={() => startListening('left')}
              onStopListening={stopListening}
            />

            <KeyBindingField
              label="Right"
              value={localMapping.right}
              onChange={(value) => updateKey('right', value)}
              isListening={listeningField === 'right'}
              onStartListening={() => startListening('right')}
              onStopListening={stopListening}
            />

            <KeyBindingField
              label="Jump"
              value={localMapping.jump}
              onChange={(value) => updateKey('jump', value)}
              isListening={listeningField === 'jump'}
              onStartListening={() => startListening('jump')}
              onStopListening={stopListening}
            />
          </div>

          {/* Warnings */}
          {Object.values(localMapping).some((key, index, arr) => arr.indexOf(key) !== index) && (
            <div className="mt-4 p-3 bg-yellow-900/50 border border-yellow-700 rounded">
              <p className="text-sm text-yellow-400">
                ⚠️ Duplicate key bindings detected. Each action should have a unique key.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-sm text-gray-300 bg-gray-800 border border-gray-600 rounded hover:bg-gray-700"
          >
            Reset to Defaults
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-300 bg-gray-800 border border-gray-600 rounded hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-sm text-white bg-blue-600 border border-blue-500 rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
