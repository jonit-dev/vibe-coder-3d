#[cfg(test)]
mod tests {
    use super::super::time::FrameTimer;
    use std::time::Duration;

    #[test]
    fn test_frame_timer_new() {
        let timer = FrameTimer::new();

        assert_eq!(timer.delta_time(), Duration::ZERO);
        assert_eq!(timer.delta_seconds(), 0.0);
        assert_eq!(timer.fps(), 0.0);
    }

    #[test]
    fn test_frame_timer_default() {
        let timer = FrameTimer::default();

        assert_eq!(timer.delta_time(), Duration::ZERO);
        assert_eq!(timer.delta_seconds(), 0.0);
        assert_eq!(timer.fps(), 0.0);
    }

    #[test]
    fn test_frame_timer_tick() {
        let mut timer = FrameTimer::new();

        // Sleep for a short duration to ensure time passes
        std::thread::sleep(Duration::from_millis(10));

        timer.tick();

        // Delta time should be greater than zero after tick
        assert!(timer.delta_time() > Duration::ZERO);
        assert!(timer.delta_seconds() > 0.0);
    }

    #[test]
    fn test_frame_timer_multiple_ticks() {
        let mut timer = FrameTimer::new();

        for _ in 0..5 {
            std::thread::sleep(Duration::from_millis(10));
            timer.tick();

            // Each tick should update delta time
            assert!(timer.delta_time() > Duration::ZERO);
            assert!(timer.delta_seconds() > 0.0);
        }
    }

    #[test]
    fn test_frame_timer_delta_seconds() {
        let mut timer = FrameTimer::new();

        std::thread::sleep(Duration::from_millis(50));
        timer.tick();

        let delta = timer.delta_seconds();

        // Delta should be approximately 0.05 seconds (50ms), with some tolerance
        assert!(delta >= 0.04 && delta <= 0.1);
    }

    #[test]
    fn test_frame_timer_fps_calculation() {
        let mut timer = FrameTimer::new();

        // Simulate frames over one second
        let frame_duration = Duration::from_millis(16); // ~60 FPS

        for _ in 0..65 {
            // 65 * 16ms = 1040ms, slightly more than 1 second to trigger FPS calculation
            std::thread::sleep(frame_duration);
            timer.tick();
        }

        // FPS should be calculated after 1 second
        let fps = timer.fps();

        // FPS should be approximately 60, with reasonable tolerance
        assert!(
            fps > 0.0,
            "FPS should be greater than 0 after 1 second, got {}",
            fps
        );
        assert!(
            fps >= 50.0 && fps <= 70.0,
            "FPS should be approximately 60, got {}",
            fps
        );
    }

    #[test]
    fn test_frame_timer_fps_initial() {
        let timer = FrameTimer::new();

        // FPS should be 0 before any ticks complete a full second
        assert_eq!(timer.fps(), 0.0);
    }

    #[test]
    fn test_frame_timer_consistent_delta() {
        let mut timer = FrameTimer::new();

        let sleep_duration = Duration::from_millis(20);

        std::thread::sleep(sleep_duration);
        timer.tick();
        let delta1 = timer.delta_time();

        std::thread::sleep(sleep_duration);
        timer.tick();
        let delta2 = timer.delta_time();

        // Both deltas should be roughly similar
        let diff = if delta1 > delta2 {
            delta1 - delta2
        } else {
            delta2 - delta1
        };

        // Difference should be small (within 10ms tolerance)
        assert!(diff < Duration::from_millis(10));
    }

    #[test]
    fn test_frame_timer_zero_initial_delta() {
        let timer = FrameTimer::new();

        // Before first tick, delta should be zero
        assert_eq!(timer.delta_time(), Duration::ZERO);
        assert_eq!(timer.delta_seconds(), 0.0);
    }

    #[test]
    fn test_frame_timer_fps_resets() {
        let mut timer = FrameTimer::new();

        // Run enough frames to trigger FPS calculation
        for _ in 0..65 {
            std::thread::sleep(Duration::from_millis(16));
            timer.tick();
        }

        let fps1 = timer.fps();
        assert!(fps1 > 0.0);

        // Continue and check FPS is still being calculated
        for _ in 0..65 {
            std::thread::sleep(Duration::from_millis(16));
            timer.tick();
        }

        let fps2 = timer.fps();
        assert!(fps2 > 0.0);
    }

    #[test]
    fn test_frame_timer_very_fast_frames() {
        let mut timer = FrameTimer::new();

        // Very fast frames (no sleep)
        for _ in 0..10 {
            timer.tick();
        }

        // Should still have delta time (though very small)
        assert!(timer.delta_time() >= Duration::ZERO);
        assert!(timer.delta_seconds() >= 0.0);
    }

    #[test]
    fn test_frame_timer_slow_frames() {
        let mut timer = FrameTimer::new();

        // Slow frame (100ms)
        std::thread::sleep(Duration::from_millis(100));
        timer.tick();

        let delta = timer.delta_seconds();

        // Delta should be approximately 0.1 seconds
        assert!(delta >= 0.09 && delta <= 0.15);
    }
}
