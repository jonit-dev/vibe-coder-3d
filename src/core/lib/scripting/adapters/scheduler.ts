/**
 * Frame-budgeted scheduler for script timers
 * Ensures timers don't block the main thread
 */

interface ITimerCallback {
  id: number;
  callback: () => void;
  executeAt: number;
  interval?: number;
  entityId: number;
}

class Scheduler {
  private nextId = 1;
  private timers = new Map<number, ITimerCallback>();
  private frameBudgetMs = 5; // Max time per frame for timer execution

  /**
   * Add a timeout
   */
  public setTimeout(entityId: number, callback: () => void, ms: number): number {
    const id = this.nextId++;
    this.timers.set(id, {
      id,
      callback,
      executeAt: performance.now() + ms,
      entityId,
    });
    return id;
  }

  /**
   * Add an interval
   */
  public setInterval(entityId: number, callback: () => void, ms: number): number {
    const id = this.nextId++;
    this.timers.set(id, {
      id,
      callback,
      executeAt: performance.now() + ms,
      interval: ms,
      entityId,
    });
    return id;
  }

  /**
   * Clear a timer
   */
  public clear(id: number): void {
    this.timers.delete(id);
  }

  /**
   * Clear all timers for an entity
   */
  public clearAllForEntity(entityId: number): void {
    for (const [id, timer] of this.timers.entries()) {
      if (timer.entityId === entityId) {
        this.timers.delete(id);
      }
    }
  }

  /**
   * Update timers (called each frame)
   */
  public update(): void {
    const now = performance.now();
    const startTime = now;
    const timersToExecute: ITimerCallback[] = [];

    // Collect timers that should execute
    for (const timer of this.timers.values()) {
      if (timer.executeAt <= now) {
        timersToExecute.push(timer);
      }
    }

    // Execute timers with budget
    for (const timer of timersToExecute) {
      // Check budget
      if (performance.now() - startTime > this.frameBudgetMs) {
        // Reschedule for next frame
        timer.executeAt = performance.now() + 1;
        continue;
      }

      try {
        timer.callback();
      } catch (error) {
        console.error(`[Scheduler] Error in timer ${timer.id}:`, error);
      }

      // Handle interval vs timeout
      if (timer.interval) {
        timer.executeAt = now + timer.interval;
      } else {
        this.timers.delete(timer.id);
      }
    }
  }
}

export const scheduler = new Scheduler();
