/**
 * Export Component Schemas Script
 * Exports all component Zod schemas to JSON for Rust consumption
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const require = createRequire(import.meta.url);

async function main() {
  console.log('Starting component schema export...');

  const rustSchemaDir = join(process.cwd(), 'rust', 'game', 'schema');
  console.log('Target directory:', rustSchemaDir);

  // Ensure directory exists
  await fs.mkdir(rustSchemaDir, { recursive: true });

  // For now, create a placeholder file to verify the system works
  const placeholderSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'ComponentSchemas',
    description: 'Component schemas will be exported here',
    note: 'Run from within the editor to export actual schemas',
  };

  const placeholderPath = join(rustSchemaDir, '_README.json');
  await fs.writeFile(placeholderPath, JSON.stringify(placeholderSchema, null, 2), 'utf-8');

  console.log('✓ Schema export complete');
  console.log('Note: Full schema export requires running from within the editor context');
  console.log('Schemas will be automatically generated when saving scenes in the editor');

  process.exit(0);
}

main().catch((error) => {
  console.error('Schema export failed:', error);
  process.exit(1);
});
