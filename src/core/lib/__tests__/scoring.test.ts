import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useScoringStore, scoreUtils } from '../scoring';

describe('Scoring System', () => {
  beforeEach(() => {
    // Reset store before each test
    useScoringStore.getState().resetAll();
    // Manually reset highScore since resetAll doesn't touch it (by design)
    useScoringStore.setState({ highScore: 0 });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Scoring', () => {
    it('should start with zero score', () => {
      const { score } = useScoringStore.getState();
      expect(score).toBe(0);
    });

    it('should add points correctly', () => {
      const { addPoints } = useScoringStore.getState();

      addPoints(100, 'test-event');

      const { score } = useScoringStore.getState();
      expect(score).toBe(100);
    });

    it('should accumulate points from multiple events', () => {
      const { addPoints } = useScoringStore.getState();

      addPoints(100, 'event1'); // 100 * 1.0 (no combo bonus yet) = 100
      addPoints(50, 'event2'); // 50 * 1.1 (combo 2) = 55
      addPoints(25, 'event3'); // 25 * 1.2 (combo 3) = 30

      const { score } = useScoringStore.getState();
      expect(score).toBe(185); // 100 + 55 + 30
    });

    it('should update high score when exceeded', () => {
      const { addPoints, resetAll } = useScoringStore.getState();

      // Ensure clean state
      resetAll();

      addPoints(100, 'event1'); // 100 * 1.0 = 100
      expect(useScoringStore.getState().highScore).toBe(100);

      addPoints(50, 'event2'); // 50 * 1.1 = 55
      expect(useScoringStore.getState().highScore).toBe(155); // 100 + 55
    });

    it('should maintain high score even after reset', () => {
      const { addPoints, resetScore } = useScoringStore.getState();

      addPoints(500, 'event');
      expect(useScoringStore.getState().highScore).toBe(500);

      resetScore();
      expect(useScoringStore.getState().score).toBe(0);
      expect(useScoringStore.getState().highScore).toBe(500);
    });
  });

  describe('Score History', () => {
    it('should record score events', () => {
      const { addPoints } = useScoringStore.getState();

      addPoints(100, 'collect-coin');
      addPoints(500, 'defeat-enemy');

      const { scoreHistory } = useScoringStore.getState();
      expect(scoreHistory).toHaveLength(2);
      expect(scoreHistory[0].type).toBe('collect-coin');
      expect(scoreHistory[1].type).toBe('defeat-enemy');
    });

    it('should include metadata in score events', () => {
      const { addPoints } = useScoringStore.getState();

      addPoints(100, 'test', { enemyType: 'boss', location: 'arena' });

      const { scoreHistory } = useScoringStore.getState();
      expect(scoreHistory[0].metadata?.enemyType).toBe('boss');
      expect(scoreHistory[0].metadata?.location).toBe('arena');
    });

    it('should include base points and multipliers in metadata', () => {
      const { addPoints, addMultiplier } = useScoringStore.getState();

      addMultiplier('test', 2, 10000);
      addPoints(100, 'test');

      const { scoreHistory } = useScoringStore.getState();
      expect(scoreHistory[0].metadata?.basePoints).toBe(100);
      expect(scoreHistory[0].metadata?.multiplier).toBe(2);
    });

    it('should clear history on resetScore', () => {
      const { addPoints, resetScore } = useScoringStore.getState();

      addPoints(100, 'event1');
      addPoints(200, 'event2');

      resetScore();

      const { scoreHistory } = useScoringStore.getState();
      expect(scoreHistory).toHaveLength(0);
    });
  });

  describe('Multipliers', () => {
    it('should apply multiplier to points', () => {
      const { addMultiplier, addPoints } = useScoringStore.getState();

      addMultiplier('double', 2, 10000);
      addPoints(100, 'test');

      const { score } = useScoringStore.getState();
      expect(score).toBe(200);
    });

    it('should stack multiple multipliers', () => {
      const { addMultiplier, addPoints } = useScoringStore.getState();

      addMultiplier('mult1', 2, 10000);
      addMultiplier('mult2', 1.5, 10000);
      addPoints(100, 'test');

      const { score } = useScoringStore.getState();
      expect(score).toBe(300); // 100 * 2 * 1.5
    });

    it('should replace existing multiplier with same ID', () => {
      const { addMultiplier, addPoints } = useScoringStore.getState();

      addMultiplier('test', 2, 10000);
      addMultiplier('test', 3, 10000);
      addPoints(100, 'test');

      const { score } = useScoringStore.getState();
      expect(score).toBe(300); // Only 3x multiplier applied
    });

    it('should remove multiplier by ID', () => {
      const { addMultiplier, removeMultiplier, addPoints } = useScoringStore.getState();

      addMultiplier('temp', 2, 10000);
      removeMultiplier('temp');
      addPoints(100, 'test');

      const { score } = useScoringStore.getState();
      expect(score).toBe(100);
    });

    it('should support permanent multipliers (duration 0)', () => {
      const { addMultiplier, addPoints } = useScoringStore.getState();

      addMultiplier('permanent', 2, 0);

      addPoints(100, 'event1');
      vi.advanceTimersByTime(100000);
      addPoints(100, 'event2');

      const { score } = useScoringStore.getState();
      expect(score).toBe(400); // Both events get 2x multiplier
    });

    it('should expire timed multipliers', () => {
      const { addMultiplier, addPoints } = useScoringStore.getState();

      addMultiplier('temp', 2, 1000); // 1 second duration

      addPoints(100, 'event1'); // 100 * 2 (multiplier) * 1.0 (no combo) = 200
      expect(useScoringStore.getState().score).toBe(200);

      vi.advanceTimersByTime(1001);
      addPoints(100, 'event2'); // 100 * 1.0 (no multiplier) * 1.1 (combo 2) = 110

      const { score } = useScoringStore.getState();
      expect(score).toBe(310); // 200 + 110
    });
  });

  describe('Combo System', () => {
    it('should start with zero combo', () => {
      const { comboCount } = useScoringStore.getState();
      expect(comboCount).toBe(0);
    });

    it('should increment combo on consecutive points', () => {
      const { addPoints } = useScoringStore.getState();

      addPoints(100, 'hit1');
      addPoints(100, 'hit2');
      addPoints(100, 'hit3');

      const { comboCount } = useScoringStore.getState();
      expect(comboCount).toBe(3);
    });

    it('should apply combo bonus to points (10% per combo, max 2x)', () => {
      const { addPoints } = useScoringStore.getState();

      addPoints(100, 'hit1'); // combo 1: 100 * 1.0 = 100
      addPoints(100, 'hit2'); // combo 2: 100 * 1.1 = 110
      addPoints(100, 'hit3'); // combo 3: 100 * 1.2 = 120

      const { score } = useScoringStore.getState();
      expect(score).toBe(330);
    });

    it('should cap combo bonus at 2x', () => {
      const { addPoints } = useScoringStore.getState();

      // Build up to 10+ combo
      for (let i = 0; i < 12; i++) {
        addPoints(100, `hit${i}`);
      }

      const { scoreHistory } = useScoringStore.getState();
      const lastEvent = scoreHistory[scoreHistory.length - 1];
      expect(lastEvent.metadata?.comboBonus).toBe(2); // Capped at 2x
    });

    it('should reset combo after time window expires', () => {
      const { addPoints } = useScoringStore.getState();

      addPoints(100, 'hit1');
      addPoints(100, 'hit2');

      expect(useScoringStore.getState().comboCount).toBe(2);

      vi.advanceTimersByTime(5001); // Default window is 5000ms

      expect(useScoringStore.getState().comboCount).toBe(0);
    });

    it('should extend combo timer on each hit', () => {
      const { addPoints } = useScoringStore.getState();

      addPoints(100, 'hit1');
      vi.advanceTimersByTime(4000);

      addPoints(100, 'hit2');
      vi.advanceTimersByTime(4000);

      addPoints(100, 'hit3');

      // Combo should still be active
      expect(useScoringStore.getState().comboCount).toBe(3);
    });

    it('should allow manual combo reset', () => {
      const { addPoints, resetCombo } = useScoringStore.getState();

      addPoints(100, 'hit1');
      addPoints(100, 'hit2');

      resetCombo();

      expect(useScoringStore.getState().comboCount).toBe(0);
    });
  });

  describe('Reset Functions', () => {
    it('should reset only score with resetScore', () => {
      const { addPoints, addMultiplier, resetScore } = useScoringStore.getState();

      addPoints(100, 'event');
      addMultiplier('test', 2, 10000);

      resetScore();

      const state = useScoringStore.getState();
      expect(state.score).toBe(0);
      expect(state.scoreHistory).toHaveLength(0);
      expect(state.multipliers).toHaveLength(1); // Multiplier remains
    });

    it('should reset everything with resetAll', () => {
      const { addPoints, addMultiplier, resetAll } = useScoringStore.getState();

      addPoints(100, 'event');
      addMultiplier('test', 2, 10000);

      // Build combo
      addPoints(10, 'combo1');
      addPoints(10, 'combo2');

      resetAll();

      const state = useScoringStore.getState();
      expect(state.score).toBe(0);
      expect(state.scoreHistory).toHaveLength(0);
      expect(state.multipliers).toHaveLength(0);
      expect(state.comboCount).toBe(0);
      expect(state.comboTimer).toBe(null);
    });
  });
});

