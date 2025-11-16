import { Logger } from '@core/lib/logger';

const logger = Logger.create('AgentEventResponse');

export interface IEventResponseData {
  _requestId?: string;
  success: boolean;
  entityId?: number;
  error?: string;
  [key: string]: unknown;
}

export class AgentEventResponse {
  static dispatchSuccess(eventName: string, data: Omit<IEventResponseData, 'success'>): void {
    const detail = { ...data, success: true };
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
    logger.debug('Success response dispatched', { eventName, detail });
  }

  static dispatchError(eventName: string, requestId: string | undefined, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const detail: IEventResponseData = {
      _requestId: requestId,
      success: false,
      error: errorMessage,
    };

    window.dispatchEvent(new CustomEvent(eventName, { detail }));
    logger.debug('Error response dispatched', { eventName, detail });
  }

  static dispatchResult<T>(eventName: string, data: T): void {
    window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    logger.debug('Result dispatched', { eventName, data });
  }
}
