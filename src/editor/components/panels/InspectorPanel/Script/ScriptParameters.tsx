import React, { useCallback, useState } from 'react';
import { FiPlus, FiTrash2, FiType, FiToggleLeft, FiHash } from 'react-icons/fi';

export interface IScriptParametersProps {
  parameters: Record<string, unknown>;
  onChange: (parameters: Record<string, unknown>) => void;
}

type ParameterType = 'string' | 'number' | 'boolean';

interface IParameterEntry {
  key: string;
  value: unknown;
  type: ParameterType;
}

export const ScriptParameters: React.FC<IScriptParametersProps> = ({ parameters, onChange }) => {
  const [newParamKey, setNewParamKey] = useState('');
  const [newParamType, setNewParamType] = useState<ParameterType>('string');

  // Convert parameters object to array for easier rendering
  const parameterEntries: IParameterEntry[] = Object.entries(parameters).map(([key, value]) => ({
    key,
    value,
    type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string',
  }));

  const getDefaultValueForType = (type: ParameterType): unknown => {
    switch (type) {
      case 'boolean':
        return false;
      case 'number':
        return 0;
      case 'string':
        return '';
      default:
        return '';
    }
  };

  const formatValueForInput = (value: unknown, type: ParameterType): string => {
    if (type === 'boolean') return String(value);
    if (type === 'number') return String(value);
    return String(value);
  };

  const handleAddParameter = useCallback(() => {
    if (!newParamKey.trim()) return;

    const updatedParameters = {
      ...parameters,
      [newParamKey]: getDefaultValueForType(newParamType),
    };

    onChange(updatedParameters);
    setNewParamKey('');
  }, [newParamKey, newParamType, parameters, onChange]);

  const handleRemoveParameter = useCallback(
    (key: string) => {
      const updatedParameters = { ...parameters };
      delete updatedParameters[key];
      onChange(updatedParameters);
    },
    [parameters, onChange],
  );

  const handleUpdateParameter = useCallback(
    (key: string, newValue: unknown) => {
      const updatedParameters = {
        ...parameters,
        [key]: newValue,
      };
      onChange(updatedParameters);
    },
    [parameters, onChange],
  );

  const handleKeyChange = useCallback(
    (oldKey: string, newKey: string) => {
      if (newKey === oldKey || !newKey.trim()) return;

      const updatedParameters = { ...parameters };
      const value = updatedParameters[oldKey];
      delete updatedParameters[oldKey];
      updatedParameters[newKey] = value;

      onChange(updatedParameters);
    },
    [parameters, onChange],
  );

  const getTypeIcon = (type: ParameterType) => {
    switch (type) {
      case 'string':
        return <FiType className="w-3 h-3" />;
      case 'number':
        return <FiHash className="w-3 h-3" />;
      case 'boolean':
        return <FiToggleLeft className="w-3 h-3" />;
      default:
        return <FiType className="w-3 h-3" />;
    }
  };

  const renderParameterInput = (entry: IParameterEntry) => {
    switch (entry.type) {
      case 'boolean':
        return (
          <select
            value={String(entry.value)}
            onChange={(e) => handleUpdateParameter(entry.key, e.target.value === 'true')}
            className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={formatValueForInput(entry.value, entry.type)}
            onChange={(e) => handleUpdateParameter(entry.key, parseFloat(e.target.value) || 0)}
            className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            step="any"
          />
        );

      case 'string':
      default:
        return (
          <input
            type="text"
            value={formatValueForInput(entry.value, entry.type)}
            onChange={(e) => handleUpdateParameter(entry.key, e.target.value)}
            className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          />
        );
    }
  };

  return (
    <div className="space-y-3">
      {/* Existing parameters */}
      {parameterEntries.length > 0 && (
        <div className="space-y-2">
          {parameterEntries.map((entry) => (
            <div
              key={entry.key}
              className="flex items-center gap-2 p-2 bg-gray-800 rounded border border-gray-600"
            >
              {/* Type indicator */}
              <div className="flex items-center text-gray-400 flex-shrink-0">
                {getTypeIcon(entry.type)}
              </div>

              {/* Parameter key */}
              <input
                type="text"
                value={entry.key}
                onChange={(e) => handleKeyChange(entry.key, e.target.value)}
                className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
                placeholder="key"
              />

              {/* Parameter value */}
              {renderParameterInput(entry)}

              {/* Remove button */}
              <button
                onClick={() => handleRemoveParameter(entry.key)}
                className="flex items-center justify-center w-6 h-6 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
                title="Remove parameter"
              >
                <FiTrash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new parameter */}
      <div className="flex items-center gap-2 p-2 bg-gray-800/50 border-2 border-dashed border-gray-600 rounded">
        {/* Type selector */}
        <select
          value={newParamType}
          onChange={(e) => setNewParamType(e.target.value as ParameterType)}
          className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs"
        >
          <option value="string">str</option>
          <option value="number">num</option>
          <option value="boolean">bool</option>
        </select>

        {/* Key input */}
        <input
          type="text"
          value={newParamKey}
          onChange={(e) => setNewParamKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddParameter()}
          className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          placeholder="Parameter name..."
        />

        {/* Add button */}
        <button
          onClick={handleAddParameter}
          disabled={!newParamKey.trim()}
          className="flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
          title="Add parameter"
        >
          <FiPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Help text */}
      <div className="text-xs text-gray-400">
        <p>
          Parameters can be accessed in your script via the{' '}
          <code className="bg-gray-700 px-1 rounded">parameters</code> object.
        </p>
        <p className="mt-1">
          Example:{' '}
          <code className="bg-gray-700 px-1 rounded">const speed = parameters.speed || 1;</code>
        </p>
      </div>
    </div>
  );
};
