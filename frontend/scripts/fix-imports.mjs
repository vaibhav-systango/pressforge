#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/home/ubox91/Desktop/NextPress/next-press';

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
      walk(full, files);
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

for (const file of walk(ROOT)) {
  let content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const seen = new Set();
  const deduped = [];

  for (const line of lines) {
    const key = line.trim();
    if (key.startsWith('import ') && seen.has(key)) {
      continue;
    }
    if (key.startsWith('import ')) {
      seen.add(key);
    }
    deduped.push(line);
  }

  content = deduped.join('\n');
  content = content.replace(
    /import ThemeToggle from ['"]\.\/ThemeToggle['"]/g,
    "import { ThemeToggle } from '@/components/theme/theme-toggle'",
  );
  content = content.replace(
    /import OnboardingStepper from ['"]\.\.\/components\/OnboardingStepper['"]/g,
    "import { OnboardingStepper } from '@/components/onboarding/onboarding-stepper'",
  );

  fs.writeFileSync(file, content);
}

console.log('Fixed imports.');
