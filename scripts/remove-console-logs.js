#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Get all TypeScript/TSX files with console.log
const files = execSync(
  `find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "console\\.log" || true`,
  { encoding: 'utf8', cwd: '/home/jonit/projects/vibe-coder-3d' }
)
  .split('\n')
  .filter(Boolean);

console.log(`Found ${files.length} files with console.log statements`);

let totalRemoved = 0;

files.forEach(file => {
  const filePath = path.join('/home/jonit/projects/vibe-coder-3d', file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Count console.log statements before removal
  const beforeCount = (content.match(/console\.log/g) || []).length;

  // Remove console.log statements (entire lines)
  const updatedContent = content
    .split('\n')
    .filter(line => !line.trim().match(/^\s*console\.log\s*\(/))
    .join('\n');

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

// Check if any remain
const remaining = execSync(
  `find src -name "*.ts" -o -name "*.tsx" | xargs grep -c "console\\.log" 2>/dev/null | wc -l || echo 0`,
  { encoding: 'utf8', cwd: '/home/jonit/projects/vibe-coder-3d' }
).trim();

if (remaining === '0') {
  console.log('✅ All console.log statements have been removed!');
} else {
  console.log(`⚠️  ${remaining} files still contain console.log statements`);
}