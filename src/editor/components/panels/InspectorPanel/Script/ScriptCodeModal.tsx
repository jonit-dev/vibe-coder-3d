import React, { useCallback, useState } from 'react';
import { FiSave, FiX, FiAlertTriangle, FiCode } from 'react-icons/fi';

import { ScriptData } from '@/core/lib/ecs/components/definitions/ScriptComponent';
import { Modal } from '@/editor/components/shared/Modal';
import { CheckboxField } from '@/editor/components/shared/CheckboxField';
import { SingleAxisField } from '@/editor/components/shared/SingleAxisField';
import { CollapsibleSection } from '@/editor/components/shared/CollapsibleSection';

import { ScriptEditor } from './ScriptEditor';
import { ScriptParameters } from './ScriptParameters';

export interface IScriptCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  scriptData: ScriptData;
  onUpdate: (updates: Partial<ScriptData>) => void;
}

export const ScriptCodeModal: React.FC<IScriptCodeModalProps> = ({
  isOpen,
  onClose,
  scriptData,
  onUpdate,
}) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleCodeChange = useCallback(
    (code: string) => {
      onUpdate({
        code,

        lastModified: Date.now(),
      });
      setHasUnsavedChanges(true);
    },
    [onUpdate],
  );

  const handleParametersChange = useCallback(
    (parameters: Record<string, unknown>) => {
      onUpdate({ parameters });
      setHasUnsavedChanges(true);
    },
    [onUpdate],
  );

  const handleSave = useCallback(() => {
    // Force recompilation
    onUpdate({ lastModified: Date.now() });
    setHasUnsavedChanges(false);
  }, [onUpdate]);

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        setHasUnsavedChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  const formatExecutionTime = (time: number): string => {
    if (time < 1) return `${(time * 1000).toFixed(2)}μs`;
    if (time < 1000) return `${time.toFixed(2)}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="w-[95vw]"
      maxHeight="h-[95vh]"
      backdropOpacity="bg-black/60"
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-600">
        <div className="flex items-center gap-3">
          <FiCode className="text-blue-400" />
          <h2 className="text-lg font-semibold text-white">
            Script Editor: {scriptData.scriptName}
          </h2>
          {hasUnsavedChanges && (
            <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
              Unsaved Changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
          >
            <FiSave className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal Content */}
      <div className="flex flex-1 min-h-0">
        {/* Left Panel - Code Editor */}
        <div className="flex-1 flex flex-col bg-gray-900 min-h-0">
          <div className="flex items-center justify-between p-3 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <FiCode className="w-4 h-4" />
              <span>{scriptData.language === 'typescript' ? 'TypeScript' : 'JavaScript'}</span>
            </div>
            <div className="text-xs text-gray-500">
              {scriptData.code?.split('\n').length || 0} lines
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <ScriptEditor
              code={scriptData.code}
              language={scriptData.language}
              onChange={handleCodeChange}
              hasErrors={scriptData.hasErrors}
              errorMessage={scriptData.lastErrorMessage}
              height="100%"
            />
          </div>
        </div>

        {/* Right Panel - Tools & Settings */}
        <div className="w-80 bg-gray-800 border-l border-gray-600 flex flex-col overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Script Settings */}
            <CollapsibleSection title="Script Settings" defaultExpanded={true}>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1">Language</label>
                  <select
                    value={scriptData.language}
                    onChange={(e) =>
                      onUpdate({ language: e.target.value as 'javascript' | 'typescript' })
                    }
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1">
                    Description
                  </label>
                  <textarea
                    value={scriptData.description}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm resize-none"
                    rows={2}
                    placeholder="Script description..."
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Execution Settings */}
            <CollapsibleSection title="Execution Settings" defaultExpanded={false}>
              <div className="space-y-3">
                <CheckboxField
                  label="Execute on Start"
                  description="Run onStart() when entity is created"
                  value={scriptData.executeOnStart}
                  onChange={(executeOnStart) => onUpdate({ executeOnStart })}
                />

                <CheckboxField
                  label="Execute in Update"
                  description="Run onUpdate() every frame"
                  value={scriptData.executeInUpdate}
                  onChange={(executeInUpdate) => onUpdate({ executeInUpdate })}
                />

                <CheckboxField
                  label="Execute on Enable"
                  description="Run onEnable() when component is enabled"
                  value={scriptData.executeOnEnable}
                  onChange={(executeOnEnable) => onUpdate({ executeOnEnable })}
                />

                <SingleAxisField
                  label="Max Execution Time"
                  value={scriptData.maxExecutionTime}
                  onChange={(maxExecutionTime) => onUpdate({ maxExecutionTime })}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>
            </CollapsibleSection>

            {/* Script Parameters */}
            <CollapsibleSection title="Parameters" defaultExpanded={false}>
              <ScriptParameters
                parameters={scriptData.parameters}
                onChange={handleParametersChange}
              />
            </CollapsibleSection>

            {/* Performance Stats */}
            {scriptData.executionCount > 0 && (
              <CollapsibleSection title="Performance" defaultExpanded={false}>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Executions:</span>
                    <span className="text-white">{scriptData.executionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Execution:</span>
                    <span className="text-white">
                      {formatExecutionTime(scriptData.lastExecutionTime)}
                    </span>
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* API Reference */}
            <CollapsibleSection title="API Reference" defaultExpanded={false}>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-white font-medium mb-1">Entity API</div>
                  <div className="bg-gray-900 p-2 rounded font-mono text-gray-300">
                    <div>entity.transform.position</div>
                    <div>entity.transform.rotation</div>
                    <div>entity.transform.scale</div>
                    <div>entity.three.mesh</div>
                    <div>entity.three.material</div>
                  </div>
                </div>

                <div>
                  <div className="text-white font-medium mb-1">Three.js API</div>
                  <div className="bg-gray-900 p-2 rounded font-mono text-gray-300">
                    <div>three.object3D</div>
                    <div>three.material.get()</div>
                    <div>three.scene</div>
                    <div>three.animate.position()</div>
                  </div>
                </div>

                <div>
                  <div className="text-white font-medium mb-1">Utilities</div>
                  <div className="bg-gray-900 p-2 rounded font-mono text-gray-300">
                    <div>math.lerp(a, b, t)</div>
                    <div>math.distance()</div>
                    <div>console.log()</div>
                    <div>parameters.speed</div>
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Error Display */}
            {scriptData.hasErrors && scriptData.lastErrorMessage && (
              <div className="bg-red-900/20 border border-red-600 rounded p-3">
                <div className="flex items-start">
                  <FiAlertTriangle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-red-300 text-sm">
                    <div className="font-medium mb-1">Script Error:</div>
                    <pre className="whitespace-pre-wrap break-words text-xs">
                      {scriptData.lastErrorMessage}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
