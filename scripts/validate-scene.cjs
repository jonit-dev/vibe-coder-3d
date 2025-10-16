#!/usr/bin/env node
/**
 * Scene Validation Script
 * Validates that scene JSON files match expected format and identifies potential issues
 */

const fs = require('fs');
const path = require('path');

function validateScene(scenePath) {
  console.log(`\n🔍 Validating scene: ${scenePath}\n`);

  // Read scene file
  let sceneData;
  try {
    const content = fs.readFileSync(scenePath, 'utf-8');
    sceneData = JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to parse scene JSON: ${error.message}`);
    return false;
  }

  let hasErrors = false;
  let warnings = [];

  // Validate metadata
  if (!sceneData.metadata) {
    console.error('❌ Missing metadata');
    hasErrors = true;
  } else {
    if (!sceneData.metadata.name) warnings.push('⚠️  Missing metadata.name');
    if (!sceneData.metadata.version) warnings.push('⚠️  Missing metadata.version');
  }

  // Validate entities
  if (!Array.isArray(sceneData.entities)) {
    console.error('❌ entities must be an array');
    hasErrors = true;
  } else {
    console.log(`📊 Found ${sceneData.entities.length} entities`);

    sceneData.entities.forEach((entity, index) => {
      const entityName = entity.name || `Entity ${index}`;

      // Check Transform component
      if (entity.components.Transform) {
        const transform = entity.components.Transform;

        // Check rotation format
        if (transform.rotation) {
          if (Array.isArray(transform.rotation)) {
            if (transform.rotation.length === 3) {
              // Euler angles - check if they look like degrees
              const hasLargeValues = transform.rotation.some((v) => Math.abs(v) > 6.28);
              if (hasLargeValues) {
                console.log(
                  `  ✓ ${entityName}: Rotation in degrees ${JSON.stringify(transform.rotation)}`,
                );
              } else if (transform.rotation.some((v) => v !== 0)) {
                warnings.push(
                  `⚠️  ${entityName}: Rotation values ${JSON.stringify(transform.rotation)} might be radians (expecting degrees)`,
                );
              }
            } else if (transform.rotation.length === 4) {
              console.log(
                `  ✓ ${entityName}: Rotation as quaternion ${JSON.stringify(transform.rotation)}`,
              );
            } else {
              console.error(
                `  ❌ ${entityName}: Invalid rotation array length ${transform.rotation.length} (expected 3 or 4)`,
              );
              hasErrors = true;
            }
          } else {
            console.error(`  ❌ ${entityName}: Rotation must be an array`);
            hasErrors = true;
          }
        }

        // Check position format
        if (transform.position && !Array.isArray(transform.position)) {
          console.error(`  ❌ ${entityName}: Position must be an array`);
          hasErrors = true;
        }

        // Check scale format
        if (transform.scale && !Array.isArray(transform.scale)) {
          console.error(`  ❌ ${entityName}: Scale must be an array`);
          hasErrors = true;
        }
      }

      // Check Camera component
      if (entity.components.Camera) {
        const camera = entity.components.Camera;

        // Check vec3/vec2 object fields that should support both array and object format
        const vec3Fields = [
          'followOffset',
          'skyboxScale',
          'skyboxRotation',
        ];
        const vec2Fields = ['skyboxRepeat', 'skyboxOffset'];

        vec3Fields.forEach((field) => {
          if (camera[field]) {
            if (Array.isArray(camera[field]) && camera[field].length === 3) {
              console.log(`  ✓ ${entityName}: Camera.${field} as array`);
            } else if (
              typeof camera[field] === 'object' &&
              'x' in camera[field] &&
              'y' in camera[field] &&
              'z' in camera[field]
            ) {
              console.log(`  ✓ ${entityName}: Camera.${field} as object {x,y,z}`);
            } else {
              warnings.push(
                `⚠️  ${entityName}: Camera.${field} has unexpected format: ${JSON.stringify(camera[field])}`,
              );
            }
          }
        });

        vec2Fields.forEach((field) => {
          if (camera[field]) {
            if (Array.isArray(camera[field]) && camera[field].length === 2) {
              console.log(`  ✓ ${entityName}: Camera.${field} as array`);
            } else if (
              typeof camera[field] === 'object' &&
              'u' in camera[field] &&
              'v' in camera[field]
            ) {
              console.log(`  ✓ ${entityName}: Camera.${field} as object {u,v}`);
            } else {
              warnings.push(
                `⚠️  ${entityName}: Camera.${field} has unexpected format: ${JSON.stringify(camera[field])}`,
              );
            }
          }
        });

        // Check backgroundColor format
        if (camera.backgroundColor) {
          if (
            typeof camera.backgroundColor === 'object' &&
            'r' in camera.backgroundColor &&
            'g' in camera.backgroundColor &&
            'b' in camera.backgroundColor
          ) {
            console.log(`  ✓ ${entityName}: Camera.backgroundColor as color object`);
          } else {
            warnings.push(
              `⚠️  ${entityName}: Camera.backgroundColor has unexpected format`,
            );
          }
        }
      }

      // Check MeshRenderer
      if (entity.components.MeshRenderer) {
        const renderer = entity.components.MeshRenderer;
        if (!renderer.meshId && !renderer.modelPath) {
          warnings.push(
            `⚠️  ${entityName}: MeshRenderer has no meshId or modelPath`,
          );
        }
      }
    });
  }

  // Check materials
  if (sceneData.materials && Array.isArray(sceneData.materials)) {
    console.log(`\n📦 Found ${sceneData.materials.length} materials`);
    sceneData.materials.forEach((mat) => {
      if (!mat.id) warnings.push(`⚠️  Material missing id: ${mat.name || 'unnamed'}`);
    });
  }

  // Print warnings
  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${warnings.length}):`);
    warnings.forEach((w) => console.log(`  ${w}`));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (hasErrors) {
    console.log('❌ Validation FAILED - scene has errors');
    return false;
  } else if (warnings.length > 0) {
    console.log(
      `⚠️  Validation PASSED with ${warnings.length} warning(s)`,
    );
    return true;
  } else {
    console.log('✅ Validation PASSED - no errors or warnings');
    return true;
  }
}

// CLI usage
if (require.main === module) {
  const scenePath = process.argv[2];
  if (!scenePath) {
    console.error('Usage: node validate-scene.js <path-to-scene.json>');
    process.exit(1);
  }

  const success = validateScene(scenePath);
  process.exit(success ? 0 : 1);
}

module.exports = { validateScene };
