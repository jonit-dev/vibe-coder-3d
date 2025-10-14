use std::time::{Duration, Instant};

pub struct FrameTimer {
    last_frame: Instant,
    delta_time: Duration,
    frame_count: u64,
    fps_update_timer: Duration,
    current_fps: f32,
}

impl FrameTimer {
    pub fn new() -> Self {
        Self {
            last_frame: Instant::now(),
            delta_time: Duration::ZERO,
            frame_count: 0,
            fps_update_timer: Duration::ZERO,
            current_fps: 0.0,
        }
    }

    pub fn tick(&mut self) {
        let now = Instant::now();
        self.delta_time = now - self.last_frame;
        self.last_frame = now;
        self.frame_count += 1;

        // Update FPS every second
        self.fps_update_timer += self.delta_time;
        if self.fps_update_timer.as_secs_f32() >= 1.0 {
            self.current_fps = self.frame_count as f32 / self.fps_update_timer.as_secs_f32();
            self.frame_count = 0;
            self.fps_update_timer = Duration::ZERO;
        }
    }

    pub fn delta_time(&self) -> Duration {
        self.delta_time
    }

    pub fn delta_seconds(&self) -> f32 {
        self.delta_time.as_secs_f32()
    }

    pub fn fps(&self) -> f32 {
        self.current_fps
    }
}

impl Default for FrameTimer {
    fn default() -> Self {
        Self::new()
    }
}
