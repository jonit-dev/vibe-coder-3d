/// Simple text overlay for debug UI
///
/// Renders text using basic line-based characters
use crate::debug::LineBatch;
use glam::Vec3;

/// Add text to line batch using simple line-based characters
pub fn append_text(batch: &mut LineBatch, text: &str, position: Vec3, size: f32, color: [f32; 3]) {
    let mut cursor_x = position.x;
    let cursor_y = position.y;

    for ch in text.chars() {
        draw_char(
            batch,
            ch,
            Vec3::new(cursor_x, cursor_y, position.z),
            size,
            color,
        );
        cursor_x += size * 0.7; // Character spacing
    }
}

/// Draw a single character using lines
fn draw_char(batch: &mut LineBatch, ch: char, pos: Vec3, size: f32, color: [f32; 3]) {
    let s = size;
    let h = size * 0.5;
    let q = size * 0.25;

    match ch {
        'R' => {
            // Vertical line
            batch.add_line(pos, pos + Vec3::new(0.0, s, 0.0), color);
            // Top horizontal
            batch.add_line(
                pos + Vec3::new(0.0, s, 0.0),
                pos + Vec3::new(h, s, 0.0),
                color,
            );
            // Middle horizontal
            batch.add_line(
                pos + Vec3::new(0.0, h, 0.0),
                pos + Vec3::new(h, h, 0.0),
                color,
            );
            // Top right vertical
            batch.add_line(
                pos + Vec3::new(h, s, 0.0),
                pos + Vec3::new(h, h, 0.0),
                color,
            );
            // Diagonal
            batch.add_line(
                pos + Vec3::new(h * 0.5, h, 0.0),
                pos + Vec3::new(h, 0.0, 0.0),
                color,
            );
        }
        'I' => {
            // Vertical line
            batch.add_line(pos, pos + Vec3::new(0.0, s, 0.0), color);
        }
        'G' => {
            // Top horizontal
            batch.add_line(
                pos + Vec3::new(0.0, s, 0.0),
                pos + Vec3::new(h, s, 0.0),
                color,
            );
            // Left vertical
            batch.add_line(pos, pos + Vec3::new(0.0, s, 0.0), color);
            // Bottom horizontal
            batch.add_line(pos, pos + Vec3::new(h, 0.0, 0.0), color);
            // Right vertical (bottom half)
            batch.add_line(
                pos + Vec3::new(h, 0.0, 0.0),
                pos + Vec3::new(h, h, 0.0),
                color,
            );
            // Middle horizontal (right side)
            batch.add_line(
                pos + Vec3::new(h * 0.5, h, 0.0),
                pos + Vec3::new(h, h, 0.0),
                color,
            );
        }
        'H' => {
            // Left vertical
            batch.add_line(pos, pos + Vec3::new(0.0, s, 0.0), color);
            // Right vertical
            batch.add_line(
                pos + Vec3::new(h, 0.0, 0.0),
                pos + Vec3::new(h, s, 0.0),
                color,
            );
            // Middle horizontal
            batch.add_line(
                pos + Vec3::new(0.0, h, 0.0),
                pos + Vec3::new(h, h, 0.0),
                color,
            );
        }
        'T' => {
            // Top horizontal
            batch.add_line(
                pos + Vec3::new(-q, s, 0.0),
                pos + Vec3::new(h + q, s, 0.0),
                color,
            );
            // Vertical (center)
            batch.add_line(
                pos + Vec3::new(q, 0.0, 0.0),
                pos + Vec3::new(q, s, 0.0),
                color,
            );
        }
        'M' => {
            // Left vertical
            batch.add_line(pos, pos + Vec3::new(0.0, s, 0.0), color);
            // Left diagonal
            batch.add_line(
                pos + Vec3::new(0.0, s, 0.0),
                pos + Vec3::new(q, h, 0.0),
                color,
            );
            // Right diagonal
            batch.add_line(
                pos + Vec3::new(q, h, 0.0),
                pos + Vec3::new(h, s, 0.0),
                color,
            );
            // Right vertical
            batch.add_line(
                pos + Vec3::new(h, s, 0.0),
                pos + Vec3::new(h, 0.0, 0.0),
                color,
            );
        }
        'O' => {
            // Top
            batch.add_line(
                pos + Vec3::new(0.0, s, 0.0),
                pos + Vec3::new(h, s, 0.0),
                color,
            );
            // Bottom
            batch.add_line(pos, pos + Vec3::new(h, 0.0, 0.0), color);
            // Left
            batch.add_line(pos, pos + Vec3::new(0.0, s, 0.0), color);
            // Right
            batch.add_line(
                pos + Vec3::new(h, 0.0, 0.0),
                pos + Vec3::new(h, s, 0.0),
                color,
            );
        }
        'U' => {
            // Left vertical
            batch.add_line(pos, pos + Vec3::new(0.0, s, 0.0), color);
            // Bottom
            batch.add_line(pos, pos + Vec3::new(h, 0.0, 0.0), color);
            // Right vertical
            batch.add_line(
                pos + Vec3::new(h, 0.0, 0.0),
                pos + Vec3::new(h, s, 0.0),
                color,
            );
        }
        'S' => {
            // Top horizontal
            batch.add_line(
                pos + Vec3::new(0.0, s, 0.0),
                pos + Vec3::new(h, s, 0.0),
                color,
            );
            // Middle horizontal
            batch.add_line(
                pos + Vec3::new(0.0, h, 0.0),
                pos + Vec3::new(h, h, 0.0),
                color,
            );
            // Bottom horizontal
            batch.add_line(pos, pos + Vec3::new(h, 0.0, 0.0), color);
            // Top left vertical
            batch.add_line(
                pos + Vec3::new(0.0, s, 0.0),
                pos + Vec3::new(0.0, h, 0.0),
                color,
            );
            // Bottom right vertical
            batch.add_line(
                pos + Vec3::new(h, h, 0.0),
                pos + Vec3::new(h, 0.0, 0.0),
                color,
            );
        }
        'E' => {
            // Left vertical
            batch.add_line(pos, pos + Vec3::new(0.0, s, 0.0), color);
            // Top horizontal
            batch.add_line(
                pos + Vec3::new(0.0, s, 0.0),
                pos + Vec3::new(h, s, 0.0),
                color,
            );
            // Middle horizontal
            batch.add_line(
                pos + Vec3::new(0.0, h, 0.0),
                pos + Vec3::new(h, h, 0.0),
                color,
            );
            // Bottom horizontal
            batch.add_line(pos, pos + Vec3::new(h, 0.0, 0.0), color);
        }
        '+' => {
            // Horizontal
            batch.add_line(
                pos + Vec3::new(0.0, h, 0.0),
                pos + Vec3::new(h, h, 0.0),
                color,
            );
            // Vertical
            batch.add_line(
                pos + Vec3::new(q, q, 0.0),
                pos + Vec3::new(q, s - q, 0.0),
                color,
            );
        }
        'D' => {
            // Left vertical
            batch.add_line(pos, pos + Vec3::new(0.0, s, 0.0), color);
            // Top horizontal
            batch.add_line(
                pos + Vec3::new(0.0, s, 0.0),
                pos + Vec3::new(h * 0.8, s, 0.0),
                color,
            );
            // Bottom horizontal
            batch.add_line(pos, pos + Vec3::new(h * 0.8, 0.0, 0.0), color);
            // Right curve (simplified as two lines)
            batch.add_line(
                pos + Vec3::new(h * 0.8, s, 0.0),
                pos + Vec3::new(h, h, 0.0),
                color,
            );
            batch.add_line(
                pos + Vec3::new(h, h, 0.0),
                pos + Vec3::new(h * 0.8, 0.0, 0.0),
                color,
            );
        }
        'R' => {
            // Already defined above
            draw_char(batch, 'R', pos, size, color);
        }
        'A' => {
            // Left diagonal
            batch.add_line(pos, pos + Vec3::new(q, s, 0.0), color);
            // Right diagonal
            batch.add_line(
                pos + Vec3::new(q, s, 0.0),
                pos + Vec3::new(h, 0.0, 0.0),
                color,
            );
            // Middle horizontal
            batch.add_line(
                pos + Vec3::new(q * 0.5, h, 0.0),
                pos + Vec3::new(h - q * 0.5, h, 0.0),
                color,
            );
        }
        'W' => {
            // Left vertical
            batch.add_line(pos, pos + Vec3::new(0.0, s, 0.0), color);
            // Left diagonal down
            batch.add_line(pos, pos + Vec3::new(q, h, 0.0), color);
            // Middle diagonal up
            batch.add_line(
                pos + Vec3::new(q, h, 0.0),
                pos + Vec3::new(h * 0.5, s * 0.6, 0.0),
                color,
            );
            // Right diagonal down
            batch.add_line(
                pos + Vec3::new(h * 0.5, s * 0.6, 0.0),
                pos + Vec3::new(h, 0.0, 0.0),
                color,
            );
            // Right vertical
            batch.add_line(
                pos + Vec3::new(h, 0.0, 0.0),
                pos + Vec3::new(h, s, 0.0),
                color,
            );
        }
        'L' => {
            // Vertical
            batch.add_line(pos, pos + Vec3::new(0.0, s, 0.0), color);
            // Bottom horizontal
            batch.add_line(pos, pos + Vec3::new(h, 0.0, 0.0), color);
        }
        ':' => {
            // Top dot
            batch.add_line(
                pos + Vec3::new(q, s * 0.7, 0.0),
                pos + Vec3::new(q, s * 0.75, 0.0),
                color,
            );
            // Bottom dot
            batch.add_line(
                pos + Vec3::new(q, s * 0.25, 0.0),
                pos + Vec3::new(q, s * 0.3, 0.0),
                color,
            );
        }
        '/' => {
            // Diagonal
            batch.add_line(pos, pos + Vec3::new(h, s, 0.0), color);
        }
        ' ' => {
            // Space - no lines
        }
        _ => {
            // Unknown character - draw a box
            batch.add_line(pos, pos + Vec3::new(h, 0.0, 0.0), color);
            batch.add_line(
                pos + Vec3::new(h, 0.0, 0.0),
                pos + Vec3::new(h, s, 0.0),
                color,
            );
            batch.add_line(
                pos + Vec3::new(h, s, 0.0),
                pos + Vec3::new(0.0, s, 0.0),
                color,
            );
            batch.add_line(pos + Vec3::new(0.0, s, 0.0), pos, color);
        }
    }
}
