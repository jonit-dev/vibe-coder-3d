import React, { useMemo } from 'react';

import type { IMaterialDefinition } from '@/core/materials/Material.types';

export interface IMaterialPreview2DProps {
  material: IMaterialDefinition;
  size?: number;
  className?: string;
}

/**
 * Lightweight 2D material preview using CSS/Canvas2D instead of WebGL.
 * Much faster for rendering multiple material thumbnails.
 */
export const MaterialPreview2D: React.FC<IMaterialPreview2DProps> = ({
  material,
  size = 90,
  className = '',
}) => {
  // Generate a simple gradient or solid color preview
  const previewStyle = useMemo(() => {
    const baseColor = material.color || '#808080';
    const hasTexture = material.albedoTexture;

    // Create a radial gradient to simulate sphere shading
    const gradientStyle: React.CSSProperties = {
      width: size,
      height: size,
      borderRadius: '50%',
      position: 'relative',
      overflow: 'hidden',
    };

    // If there's a texture, show it with a subtle overlay
    if (hasTexture) {
      gradientStyle.backgroundImage = `
        radial-gradient(circle at 30% 30%,
          rgba(255,255,255,0.3),
          rgba(0,0,0,0) 50%,
          rgba(0,0,0,0.3) 100%),
        url(${material.albedoTexture})
      `;
      gradientStyle.backgroundSize = 'cover, cover';
      gradientStyle.backgroundPosition = 'center, center';
    } else {
      gradientStyle.background = `radial-gradient(circle at 30% 30%,
        ${lightenColor(baseColor, 40)},
        ${baseColor} 50%,
        ${darkenColor(baseColor, 30)} 100%)`;
    }

    gradientStyle.boxShadow =
      material.shader === 'standard'
        ? `inset -${size * 0.1}px -${size * 0.1}px ${size * 0.2}px rgba(0,0,0,0.3),
         inset ${size * 0.05}px ${size * 0.05}px ${size * 0.1}px rgba(255,255,255,${material.metalness * 0.3})`
        : 'none';

    // Add emissive glow if present
    if (material.emissive && material.emissive !== '#000000' && material.emissiveIntensity > 0) {
      const glowIntensity = material.emissiveIntensity * 10;
      gradientStyle.boxShadow = `${gradientStyle.boxShadow || ''}, 0 0 ${glowIntensity}px ${material.emissive}`;
    }

    return gradientStyle;
  }, [material, size]);

  return (
    <div
      className={`bg-gray-800 border border-gray-600 rounded flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <div style={previewStyle} />
    </div>
  );
};

// Helper functions to manipulate colors
function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, ((num >> 16) & 0xff) + amt);
  const G = Math.min(255, ((num >> 8) & 0xff) + amt);
  const B = Math.min(255, (num & 0xff) + amt);
  return `#${((R << 16) | (G << 8) | B).toString(16).padStart(6, '0')}`;
}

function darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, ((num >> 16) & 0xff) - amt);
  const G = Math.max(0, ((num >> 8) & 0xff) - amt);
  const B = Math.max(0, (num & 0xff) - amt);
  return `#${((R << 16) | (G << 8) | B).toString(16).padStart(6, '0')}`;
}
