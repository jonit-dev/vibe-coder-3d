/**
 * Simple event service for component changes
 */

import type { IComponentChangeEvent, IEventEmitter } from '../types/core';
import { ErrorLogger } from '../utils/errors';

export class EventService implements IEventEmitter {
  private listeners: Array<(event: IComponentChangeEvent) => void> = [];

  emit(event: IComponentChangeEvent): void {
    try {
      ErrorLogger.debug(
        `Emitting event: ${event.action} ${event.componentId} for entity ${event.entityId}`,
      );

      for (const listener of this.listeners) {
        try {
          listener(event);
        } catch (error) {
          ErrorLogger.error(`Event listener failed`, {
            componentId: event.componentId,
            entityId: event.entityId,
            operation: event.action,
            additionalData: { error: String(error) },
          });
        }
      }
    } catch (error) {
      ErrorLogger.error(`Failed to emit event`, {
        componentId: event.componentId,
        entityId: event.entityId,
        operation: event.action,
        additionalData: { error: String(error) },
      });
    }
  }

  subscribe(listener: (event: IComponentChangeEvent) => void): void {
    if (!this.listeners.includes(listener)) {
      this.listeners.push(listener);
      ErrorLogger.debug(`Event listener subscribed. Total listeners: ${this.listeners.length}`);
    }
  }

  unsubscribe(listener: (event: IComponentChangeEvent) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
      ErrorLogger.debug(`Event listener unsubscribed. Total listeners: ${this.listeners.length}`);
    }
  }

  /**
   * Remove all listeners
   */
  clear(): void {
    this.listeners = [];
    ErrorLogger.debug('All event listeners cleared');
  }

  /**
   * Get the number of active listeners
   */
  getListenerCount(): number {
    return this.listeners.length;
  }
}
