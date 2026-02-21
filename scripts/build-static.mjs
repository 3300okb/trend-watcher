import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const PUBLIC_DIR = resolve(ROOT, 'public');
const OUT_DIR = resolve(ROOT, 'out');

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });
await cp(PUBLIC_DIR, OUT_DIR, { recursive: true });
await writeFile(resolve(OUT_DIR, '.nojekyll'), '', 'utf8');

console.log('[trend-watcher] static build complete: out/');
