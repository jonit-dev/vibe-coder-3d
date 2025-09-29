#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Files to skip (contain legitimate console.log usage)
const skipFiles = [
  'src/core/lib/scripting/ScriptExecutor.ts', // Script execution system
  'src/core/lib/scripting/ScriptAPI.ts', // Script API
  'src/editor/components/panels/InspectorPanel/Script/ScriptCodeModal.tsx', // Documentation
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

  let modified = false;
  const updatedLines = lines.map(line => {
    const trimmed = line.trim();

    // Skip comments or string literals
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.includes('Remove any comments or console.log')) {
      return line;
    }

    // Only remove lines that are ONLY console.log statements
    // Match patterns like:
    //   console.log(...);
    //   if (condition) console.log(...);
    //   if (debug) console.log(...);
    if (trimmed.match(/^\s*console\.log\s*\([^)]*\)\s*;?\s*$/) ||
        trimmed.match(/^\s*if\s*\([^)]*\)\s*console\.log\s*\([^)]*\)\s*;?\s*$/)) {
      modified = true;
      return '';
    }

    return line;
  });

  if (modified) {
    // Remove consecutive empty lines
    const cleanedLines = [];
    let lastWasEmpty = false;
    for (const line of updatedLines) {
      if (line.trim() === '') {
        if (!lastWasEmpty) {
          cleanedLines.push(line);
        }
        lastWasEmpty = true;
      } else {
        cleanedLines.push(line);
        lastWasEmpty = false;
      }
    }

    const beforeCount = (content.match(/console\.log/g) || []).length;
    const afterContent = cleanedLines.join('\n');
    const afterCount = (afterContent.match(/console\.log/g) || []).length;
    const removed = beforeCount - afterCount;

    if (removed > 0) {
      fs.writeFileSync(filePath, afterContent);
      console.log(`${file}: removed ${removed} console.log statements`);
      totalRemoved += removed;
    }
  }
});

console.log(`\nTotal console.log statements removed: ${totalRemoved}`);

// Check remaining
const remaining = execSync(
  `find src -name "*.ts" -o -name "*.tsx" | xargs grep "console\\.log" 2>/dev/null | wc -l || echo 0`,
  { encoding: 'utf8', cwd: '/home/jonit/projects/vibe-coder-3d' }
).trim();

console.log(`Remaining console.log statements: ${remaining} (includes legitimate usage)`);