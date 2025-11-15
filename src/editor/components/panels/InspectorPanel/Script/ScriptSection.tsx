import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiAlertTriangle, FiCode, FiEdit3, FiExternalLink } from 'react-icons/fi';

import { ScriptData } from '@/core/lib/ecs/components/definitions/ScriptComponent';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { Logger } from '@/core/lib/logger';
import { CheckboxField } from '@/editor/components/shared/CheckboxField';
import { GenericComponentSection } from '@/editor/components/shared/GenericComponentSection';
import { useEditorStore } from '@/editor/store/editorStore';

import { ScriptCodeModal } from './ScriptCodeModal';

const logger = Logger.create('ScriptSection');

export interface IScriptSectionProps {
  scriptData: ScriptData;
  onUpdate: (updates: Partial<ScriptData>) => void;
  onRemove?: () => void;
}

/**
 * Generate script ID from entity ID and script name
 */
function generateScriptId(entityId: number, scriptName: string): string {
  const sanitized = scriptName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `entity-${entityId}.${sanitized || 'script'}`;
}

export const ScriptSection: React.FC<IScriptSectionProps> = ({
  scriptData,
  onUpdate,
  onRemove,
}) => {
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isCreatingExternal, setIsCreatingExternal] = useState(false);
  const hasInitialized = useRef(false);
  const selectedEntityId = useEditorStore((state) => state.selectedId);

  /**
   * Auto-create external script file when component is first added
   * This complements onAdd() so when user adds Script via inspector, we persist immediately.
   */
  useEffect(() => {
    // Only run once on mount, and only if not already external
    if (hasInitialized.current || !selectedEntityId) return;
    if (scriptData.scriptRef?.source === 'external') {
      hasInitialized.current = true;
      return;
    }

    hasInitialized.current = true;

    const createExternalFile = async () => {
      try {
        setIsCreatingExternal(true);
        const scriptId = generateScriptId(selectedEntityId, scriptData.scriptName || 'Script');

        logger.info(`Auto-creating external script file: ${scriptId}`);

        // Use crypto-browserify for browser-compatible hashing
        const encoder = new TextEncoder();
        const data = encoder.encode(scriptData.code || '');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const codeHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        const response = await fetch('/api/script/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: scriptId,
            code: scriptData.code || '',
            description: `Auto-generated script for ${scriptData.scriptName || 'Script'}`,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to create external script');
        }

        // Update component with scriptRef and scriptPath for Lua runtime
        const luaScriptPath = `${scriptId}.lua`;

        onUpdate({
          scriptRef: {
            scriptId,
            source: 'external',
            path: result.path,
            codeHash,
            lastModified: Date.now(),
          },
          scriptPath: luaScriptPath,
        });

        logger.info(`External script created successfully: ${scriptId} at ${result.path}`);
      } catch (error) {
        logger.error('Failed to auto-create external script:', error);
      } finally {
        setIsCreatingExternal(false);
      }
    };

    createExternalFile();
  }, [selectedEntityId, scriptData.scriptName, scriptData.code, scriptData.scriptRef, onUpdate]);

  const updateScript = useCallback(
    (updates: Partial<ScriptData>) => {
      onUpdate(updates);
    },
    [onUpdate],
  );

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
        <div className="space-y-3">
          {/* External Script Badge */}
          {scriptData.scriptRef?.source === 'external' && (
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-900/20 border border-blue-600 rounded text-xs">
              <FiExternalLink className="text-blue-400" />
              <span
                className="text-blue-300 font-mono flex-1 truncate"
                title={scriptData.scriptRef.scriptId}
              >
                {scriptData.scriptRef.scriptId}
              </span>
            </div>
          )}

          {isCreatingExternal && (
            <div className="px-2 py-1 bg-yellow-900/20 border border-yellow-600 rounded text-xs text-yellow-300">
              Creating external file...
            </div>
          )}

          {/* Edit Code Button - Primary Action */}
          <button
            onClick={() => setIsCodeModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
          >
            <FiEdit3 className="w-4 h-4" />
            Edit Script Code
          </button>

          {/* Enabled Toggle */}
          <CheckboxField
            label="Enabled"
            description="Run script when play mode starts (onStart + onUpdate)"
            value={scriptData.enabled || true}
            onChange={(enabled) => updateScript({ enabled })}
          />

          {/* Error Display */}
          {scriptData.hasErrors && scriptData.lastErrorMessage && (
            <div className="bg-red-900/20 border border-red-600 rounded p-2">
              <div className="flex items-start gap-2">
                <FiAlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-red-300 text-xs">
                  <div className="font-medium mb-1">Error:</div>
                  <div className="font-mono text-[10px] break-words">
                    {scriptData.lastErrorMessage}
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
