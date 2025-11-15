/**
 * Hook for managing external script files
 * Handles creation, saving, and syncing of external scripts
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { IScriptRef, ScriptData } from '@/core/lib/ecs/components/definitions/ScriptComponent';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('useExternalScript');

interface IExternalScriptHook {
  isExternal: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  syncError: string | null;
  saveToExternal: (scriptData: ScriptData) => Promise<void>;
  syncFromExternal: (scriptRef: IScriptRef) => Promise<string | null>;
  createExternalScript: (entityId: number, scriptName: string, code: string) => Promise<IScriptRef>;
}

/**
 * Compute SHA-256 hash of content using Web Crypto API
 */
async function computeHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
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

/**
 * Hook for managing external script files
 */
export function useExternalScript(
  _entityId: number,
  onUpdate: (updates: Partial<ScriptData>) => void,
  syncInterval: number = 10000, // 10 seconds default
): IExternalScriptHook {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scriptRefRef = useRef<IScriptRef | null>(null);

  /**
   * Create external script file
   */
  const createExternalScript = useCallback(
    async (entityId: number, scriptName: string, code: string): Promise<IScriptRef> => {
      try {
        const scriptId = generateScriptId(entityId, scriptName);
        const hash = await computeHash(code);

        logger.debug(`Creating external script: ${scriptId}`);

        const response = await fetch('/api/script/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: scriptId,
            code,
            description: `Auto-generated script for ${scriptName}`,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to create external script');
        }

        const scriptRef: IScriptRef = {
          scriptId,
          source: 'external',
          path: result.path,
          codeHash: hash,
          lastModified: Date.now(),
        };

        scriptRefRef.current = scriptRef;
        logger.info(`External script created: ${scriptId} at ${result.path}`);

        return scriptRef;
      } catch (error) {
        logger.error('Failed to create external script:', error);
        throw error;
      }
    },
    [],
  );

  /**
   * Save script to external file
   */
  const saveToExternal = useCallback(
    async (scriptData: ScriptData): Promise<void> => {
      if (!scriptData.scriptRef || scriptData.scriptRef.source !== 'external') {
        logger.warn('Cannot save to external: scriptRef not set or not external');
        return;
      }

      try {
        setIsSyncing(true);
        setSyncError(null);

        const hash = await computeHash(scriptData.code || '');

        logger.debug(`Saving to external script: ${scriptData.scriptRef.scriptId}`);

        const response = await fetch('/api/script/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: scriptData.scriptRef.scriptId,
            code: scriptData.code,
            knownHash: scriptData.scriptRef.codeHash,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          if (result.error === 'hash_mismatch') {
            throw new Error('Script was modified externally. Please reload to sync.');
          }
          throw new Error(result.error || 'Failed to save script');
        }

        // Update scriptRef with new hash and timestamp
        onUpdate({
          scriptRef: {
            ...scriptData.scriptRef,
            codeHash: hash,
            lastModified: Date.now(),
          },
        });

        scriptRefRef.current = {
          ...scriptData.scriptRef,
          codeHash: hash,
          lastModified: Date.now(),
        };

        setLastSyncTime(Date.now());
        logger.info(`Script saved to external file: ${scriptData.scriptRef.scriptId}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        setSyncError(errorMsg);
        logger.error('Failed to save to external script:', error);
        throw error;
      } finally {
        setIsSyncing(false);
      }
    },
    [onUpdate],
  );

  /**
   * Sync from external file (check for changes)
   */
  const syncFromExternal = useCallback(async (scriptRef: IScriptRef): Promise<string | null> => {
    if (scriptRef.source !== 'external') {
      return null;
    }

    try {
      logger.debug(`Syncing from external script: ${scriptRef.scriptId}`);

      const response = await fetch(`/api/script/load?id=${encodeURIComponent(scriptRef.scriptId)}`);
      const result = await response.json();

      if (!result.success) {
        if (result.error === 'not_found') {
          logger.warn(`External script not found: ${scriptRef.scriptId}`);
          return null;
        }
        throw new Error(result.error || 'Failed to load script');
      }

      const serverHash = await computeHash(result.code);

      // Check if external file was modified
      if (serverHash !== scriptRef.codeHash) {
        logger.info(`External script changed: ${scriptRef.scriptId}`);
        return result.code;
      }

      return null; // No changes
    } catch (error) {
      logger.error('Failed to sync from external script:', error);
      return null;
    }
  }, []);

  /**
   * Auto-sync setup
   */
  useEffect(() => {
    if (!scriptRefRef.current) return;

    const scriptRef = scriptRefRef.current;

    // Start auto-sync timer
    syncTimerRef.current = setInterval(async () => {
      if (isSyncing) return; // Skip if already syncing

      const newCode = await syncFromExternal(scriptRef);
      if (newCode !== null) {
        // External file changed, update local code
        const newHash = await computeHash(newCode);
        onUpdate({
          code: newCode,
          scriptRef: {
            ...scriptRef,
            codeHash: newHash,
            lastModified: Date.now(),
          },
        });
        setLastSyncTime(Date.now());
        logger.info(`Auto-synced from external file: ${scriptRef.scriptId}`);
      }
    }, syncInterval);

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [syncInterval, isSyncing, syncFromExternal, onUpdate]);

  const isExternal = scriptRefRef.current?.source === 'external';

  return {
    isExternal,
    isSyncing,
    lastSyncTime,
    syncError,
    saveToExternal,
    syncFromExternal,
    createExternalScript,
  };
}
