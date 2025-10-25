use glam::Vec3;
use std::f32::consts::PI;

/// Calculates 3D spatial audio parameters
pub struct SpatialAudioCalculator {
    /// Speed of sound for doppler effect (m/s)
    pub speed_of_sound: f32,
}

impl SpatialAudioCalculator {
    /// Create a new spatial audio calculator
    pub fn new() -> Self {
        Self {
            speed_of_sound: 343.0, // Speed of sound in air at 20°C
        }
    }

    /// Calculate volume based on distance attenuation
    ///
    /// Uses inverse distance attenuation model similar to Three.js/Web Audio API:
    /// - Volume = 1.0 at distances <= min_distance
    /// - Volume attenuates between min_distance and max_distance
    /// - Volume = 0.0 at distances >= max_distance
    ///
    /// # Arguments
    /// * `sound_pos` - Position of the sound source
    /// * `listener_pos` - Position of the listener (camera)
    /// * `min_distance` - Reference distance (volume = 1.0 below this)
    /// * `max_distance` - Maximum audible distance (volume = 0.0 beyond this)
    /// * `rolloff_factor` - How quickly volume decreases (0.0 to 1.0+)
    pub fn calculate_volume(
        &self,
        sound_pos: Vec3,
        listener_pos: Vec3,
        min_distance: f32,
        max_distance: f32,
        rolloff_factor: f32,
    ) -> f32 {
        let distance = sound_pos.distance(listener_pos);

        // Clamp distance
        if distance <= min_distance {
            return 1.0;
        }

        if distance >= max_distance {
            return 0.0;
        }

        // Inverse distance model with rolloff
        // volume = min_distance / (min_distance + rolloff_factor * (distance - min_distance))
        let numerator = min_distance;
        let denominator = min_distance + rolloff_factor * (distance - min_distance);

        let volume = numerator / denominator;

        // Also apply linear falloff based on max distance
        let linear_falloff = 1.0 - ((distance - min_distance) / (max_distance - min_distance));

        // Combine both attenuation models
        (volume * linear_falloff).clamp(0.0, 1.0)
    }

    /// Calculate stereo pan based on relative position
    ///
    /// Returns pan value from -1.0 (full left) to 1.0 (full right)
    ///
    /// # Arguments
    /// * `sound_pos` - Position of the sound source
    /// * `listener_pos` - Position of the listener
    /// * `listener_forward` - Forward direction vector of the listener
    pub fn calculate_pan(
        &self,
        sound_pos: Vec3,
        listener_pos: Vec3,
        listener_forward: Vec3,
    ) -> f32 {
        let to_sound = (sound_pos - listener_pos).normalize_or_zero();

        if to_sound == Vec3::ZERO {
            return 0.0; // Sound at listener position = center
        }

        // Calculate listener's right vector (perpendicular to forward, assuming Y is up)
        let up = Vec3::Y;
        let listener_right = up.cross(listener_forward).normalize_or_zero();

        if listener_right == Vec3::ZERO {
            return 0.0; // Edge case: forward is straight up/down
        }

        // Dot product with right vector gives us left-right position
        // Positive = right, Negative = left
        let pan = to_sound.dot(listener_right);

        pan.clamp(-1.0, 1.0)
    }

    /// Calculate directional cone attenuation
    ///
    /// # Arguments
    /// * `sound_pos` - Position of the sound source
    /// * `sound_direction` - Direction the sound is emitting (normalized)
    /// * `listener_pos` - Position of the listener
    /// * `inner_angle` - Inner cone angle in degrees (full volume)
    /// * `outer_angle` - Outer cone angle in degrees (outer_gain volume)
    /// * `outer_gain` - Volume multiplier outside the cone (0.0 to 1.0)
    pub fn calculate_cone_attenuation(
        &self,
        sound_pos: Vec3,
        sound_direction: Vec3,
        listener_pos: Vec3,
        inner_angle: f32,
        outer_angle: f32,
        outer_gain: f32,
    ) -> f32 {
        // If angles are 360, no directionality
        if inner_angle >= 360.0 || outer_angle >= 360.0 {
            return 1.0;
        }

        let to_listener = (listener_pos - sound_pos).normalize_or_zero();

        if to_listener == Vec3::ZERO {
            return 1.0; // Listener at sound source
        }

        // Calculate angle between sound direction and listener direction
        let dot = sound_direction.dot(to_listener);
        let angle = dot.acos().to_degrees();

        // Convert cone angles from degrees to half-angles
        let inner_half = inner_angle / 2.0;
        let outer_half = outer_angle / 2.0;

        if angle <= inner_half {
            // Inside inner cone - full volume
            1.0
        } else if angle >= outer_half {
            // Outside outer cone - outer gain
            outer_gain
        } else {
            // In transition zone - interpolate
            let t = (angle - inner_half) / (outer_half - inner_half);
            1.0 + t * (outer_gain - 1.0)
        }
    }

