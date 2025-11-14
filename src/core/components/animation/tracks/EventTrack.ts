import type { ITrack } from './TrackTypes';

/**
 * Event data stored in keyframe value
 */
export interface IEventData {
  type: 'script' | 'audio' | 'marker';
  name: string;
  params?: Record<string, unknown>;
}

/**
 * Event track result
 */
export interface IEventTrackResult {
  triggered: boolean;
  events: IEventData[];
}

/**
 * Evaluate event track and return triggered events
 * Events are triggered when playhead crosses their time point
 */
export function evaluateEventTrack(
  track: ITrack,
  currentTime: number,
  previousTime: number
): IEventTrackResult {
  const events: IEventData[] = [];
  const direction = currentTime >= previousTime ? 'forward' : 'backward';

  for (const keyframe of track.keyframes) {
    const eventTime = keyframe.time;

    // Check if playhead crossed this event's time
    const crossed =
      direction === 'forward'
        ? previousTime < eventTime && currentTime >= eventTime
        : previousTime > eventTime && currentTime <= eventTime;

    if (crossed) {
      const eventData = keyframe.value as unknown as IEventData;
      events.push(eventData);
    }
  }

  return {
    triggered: events.length > 0,
    events,
  };
}

/**
 * Get all event markers in track sorted by time
 */
export function getEventMarkers(track: ITrack): Array<{ time: number; event: IEventData }> {
  return track.keyframes.map((kf) => ({
    time: kf.time,
    event: kf.value as unknown as IEventData,
  }));
}
