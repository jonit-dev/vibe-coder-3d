/**
 * Session Logger - Dedicated logging for AI agent sessions
 * Tracks all events, tool calls, and interactions for debugging
 * Auto-saves to public/logs/ directory for easy access
 */

import { Logger } from '@core/lib/logger';

const logger = Logger.create('SessionLogger');

interface ILogEntry {
  timestamp: number;
  elapsed: string;
  event: string;
  data?: unknown;
  wallTime: string;
}

export class SessionLogger {
  private logs: ILogEntry[] = [];
  private sessionId: string;
  private startTime: number;
  private autoSaveEnabled = true;

  constructor(sessionId: string, autoSave = true) {
    this.sessionId = sessionId;
    this.startTime = Date.now();
    this.autoSaveEnabled = autoSave;
    this.log('SESSION_START', { sessionId, timestamp: new Date().toISOString() });
  }

  log(event: string, data?: unknown): void {
    const timestamp = Date.now() - this.startTime;
    const entry: ILogEntry = {
      timestamp,
      elapsed: `${timestamp}ms`,
      event,
      data,
      wallTime: new Date().toISOString(),
    };
    this.logs.push(entry);
    logger.debug(`[${this.sessionId}] ${event}`, data);

    // Auto-save periodically (every 10 events) and on important events
    const shouldAutoSave =
      this.autoSaveEnabled &&
      (this.logs.length % 10 === 0 ||
        event === 'MESSAGE_COMPLETE' ||
        event === 'MESSAGE_ERROR' ||
        event === 'CONVERSATION_COMPLETE');

    if (shouldAutoSave) {
      this.saveToFileSystem().catch((err) =>
        logger.warn('Auto-save failed (expected in browser)', { error: err }),
      );
    }
  }

  /**
   * Save to filesystem via Vite plugin (auto-save)
   * Silently fails in production/browser environments
   */
  private async saveToFileSystem(): Promise<void> {
    try {
      const filename = `agent-session-${this.sessionId}.log`;
      const logContent = this.logs.map((entry) => JSON.stringify(entry, null, 2)).join('\n');

      // POST to Vite plugin endpoint (only works in dev mode)
      const response = await fetch('/api/save-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content: logContent }),
      });

      if (response.ok) {
        logger.debug('Session log auto-saved', { filename, entries: this.logs.length });
      }
    } catch {
      // Expected to fail in production - logs only work in dev mode
      // Silent failure is intentional
    }
  }

  /**
   * Manual download via browser (user-triggered)
   */
  async saveToFile(): Promise<void> {
    try {
      const filename = `agent-session-${this.sessionId}-${Date.now()}.log`;
      const logContent = this.logs.map((entry) => JSON.stringify(entry, null, 2)).join('\n');

      // Use FileSystem Access API if available (Chromium-based browsers)
      if ('showSaveFilePicker' in window) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [
              {
                description: 'Log files',
                accept: { 'text/plain': ['.log'] },
              },
            ],
          });
          const writable = await handle.createWritable();
          await writable.write(logContent);
          await writable.close();
          logger.info('Session log saved', { filename });
        } catch {
          // User cancelled or API not available, fallback to download
          this.downloadLog(filename, logContent);
        }
      } else {
        // Fallback for other browsers
        this.downloadLog(filename, logContent);
      }
    } catch (error) {
      logger.error('Failed to save session log', { error });
    }
  }

  private downloadLog(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    logger.info('Session log downloaded', { filename });
  }

  getLogContent(): string {
    return this.logs.map((entry) => JSON.stringify(entry, null, 2)).join('\n');
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getLogCount(): number {
    return this.logs.length;
  }
}