    /// Calculate doppler effect pitch shift (not yet implemented)
    pub fn calculate_doppler_shift(
        &self,
        _sound_velocity: Vec3,
        _listener_velocity: Vec3,
        _to_sound: Vec3,
    ) -> f32 {
        // Placeholder for doppler effect
        // Would calculate pitch shift based on relative velocities
        1.0
    }
}

impl Default for SpatialAudioCalculator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_volume_at_min_distance() {
        let calc = SpatialAudioCalculator::new();

        let sound_pos = Vec3::new(5.0, 0.0, 0.0);
        let listener_pos = Vec3::new(0.0, 0.0, 0.0);

        // At exactly min_distance
        let volume = calc.calculate_volume(sound_pos, listener_pos, 5.0, 100.0, 1.0);
        assert_eq!(volume, 1.0);
    }

    #[test]
    fn test_volume_at_max_distance() {
        let calc = SpatialAudioCalculator::new();

        let sound_pos = Vec3::new(100.0, 0.0, 0.0);
        let listener_pos = Vec3::new(0.0, 0.0, 0.0);

        // At exactly max_distance
        let volume = calc.calculate_volume(sound_pos, listener_pos, 1.0, 100.0, 1.0);
        assert_eq!(volume, 0.0);
    }

    #[test]
    fn test_volume_between_distances() {
        let calc = SpatialAudioCalculator::new();

        let sound_pos = Vec3::new(50.0, 0.0, 0.0);
        let listener_pos = Vec3::new(0.0, 0.0, 0.0);

        let volume = calc.calculate_volume(sound_pos, listener_pos, 1.0, 100.0, 1.0);

        // Should be between 0 and 1
        assert!(volume > 0.0);
        assert!(volume < 1.0);
    }

    #[test]
    fn test_pan_right() {
        let calc = SpatialAudioCalculator::new();

        // Sound to the right
        let sound_pos = Vec3::new(10.0, 0.0, 0.0);
        let listener_pos = Vec3::ZERO;
        let listener_forward = Vec3::Z; // Looking forward (+Z)

        let pan = calc.calculate_pan(sound_pos, listener_pos, listener_forward);

        // Should be positive (right)
        assert!(pan > 0.0);
    }

    #[test]
    fn test_pan_left() {
        let calc = SpatialAudioCalculator::new();

        // Sound to the left
        let sound_pos = Vec3::new(-10.0, 0.0, 0.0);
        let listener_pos = Vec3::ZERO;
        let listener_forward = Vec3::Z;

        let pan = calc.calculate_pan(sound_pos, listener_pos, listener_forward);

        // Should be negative (left)
        assert!(pan < 0.0);
    }

    #[test]
    fn test_pan_center() {
        let calc = SpatialAudioCalculator::new();

        // Sound directly in front
        let sound_pos = Vec3::new(0.0, 0.0, 10.0);
        let listener_pos = Vec3::ZERO;
        let listener_forward = Vec3::Z;

        let pan = calc.calculate_pan(sound_pos, listener_pos, listener_forward);

        // Should be near zero (center)
        assert!(pan.abs() < 0.1);
    }

    #[test]
    fn test_cone_attenuation_inside() {
        let calc = SpatialAudioCalculator::new();

        let sound_pos = Vec3::ZERO;
        let sound_direction = Vec3::Z; // Pointing forward
        let listener_pos = Vec3::new(0.0, 0.0, 5.0); // Directly in front

        let attenuation = calc.calculate_cone_attenuation(
            sound_pos,
            sound_direction,
            listener_pos,
            45.0, // inner angle
            90.0, // outer angle
            0.1,  // outer gain
        );

        // Should be full volume (1.0) inside inner cone
        assert_eq!(attenuation, 1.0);
    }

    #[test]
    fn test_cone_attenuation_outside() {
        let calc = SpatialAudioCalculator::new();

        let sound_pos = Vec3::ZERO;
        let sound_direction = Vec3::Z; // Pointing forward
        let listener_pos = Vec3::new(0.0, 0.0, -5.0); // Behind the sound

        let attenuation = calc.calculate_cone_attenuation(
            sound_pos,
            sound_direction,
            listener_pos,
            45.0, // inner angle
            90.0, // outer angle
            0.1,  // outer gain
        );

        // Should be outer gain outside cone
        assert_eq!(attenuation, 0.1);
    }

    #[test]
    fn test_cone_no_directionality() {
        let calc = SpatialAudioCalculator::new();

        let sound_pos = Vec3::ZERO;
        let sound_direction = Vec3::Z;
        let listener_pos = Vec3::new(5.0, 0.0, 0.0);

        // 360 degree cone = no directionality
        let attenuation = calc.calculate_cone_attenuation(
            sound_pos,
            sound_direction,
            listener_pos,
            360.0,
            360.0,
            0.0,
        );

        assert_eq!(attenuation, 1.0);
    }
}
