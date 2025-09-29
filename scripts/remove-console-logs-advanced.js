#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Files to skip (contain legitimate console.log usage)
const skipFiles = [
  'src/core/lib/scripting/ScriptExecutor.ts', // Script execution system
  'src/core/lib/scripting/ScriptAPI.ts', // Script API
  'src/editor/components/panels/InspectorPanel/Script/ScriptCodeModal.tsx', // Documentation
  'src/plugins/vite-plugin-scene-api.ts' // Comment about removing console.log
];

// Get all TypeScript/TSX files with console.log
const files = execSync(
  `find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "console\\.log" || true`,
  { encoding: 'utf8', cwd: '/home/jonit/projects/vibe-coder-3d' }
)
  .split('\n')
  .filter(Boolean)
  .filter(file => !skipFiles.includes(file));

console.log(`Found ${files.length} files with console.log statements (excluding system files)`);

let totalRemoved = 0;

files.forEach(file => {
  const filePath = path.join('/home/jonit/projects/vibe-coder-3d', file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Count console.log statements before removal
  const beforeCount = (content.match(/console\.log/g) || []).length;

  const updatedLines = lines.map(line => {
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
      return line;
    }

    // Handle conditional console.log statements
    if (trimmed.match(/^if\s*\(.+\)\s*console\.log/)) {
      return ''; // Remove entire conditional console.log
    }

    // Handle debug console.log statements
    if (trimmed.match(/if\s*\(.*(debug|DEBUG).*\)\s*console\.log/)) {
      return ''; // Remove debug console.log
    }

    // Remove standalone console.log statements
    if (trimmed.match(/^\s*console\.log\s*\(/)) {
      return '';
    }

    return line;
  });

  const updatedContent = updatedLines.join('\n');

  // Count after removal
  const afterCount = (updatedContent.match(/console\.log/g) || []).length;
  const removed = beforeCount - afterCount;

  if (removed > 0) {
    fs.writeFileSync(filePath, updatedContent);
    console.log(`${file}: removed ${removed} console.log statements`);
    totalRemoved += removed;
  }
});

console.log(`\nTotal console.log statements removed: ${totalRemoved}`);

// Check remaining
const remaining = execSync(
  `find src -name "*.ts" -o -name "*.tsx" | xargs grep "console\\.log" 2>/dev/null | wc -l || echo 0`,
  { encoding: 'utf8', cwd: '/home/jonit/projects/vibe-coder-3d' }
).trim();

console.log(`Remaining console.log statements: ${remaining} (includes legitimate usage)`);