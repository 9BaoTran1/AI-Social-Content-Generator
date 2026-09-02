import fs from 'node:fs';
import path from 'node:path';

const distIndex = path.resolve('dist/index.html');
const dist200 = path.resolve('dist/200.html');

if (fs.existsSync(distIndex)) {
  fs.copyFileSync(distIndex, dist200);
  console.log('[Postbuild] Successfully created dist/200.html for SPA routing (Surge/Static hosting)');
} else {
  console.warn('[Postbuild] dist/index.html not found, skipping 200.html creation');
}
