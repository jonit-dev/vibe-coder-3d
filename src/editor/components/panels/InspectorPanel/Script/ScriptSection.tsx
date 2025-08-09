import React, { useCallback, useState } from 'react';
import { FiPause, FiCode, FiEdit3, FiAlertTriangle, FiCheck } from 'react-icons/fi';

import { ScriptData } from '@/core/lib/ecs/components/definitions/ScriptComponent';
import { CheckboxField } from '@/editor/components/shared/CheckboxField';
import { GenericComponentSection } from '@/editor/components/shared/GenericComponentSection';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';

import { ScriptCodeModal } from './ScriptCodeModal';

export interface IScriptSectionProps {
  scriptData: ScriptData;
  onUpdate: (updates: Partial<ScriptData>) => void;
  onRemove?: () => void;
}

export const ScriptSection: React.FC<IScriptSectionProps> = ({
  scriptData,
  onUpdate,
  onRemove,
}) => {
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  const updateScript = useCallback(
    (updates: Partial<ScriptData>) => {
      onUpdate(updates);
    },
    [onUpdate],
  );

  const formatExecutionTime = (time: number): string => {
    if (time < 1) return `${(time * 1000).toFixed(2)}μs`;
    if (time < 1000) return `${time.toFixed(2)}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  const getStatusIndicator = () => {
    if (scriptData.hasErrors) {
      return (
        <div className="flex items-center text-red-500 text-sm">
          <FiAlertTriangle className="mr-1" />
          Error
        </div>
      );
    }

    if (scriptData.enabled) {
      return (
        <div className="flex items-center text-green-500 text-sm">
          <FiCheck className="mr-1" />
          Active
        </div>
      );
    }

    return (
      <div className="flex items-center text-gray-500 text-sm">
        <FiPause className="mr-1" />
        Disabled
      </div>
    );
  };

  const getCodePreview = () => {
    const code = scriptData.code?.trim();
    if (!code) return 'No code written';

    const lines = code.split('\n');
    const previewLines = lines.slice(0, 2);
    const preview = previewLines.join(' ').substring(0, 60);

    return lines.length > 2 ? `${preview}...` : preview;
  };

  return (
    <>
      <GenericComponentSection
        title="Script"
        componentId={KnownComponentTypes.SCRIPT}
        headerColor="green"
        onRemove={onRemove}
        icon={<FiCode />}
        defaultCollapsed={false}
      >
        <div className="space-y-4">
          {/* Basic Script Info */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Script Name</label>
              <input
                type="text"
                value={scriptData.scriptName}
                onChange={(e) => updateScript({ scriptName: e.target.value })}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                placeholder="Script Name"
              />
            </div>

            {/* Status indicator */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-300">Status</span>
              {getStatusIndicator()}
            </div>

            <CheckboxField
              label="Enabled"
              description="Enable/disable script execution"
              value={scriptData.enabled}
              onChange={(enabled) => updateScript({ enabled })}
            />

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Language</label>
              <select
                value={scriptData.language}
                onChange={(e) =>
                  updateScript({ language: e.target.value as 'javascript' | 'typescript' })
                }
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
              </select>
            </div>
          </div>

          {/* Code Preview & Edit Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-300">Script Code</label>
              <button
                onClick={() => setIsCodeModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
              >
                <FiEdit3 className="w-3 h-3" />
                Edit Code
              </button>
            </div>

            <div className="bg-gray-800 border border-gray-600 rounded p-3">
              <code className="text-xs text-gray-400 font-mono">{getCodePreview()}</code>
            </div>
          </div>

          {/* Quick Settings */}
          <div className="grid grid-cols-2 gap-3">
            <CheckboxField
              label="Execute on Start"
              value={scriptData.executeOnStart}
              onChange={(executeOnStart) => updateScript({ executeOnStart })}
            />

            <CheckboxField
              label="Execute in Update"
              value={scriptData.executeInUpdate}
              onChange={(executeInUpdate) => updateScript({ executeInUpdate })}
            />
          </div>

          {/* Performance Stats - Compact */}
          {scriptData.executionCount > 0 && (
            <div className="bg-gray-800/50 border border-gray-600 rounded p-2">
              <div className="text-xs text-gray-400 mb-1">Performance</div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-300">Executions: {scriptData.executionCount}</span>
                <span className="text-gray-300">
                  Last: {formatExecutionTime(scriptData.lastExecutionTime)}
                </span>
              </div>
            </div>
          )}

          {/* Error Display - Compact */}
          {scriptData.hasErrors && scriptData.lastErrorMessage && (
            <div className="bg-red-900/20 border border-red-600 rounded p-2">
              <div className="flex items-start">
                <FiAlertTriangle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-red-300 text-xs">
                  <div className="font-medium mb-1">Script Error:</div>
                  <div className="truncate" title={scriptData.lastErrorMessage}>
                    {scriptData.lastErrorMessage.substring(0, 100)}...
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </GenericComponentSection>

      {/* Code Editor Modal */}
      <ScriptCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        scriptData={scriptData}
        onUpdate={updateScript}
      />
    </>
  );
};
