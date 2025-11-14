import { describe, it, expect } from 'vitest';
import {
  evaluateEventTrack,
  getEventMarkers,
  type IEventData,
  type IEventTrackResult,
} from '../EventTrack';
import type { ITrack } from '../TrackTypes';
import { TrackType } from '../TrackTypes';

describe('EventTrack', () => {
  let eventTrack: ITrack;
  let sampleEvent: IEventData;

  beforeEach(() => {
    sampleEvent = {
      type: 'script',
      name: 'playSound',
      params: { soundId: 'footstep', volume: 0.8 },
    };

    eventTrack = {
      id: 'event-track',
      type: TrackType.EVENT,
      targetPath: 'character',
      keyframes: [
        { time: 0, value: sampleEvent },
        { time: 1, value: { type: 'audio', name: 'music_start' } },
        { time: 2, value: { type: 'marker', name: 'checkpoint' } },
      ],
    };
  });

  describe('evaluateEventTrack', () => {
    it('should return no events when track is empty', () => {
      const emptyTrack: ITrack = {
        id: 'empty',
        type: TrackType.EVENT,
        targetPath: 'test',
        keyframes: [],
      };

      const result = evaluateEventTrack(emptyTrack, 1, 0);
      expect(result.triggered).toBe(false);
      expect(result.events).toHaveLength(0);
    });

    it('should trigger event when playhead crosses event time forward', () => {
      const result = evaluateEventTrack(eventTrack, 0.5, -0.5);
      expect(result.triggered).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual(sampleEvent);
    });

    it('should trigger event when playhead lands exactly on event time', () => {
      const result = evaluateEventTrack(eventTrack, 1, 0.5);
      expect(result.triggered).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].name).toBe('music_start');
    });

    it('should trigger multiple events when crossing multiple times', () => {
      const result = evaluateEventTrack(eventTrack, 2.5, 0.5);
      expect(result.triggered).toBe(true);
      expect(result.events).toHaveLength(2);
      expect(result.events[0].name).toBe('music_start');
      expect(result.events[1].name).toBe('checkpoint');
    });

    it('should not trigger events when moving backward', () => {
      // Move backward from 0.8 to 0.6 - doesn't cross any events
      const result = evaluateEventTrack(eventTrack, 0.6, 0.8);
      expect(result.triggered).toBe(false);
      expect(result.events).toHaveLength(0);
    });

    it('should trigger events when moving backward', () => {
      const result = evaluateEventTrack(eventTrack, 0.5, 1.5);
      expect(result.triggered).toBe(true);  // Moving backward from 1.5 to 0.5 crosses event at 1.0
      expect(result.events).toHaveLength(1);
      expect(result.events[0].name).toBe('music_start');
    });

    it('should not trigger events when no time crossing occurs', () => {
      // Both times in same interval, no crossing
      const result1 = evaluateEventTrack(eventTrack, 0.3, 0.1);
      expect(result1.triggered).toBe(false);

      const result2 = evaluateEventTrack(eventTrack, 1.5, 1.2);
      expect(result2.triggered).toBe(false);

      const result3 = evaluateEventTrack(eventTrack, 2.5, 2.1);
      expect(result3.triggered).toBe(false);
    });

    it('should handle same previous and current time', () => {
      const result = evaluateEventTrack(eventTrack, 1, 1);
      expect(result.triggered).toBe(false);
      expect(result.events).toHaveLength(0);
    });

    it('should trigger events at time 0 when starting from negative time', () => {
      const result = evaluateEventTrack(eventTrack, 0, -0.1);
      expect(result.triggered).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual(sampleEvent);
    });

    it('should handle events with complex parameters', () => {
      const complexTrack: ITrack = {
        id: 'complex-event',
        type: TrackType.EVENT,
        targetPath: 'test',
        keyframes: [
          {
            time: 1,
            value: {
              type: 'script',
              name: 'complexAction',
              params: {
                target: 'enemy1',
                damage: 50,
                effects: ['fire', 'ice'],
                position: { x: 10, y: 0, z: 5 },
              },
            },
          },
        ],
      };

      const result = evaluateEventTrack(complexTrack, 1.5, 0.5);
      expect(result.triggered).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].params).toEqual({
        target: 'enemy1',
        damage: 50,
        effects: ['fire', 'ice'],
        position: { x: 10, y: 0, z: 5 },
      });
    });

    it('should handle events with no parameters', () => {
      const noParamsTrack: ITrack = {
        id: 'no-params',
        type: TrackType.EVENT,
        targetPath: 'test',
        keyframes: [
          { time: 1, value: { type: 'marker', name: 'start' } },
        ],
      };

      const result = evaluateEventTrack(noParamsTrack, 1.5, 0.5);
      expect(result.triggered).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].params).toBeUndefined();
    });

    it('should handle all event types', () => {
      const allTypesTrack: ITrack = {
        id: 'all-types',
        type: TrackType.EVENT,
        targetPath: 'test',
        keyframes: [
          { time: 1, value: { type: 'script', name: 'script_event' } },
          { time: 2, value: { type: 'audio', name: 'audio_event' } },
          { time: 3, value: { type: 'marker', name: 'marker_event' } },
        ],
      };

      // Trigger all events
      const result = evaluateEventTrack(allTypesTrack, 3.5, 0.5);
      expect(result.triggered).toBe(true);
      expect(result.events).toHaveLength(3);

      const eventNames = result.events.map(e => e.name);
      expect(eventNames).toContain('script_event');
      expect(eventNames).toContain('audio_event');
      expect(eventNames).toContain('marker_event');

      const eventTypes = result.events.map(e => e.type);
      expect(eventTypes).toContain('script');
      expect(eventTypes).toContain('audio');
      expect(eventTypes).toContain('marker');
    });

    it('should handle events at very precise times', () => {
      const preciseTrack: ITrack = {
        id: 'precise',
        type: TrackType.EVENT,
        targetPath: 'test',
        keyframes: [
          { time: 0.001, value: { type: 'marker', name: 'precise' } },
        ],
      };

      const result = evaluateEventTrack(preciseTrack, 0.002, 0);
      expect(result.triggered).toBe(true);
      expect(result.events).toHaveLength(1);
    });

    it('should handle events with decimal times', () => {
      const decimalTrack: ITrack = {
        id: 'decimal',
        type: TrackType.EVENT,
        targetPath: 'test',
        keyframes: [
          { time: 0.5, value: { type: 'marker', name: 'half_second' } },
          { time: 1.75, value: { type: 'marker', name: 'one_point_seven_five' } },
        ],
      };

      // Trigger first event
      let result = evaluateEventTrack(decimalTrack, 0.6, 0.4);
      expect(result.triggered).toBe(true);
      expect(result.events[0].name).toBe('half_second');

      // Trigger second event
      result = evaluateEventTrack(decimalTrack, 1.8, 1.7);
      expect(result.triggered).toBe(true);
      expect(result.events[0].name).toBe('one_point_seven_five');
    });

    it('should handle duplicate event times', () => {
      const duplicateTrack: ITrack = {
        id: 'duplicate',
        type: TrackType.EVENT,
        targetPath: 'test',
        keyframes: [
          { time: 1, value: { type: 'marker', name: 'event1' } },
          { time: 1, value: { type: 'marker', name: 'event2' } },
        ],
      };

      const result = evaluateEventTrack(duplicateTrack, 1.5, 0.5);
      expect(result.triggered).toBe(true);
      expect(result.events).toHaveLength(2);

      const eventNames = result.events.map(e => e.name);
      expect(eventNames).toContain('event1');
      expect(eventNames).toContain('event2');
    });
  });

  describe('getEventMarkers', () => {
    it('should return all events with their times', () => {
      const markers = getEventMarkers(eventTrack);
      expect(markers).toHaveLength(3);

      expect(markers[0]).toEqual({ time: 0, event: sampleEvent });
      expect(markers[1]).toEqual({ time: 1, event: { type: 'audio', name: 'music_start' } });
      expect(markers[2]).toEqual({ time: 2, event: { type: 'marker', name: 'checkpoint' } });
    });

    it('should return empty array for empty track', () => {
      const emptyTrack: ITrack = {
        id: 'empty',
        type: TrackType.EVENT,
        targetPath: 'test',
        keyframes: [],
      };

      const markers = getEventMarkers(emptyTrack);
      expect(markers).toHaveLength(0);
    });

    it('should preserve original order of events', () => {
      const unorderedTrack: ITrack = {
        id: 'unordered',
        type: TrackType.EVENT,
        targetPath: 'test',
        keyframes: [
          { time: 2, value: { type: 'marker', name: 'last' } },
          { time: 0, value: { type: 'marker', name: 'first' } },
          { time: 1, value: { type: 'marker', name: 'second' } },
        ],
      };

      const markers = getEventMarkers(unorderedTrack);
      expect(markers).toHaveLength(3);
      expect(markers[0].event.name).toBe('last'); // Preserves original order
      expect(markers[1].event.name).toBe('first');
      expect(markers[2].event.name).toBe('second');
    });

    it('should handle complex event data', () => {
      const complexTrack: ITrack = {
        id: 'complex-markers',
        type: TrackType.EVENT,
        targetPath: 'test',
        keyframes: [
          {
            time: 1,
            value: {
              type: 'script',
              name: 'complex',
              params: { nested: { value: 42 }, array: [1, 2, 3] },
            },
          },
        ],
      };

      const markers = getEventMarkers(complexTrack);
      expect(markers).toHaveLength(1);
      expect(markers[0].event.params).toEqual({
        nested: { value: 42 },
        array: [1, 2, 3],
      });
    });
  });

  describe('IEventData interface', () => {
    it('should support all event types', () => {
      const scriptEvent: IEventData = {
        type: 'script',
        name: 'myScript',
        params: { param1: 'value1' },
      };

      const audioEvent: IEventData = {
        type: 'audio',
        name: 'myAudio',
        params: { volume: 0.8, loop: true },
      };

      const markerEvent: IEventData = {
        type: 'marker',
        name: 'myMarker',
      };

      expect(scriptEvent.type).toBe('script');
      expect(audioEvent.type).toBe('audio');
      expect(markerEvent.type).toBe('marker');
    });
  });

  describe('IEventTrackResult interface', () => {
    it('should correctly represent result structure', () => {
      const result: IEventTrackResult = {
        triggered: true,
        events: [
          { type: 'marker', name: 'test' },
        ],
      };

      expect(result.triggered).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].name).toBe('test');
    });
  });

  describe('Edge cases', () => {
    it('should handle negative times', () => {
      const negativeTrack: ITrack = {
        id: 'negative',
        type: TrackType.EVENT,
        targetPath: 'test',
        keyframes: [
          { time: -1, value: { type: 'marker', name: 'negative_time' } },
        ],
      };

      const result = evaluateEventTrack(negativeTrack, 0, -2);
      expect(result.triggered).toBe(true);
      expect(result.events[0].name).toBe('negative_time');
    });

    it('should handle very large times', () => {
      const largeTrack: ITrack = {
        id: 'large',
        type: TrackType.EVENT,
        targetPath: 'test',
        keyframes: [
          { time: 1000000, value: { type: 'marker', name: 'large_time' } },
        ],
      };

      const result = evaluateEventTrack(largeTrack, 1000001, 999999);
      expect(result.triggered).toBe(true);
      expect(result.events[0].name).toBe('large_time');
    });

    it('should handle zero duration crossing', () => {
      const result = evaluateEventTrack(eventTrack, 1, 1);
      expect(result.triggered).toBe(false);
    });

    it('should handle undefined parameters in events', () => {
      const undefinedParamsTrack: ITrack = {
        id: 'undefined-params',
        type: TrackType.EVENT,
        targetPath: 'test',
        keyframes: [
          { time: 1, value: { type: 'script', name: 'test', params: undefined } },
        ],
      };

      const result = evaluateEventTrack(undefinedParamsTrack, 1.5, 0.5);
      expect(result.triggered).toBe(true);
      expect(result.events[0].params).toBeUndefined();
    });
  });
});