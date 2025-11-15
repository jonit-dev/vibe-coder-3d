import { defineAnimationClip } from '@core/animation/assets/defineAnimations';

export default defineAnimationClip({
  id: 'float',
  name: 'Float Animation',
  duration: 4.0,
  loop: true,
  timeScale: 1.0,
  tracks: [
    {
      id: 'float_position_y',
      type: 'transform.position',
      targetPath: 'root',
      keyframes: [
        { time: 0, value: [0, 0.6, 0], easing: 'linear' },
        { time: 2, value: [0, 1.2, 0], easing: 'linear' },
        { time: 4, value: [0, 0.6, 0], easing: 'linear' },
      ],
    },
  ],
  tags: ['test', 'physics'],
  description: 'Simple floating animation for testing',
});
