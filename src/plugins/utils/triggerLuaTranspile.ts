import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let activeTranspile: Promise<void> | null = null;

/**
 * Ensures TypeScript→Lua transpilation runs after content updates.
 * Subsequent calls while a transpile is running will await the same process.
 */
export async function triggerLuaTranspile(trigger: string): Promise<void> {
  // Skip transpile during unit tests to avoid spawning processes
  if (process.env.VITEST || process.env.NODE_ENV === 'test') {
    return;
  }
  if (!activeTranspile) {
    activeTranspile = (async () => {
      try {
        const { stdout, stderr } = await execAsync('yarn transpile:lua');
        if (stderr && !stderr.includes('Done in')) {
          console.warn(`[${trigger}] Lua transpile warnings:`, stderr);
        }
        if (stdout.trim()) {
          console.log(`[${trigger}] Lua transpile output:`, stdout.trim());
        }
      } catch (error: unknown) {
        const message =
          error && typeof error === 'object' && 'message' in error
            ? (error as { message?: string }).message
            : 'Unknown error';
        console.error(`[${trigger}] Lua transpile failed:`, message);
        if (error && typeof error === 'object' && 'stdout' in error) {
          console.error('stdout:', (error as { stdout?: string }).stdout);
        }
        if (error && typeof error === 'object' && 'stderr' in error) {
          console.error('stderr:', (error as { stderr?: string }).stderr);
        }
      } finally {
        activeTranspile = null;
      }
    })();
  }

  try {
    await activeTranspile;
  } catch {
    // Errors are logged above; keep original save flows running.
  }
}
