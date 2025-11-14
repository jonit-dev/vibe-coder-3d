import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiAlertTriangle, FiCode, FiExternalLink, FiRefreshCw, FiSave, FiX } from 'react-icons/fi';

import { ScriptData } from '@/core/lib/ecs/components/definitions/ScriptComponent';
import { Logger } from '@/core/lib/logger';
import { CollapsibleSection } from '@/editor/components/shared/CollapsibleSection';
import { Modal } from '@/editor/components/shared/Modal';
import { SingleAxisField } from '@/editor/components/shared/SingleAxisField';

import { ScriptEditor } from './ScriptEditor';
import { ScriptParameters } from './ScriptParameters';

const logger = Logger.create('ScriptCodeModal');

const SYNC_INTERVAL = 10000; // 10 seconds
const AUTO_SAVE_DELAY = 10000; // 10 seconds after typing stops

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
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error' | 'missing'>(
    'idle',
  );
  const [missingFile, setMissingFile] = useState(false);
  const [externalCodeBuffer, setExternalCodeBuffer] = useState<string | undefined>(undefined);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Compute SHA-256 hash
   */
  const computeHash = useCallback(async (content: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }, []);

  /**
   * Save to external file
   */
  const saveToExternal = useCallback(
    async (code: string) => {
      if (!scriptData.scriptRef || scriptData.scriptRef.source !== 'external') {
        return;
      }

      try {
        setIsSaving(true);
        setSyncStatus('syncing');

        const hash = await computeHash(code);

        logger.debug(`Saving to external script: ${scriptData.scriptRef.scriptId}`);

        const response = await fetch('/api/script/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: scriptData.scriptRef.scriptId,
            code,
            knownHash: scriptData.scriptRef.codeHash,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          if (result.error === 'hash_mismatch') {
            setSyncStatus('error');
            logger.warn('Script was modified externally - hash conflict detected');

            // Show conflict resolution dialog
            const resolution = window.confirm(
              'The external file was modified by another source.\n\n' +
                'Click OK to overwrite with your local changes, or Cancel to reload from file.',
            );

            if (resolution) {
              // Force overwrite
              const retryResponse = await fetch('/api/script/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: scriptData.scriptRef.scriptId,
                  code,
                  force: true,
                }),
              });

              const retryResult = await retryResponse.json();
              if (!retryResult.success) {
                throw new Error(retryResult.error || 'Failed to force save script');
              }

              // Update scriptRef with new hash and scriptPath for Lua runtime
              const luaScriptPath = `${scriptData.scriptRef.scriptId}.lua`;

              onUpdate({
                scriptRef: {
                  ...scriptData.scriptRef,
                  codeHash: hash,
                  lastModified: Date.now(),
                },
                scriptPath: luaScriptPath,
              });

              setLastSyncTime(Date.now());
              setSyncStatus('saved');
              setTimeout(() => setSyncStatus('idle'), 2000);
              return;
            } else {
              // Reload from external file
              await syncFromExternal();
              setSyncStatus('idle');
              return;
            }
          }
          throw new Error(result.error || 'Failed to save script');
        }

        // Update scriptRef with new hash and scriptPath for Lua runtime
        // The Lua file will be in rust/game/scripts/<scriptId>.lua after transpilation
        const luaScriptPath = `${scriptData.scriptRef.scriptId}.lua`;

        onUpdate({
          scriptRef: {
            ...scriptData.scriptRef,
            codeHash: hash,
            lastModified: Date.now(),
          },
          scriptPath: luaScriptPath,
        });

        setLastSyncTime(Date.now());
        setSyncStatus('saved');
        logger.info(`Script saved to external file: ${scriptData.scriptRef.scriptId}`);

        // Clear saved status after 2 seconds
        setTimeout(() => {
          setSyncStatus('idle');
        }, 2000);
      } catch (error) {
        logger.error('Failed to save to external script:', error);
        setSyncStatus('error');
      } finally {
        setIsSaving(false);
      }
    },
    [scriptData.scriptRef, onUpdate, computeHash],
  );

  /**
   * Convert external script back to inline
   */
  const convertToInline = useCallback(() => {
    if (
      window.confirm(
        "Convert this external script to inline? The external file will remain but won't be synced anymore.",
      )
    ) {
      onUpdate({
        scriptRef: undefined,
      });
      setMissingFile(false);
      setSyncStatus('idle');
      logger.info('Converted external script to inline');
    }
  }, [onUpdate]);

  /**
   * Recreate missing external file
   */
  const recreateExternalFile = useCallback(async () => {
    if (!scriptData.scriptRef || scriptData.scriptRef.source !== 'external') {
      return;
    }

    try {
      setIsSaving(true);
      setSyncStatus('syncing');

      const hash = await computeHash(scriptData.code);

      logger.info(`Recreating external script: ${scriptData.scriptRef.scriptId}`);

      const response = await fetch('/api/script/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: scriptData.scriptRef.scriptId,
          code: scriptData.code,
          force: true, // Force overwrite
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to recreate script');
      }

      // Update scriptRef and scriptPath for Lua runtime
      const luaScriptPath = `${scriptData.scriptRef.scriptId}.lua`;

      onUpdate({
        scriptRef: {
          ...scriptData.scriptRef,
          codeHash: hash,
          lastModified: Date.now(),
          path: result.path,
        },
        scriptPath: luaScriptPath,
      });

      setMissingFile(false);
      setLastSyncTime(Date.now());
      setSyncStatus('saved');
      logger.info(`External script recreated: ${scriptData.scriptRef.scriptId}`);

      setTimeout(() => {
        setSyncStatus('idle');
      }, 2000);
    } catch (error) {
      logger.error('Failed to recreate external script:', error);
      setSyncStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [scriptData.code, scriptData.scriptRef, onUpdate, computeHash]);

  /**
   * Sync from external file
   */
  const syncFromExternal = useCallback(async () => {
    if (!scriptData.scriptRef || scriptData.scriptRef.source !== 'external') {
      return;
    }

    try {
      setIsSyncing(true);

      logger.info(`Fetching script from external file: ${scriptData.scriptRef.scriptId}`);

      const response = await fetch(
        `/api/script/load?id=${encodeURIComponent(scriptData.scriptRef.scriptId)}`,
      );

      logger.debug('Fetch response received:', {
        status: response.status,
        ok: response.ok,
      });

      const result = await response.json();

      if (!result.success) {
        if (result.error === 'not_found') {
          logger.warn(`External script not found: ${scriptData.scriptRef.scriptId}`);
          setMissingFile(true);
          setSyncStatus('missing');
          return;
        }
        throw new Error(result.error || 'Failed to load script');
      }

      // File found, clear missing flag
      if (missingFile) {
        setMissingFile(false);
        setSyncStatus('idle');
      }

      const serverHash = await computeHash(result.code);

      // Check if external file was modified
      if (serverHash !== scriptData.scriptRef.codeHash) {
        logger.info(`External script changed, updating editor:`, {
          scriptId: scriptData.scriptRef.scriptId,
          oldHash: scriptData.scriptRef.codeHash?.substring(0, 8),
          newHash: serverHash.substring(0, 8),
          oldCodeLength: scriptData.code?.length || 0,
          newCodeLength: result.code?.length || 0,
        });

        // Only auto-apply external updates if there are no unsaved changes
        if (!hasUnsavedChanges) {
          // Update code and push to Monaco via externalCodeBuffer
          onUpdate({
            code: result.code,
            scriptRef: {
              ...scriptData.scriptRef,
              codeHash: serverHash,
              lastModified: Date.now(),
            },
          });

          setExternalCodeBuffer(result.code);
          setLastSyncTime(Date.now());
        } else {
          // User has unsaved changes - don't auto-apply, just log
          logger.warn(
            `External script changed but has unsaved local changes - skipping auto-update`,
          );
        }
      } else {
        logger.debug(`External script unchanged (hash match):`, {
          scriptId: scriptData.scriptRef.scriptId,
          hash: serverHash.substring(0, 8),
        });
      }
    } catch (error) {
      logger.error('Failed to sync from external script:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [scriptData.scriptRef, onUpdate, computeHash, missingFile, hasUnsavedChanges]);

  /**
   * Auto-sync timer
   */
  useEffect(() => {
    if (!isOpen || !scriptData.scriptRef || scriptData.scriptRef.source !== 'external') {
      logger.debug('Skipping sync:', {
        isOpen,
        hasScriptRef: !!scriptData.scriptRef,
        source: scriptData.scriptRef?.source,
      });
      return;
    }

    logger.info('ScriptCodeModal opened - initiating sync from external file:', {
      scriptId: scriptData.scriptRef.scriptId,
      currentCodeLength: scriptData.code?.length || 0,
    });

    // Initial sync
    syncFromExternal();

    // Start auto-sync timer
    syncTimerRef.current = setInterval(() => {
      if (!isSaving && !hasUnsavedChanges) {
        syncFromExternal();
      }
    }, SYNC_INTERVAL);

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [isOpen, scriptData.scriptRef, isSaving, hasUnsavedChanges, syncFromExternal]);

  const handleCodeChange = useCallback(
    (code: string) => {
      onUpdate({
        code,
        lastModified: Date.now(),
      });
      setHasUnsavedChanges(true);

      // Auto-save to external file after typing stops
      if (scriptData.scriptRef?.source === 'external') {
        // Clear existing timer
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }

        // Set new timer
        autoSaveTimerRef.current = setTimeout(async () => {
          logger.debug('Auto-saving after typing stopped');
          await saveToExternal(code);
          setHasUnsavedChanges(false);
        }, AUTO_SAVE_DELAY);
      }
    },
    [onUpdate, scriptData.scriptRef, saveToExternal],
  );

  // Cleanup auto-save timer
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const handleParametersChange = useCallback(
    (parameters: Record<string, unknown>) => {
      onUpdate({ parameters });
      setHasUnsavedChanges(true);
    },
    [onUpdate],
  );

  const handleSave = useCallback(async () => {
    // Ensure external script exists; if not, create it now so scenes never inline-dump
    if (!scriptData.scriptRef || scriptData.scriptRef.source !== 'external') {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(scriptData.code || '');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const codeHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        const fallbackName = (scriptData.scriptName || 'Script')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        // Use a generic id if entity id is not in scope from modal
        const scriptId = `${fallbackName || 'script'}-${Date.now()}`;

        const response = await fetch('/api/script/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: scriptId,
            code: scriptData.code || '',
            description: `Script ${scriptData.scriptName || ''}`.trim(),
          }),
        });

        const result = await response.json();
        if (result?.success) {
          onUpdate({
            scriptRef: {
              scriptId,
              source: 'external',
              path: result.path,
              codeHash,
              lastModified: Date.now(),
            },
          });
        }
      } catch (e) {
        logger.warn('Failed to create external script on save; continuing inline save flow', e);
      }
    }

    // If external script, save to file
    if (scriptData.scriptRef?.source === 'external') {
      await saveToExternal(scriptData.code);
    }

    // Force recompilation
    onUpdate({ lastModified: Date.now() });
    setHasUnsavedChanges(false);
  }, [scriptData.scriptRef, scriptData.code, saveToExternal, onUpdate]);

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
      size="full"
      maxHeight="h-[95vh]"
      backdropOpacity="bg-black/60"
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-600">
        <div className="flex items-center gap-3">
          <FiCode className="text-blue-400" />
          <h2 className="text-lg font-semibold text-white">
            {scriptData.scriptRef?.source === 'external'
              ? scriptData.scriptRef.scriptId
              : scriptData.scriptName || 'Script Editor'}
          </h2>
          {scriptData.scriptRef?.source === 'external' && (
            <span className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded">
              <FiExternalLink className="w-3 h-3" />
              External
            </span>
          )}
          {hasUnsavedChanges && (
            <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
              Unsaved Changes
            </span>
          )}
          {/* Passive sync indicator - only show when syncing */}
          {isSyncing && (
            <FiRefreshCw
              className="w-4 h-4 text-blue-400 animate-spin"
              title="Syncing with external file..."
            />
          )}
          {syncStatus === 'error' && (
            <FiAlertTriangle className="w-4 h-4 text-red-400" title="Sync error" />
          )}
          {syncStatus === 'missing' && (
            <FiAlertTriangle className="w-4 h-4 text-orange-400" title="External file missing" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {scriptData.scriptRef?.source === 'external' && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              {isSyncing ? (
                <>
                  <FiRefreshCw className="w-3 h-3 animate-spin" />
                  Syncing...
                </>
              ) : lastSyncTime && !missingFile ? (
                <>Last sync: {new Date(lastSyncTime).toLocaleTimeString()}</>
              ) : null}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={(!hasUnsavedChanges && !missingFile) || isSaving}
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
          {/* Missing File Warning Banner */}
          {missingFile && (
            <div className="bg-orange-900/30 border-b border-orange-600 p-3 flex-shrink-0">
              <div className="flex items-start gap-3">
                <FiAlertTriangle className="text-orange-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-orange-300 font-medium mb-1">
                    External Script File Missing
                  </div>
                  <div className="text-sm text-orange-200 mb-3">
                    The external file{' '}
                    <code className="bg-black/30 px-1 rounded">
                      {scriptData.scriptRef?.scriptId}.ts
                    </code>{' '}
                    was deleted or moved. Your script code is still safe in the editor.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={recreateExternalFile}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
                    >
                      <FiSave className="w-3 h-3" />
                      Recreate File
                    </button>
                    <button
                      onClick={convertToInline}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                    >
                      Convert to Inline
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-3 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <FiCode className="w-4 h-4" />
              <span>TypeScript</span>
            </div>
            <div className="text-xs text-gray-500">
              {scriptData.code?.split('\n').length || 0} lines
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <ScriptEditor
              code={scriptData.code}
              externalCode={externalCodeBuffer}
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
                {/* External Script Info */}
                {scriptData.scriptRef?.source === 'external' && (
                  <div className="bg-blue-900/20 border border-blue-600 rounded p-2">
                    <div className="flex items-start gap-2 mb-2">
                      <FiExternalLink className="text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs flex-1">
                        <div className="text-blue-300 font-medium mb-1">External Script</div>
                        <div className="text-blue-400 font-mono text-[10px] break-all">
                          {scriptData.scriptRef.scriptId}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={convertToInline}
                      className="w-full px-2 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-white text-xs transition-colors"
                    >
                      Convert to Inline Script
                    </button>
                  </div>
                )}

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

            {/* Advanced Settings */}
            <CollapsibleSection title="Advanced" defaultExpanded={false}>
              <div className="space-y-3">
                <div className="text-xs text-gray-400 mb-2">
                  Scripts automatically run onStart() when play begins and onUpdate() every frame
                  while playing.
                </div>

                <SingleAxisField
                  label="Max Execution Time (ms)"
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
                    <div>entity.getComponent(type)</div>
                    <div>entity.setComponent(type, data)</div>
                    <div>entity.hasComponent(type)</div>
                  </div>
                </div>

                <div>
                  <div className="text-white font-medium mb-1">Scene & Query API</div>
                  <div className="bg-gray-900 p-2 rounded font-mono text-gray-300">
                    <div>query.findByName(name)</div>
                    <div>query.findByTag(tag)</div>
                    <div>query.raycastFirst(origin, dir)</div>
                    <div>entities.get(id)</div>
                    <div>entities.findByName(name)</div>
                  </div>
                </div>

                <div>
                  <div className="text-white font-medium mb-1">Game Object API</div>
                  <div className="bg-gray-900 p-2 rounded font-mono text-gray-300">
                    <div>gameObject.createEntity(name)</div>
                    <div>gameObject.createPrimitive(kind)</div>
                    <div>gameObject.createModel(model)</div>
                    <div>gameObject.clone(source)</div>
                    <div>gameObject.destroy(target)</div>
                  </div>
                </div>

                <div>
                  <div className="text-white font-medium mb-1">Input & Time API</div>
                  <div className="bg-gray-900 p-2 rounded font-mono text-gray-300">
                    <div>input.isKeyDown(key)</div>
                    <div>input.mousePosition()</div>
                    <div>input.getActionValue(map, action)</div>
                    <div>time.deltaTime</div>
                    <div>time.frameCount</div>
                  </div>
                </div>

                <div>
                  <div className="text-white font-medium mb-1">Event & Audio API</div>
                  <div className="bg-gray-900 p-2 rounded font-mono text-gray-300">
                    <div>events.on(type, handler)</div>
                    <div>events.emit(type, data)</div>
                    <div>audio.play(url, options)</div>
                    <div>audio.stop(handle)</div>
                  </div>
                </div>

                <div>
                  <div className="text-white font-medium mb-1">Timer & Utilities</div>
                  <div className="bg-gray-900 p-2 rounded font-mono text-gray-300">
                    <div>timer.setTimeout(cb, ms)</div>
                    <div>timer.setInterval(cb, ms)</div>
                    <div>math.lerp(a, b, t)</div>
                    <div>math.distance(x1,y1,z1,x2,y2,z2)</div>
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