describe('Score Utils', () => {
  describe('calculateTimeBasedScore', () => {
    it('should return full score at zero time', () => {
      const result = scoreUtils.calculateTimeBasedScore(100, 0, 10000);
      expect(result).toBe(100);
    });

    it('should return zero score at max time', () => {
      const result = scoreUtils.calculateTimeBasedScore(100, 10000, 10000);
      expect(result).toBe(0);
    });

    it('should return half score at half time', () => {
      const result = scoreUtils.calculateTimeBasedScore(100, 5000, 10000);
      expect(result).toBe(50);
    });

    it('should floor fractional scores', () => {
      const result = scoreUtils.calculateTimeBasedScore(100, 3333, 10000);
      expect(result).toBe(66); // 66.67 floored
    });

    it('should handle time exceeding max time', () => {
      const result = scoreUtils.calculateTimeBasedScore(100, 15000, 10000);
      expect(result).toBe(0);
    });
  });

  describe('calculateDistanceBasedScore', () => {
    it('should return full score at zero distance', () => {
      const result = scoreUtils.calculateDistanceBasedScore(100, 0, 100);
      expect(result).toBe(100);
    });

    it('should return zero score at max distance', () => {
      const result = scoreUtils.calculateDistanceBasedScore(100, 100, 100);
      expect(result).toBe(0);
    });

    it('should return half score at half distance', () => {
      const result = scoreUtils.calculateDistanceBasedScore(100, 50, 100);
      expect(result).toBe(50);
    });

    it('should handle distance exceeding max distance', () => {
      const result = scoreUtils.calculateDistanceBasedScore(100, 150, 100);
      expect(result).toBe(0);
    });
  });

  describe('calculateStreakBonus', () => {
    it('should return base score for zero streak', () => {
      const result = scoreUtils.calculateStreakBonus(100, 0);
      expect(result).toBe(100);
    });

    it('should add 10% per streak level', () => {
      expect(scoreUtils.calculateStreakBonus(100, 1)).toBe(110);
      expect(scoreUtils.calculateStreakBonus(100, 2)).toBe(120);
      expect(scoreUtils.calculateStreakBonus(100, 5)).toBe(150);
    });

    it('should cap at default 10 streak', () => {
      const result = scoreUtils.calculateStreakBonus(100, 20);
      expect(result).toBe(200); // 100 * (1 + 10 * 0.1)
    });

    it('should support custom cap', () => {
      const result = scoreUtils.calculateStreakBonus(100, 20, 5);
      expect(result).toBe(150); // 100 * (1 + 5 * 0.1)
    });
  });

  describe('formatScore', () => {
    it('should format score with commas', () => {
      expect(scoreUtils.formatScore(1000)).toBe('1,000');
      expect(scoreUtils.formatScore(1000000)).toBe('1,000,000');
    });

    it('should handle small scores', () => {
      expect(scoreUtils.formatScore(0)).toBe('0');
      expect(scoreUtils.formatScore(99)).toBe('99');
    });

    it('should handle large scores', () => {
      expect(scoreUtils.formatScore(123456789)).toBe('123,456,789');
    });
  });
});
