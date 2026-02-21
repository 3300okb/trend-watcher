import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { getConfiguredTopics } from './lib/runtime-config.mjs';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const RUNTIME_CONFIG_FILE = resolve(ROOT, 'public/data/runtime-config.json');

async function main() {
  const topics = await getConfiguredTopics();
  await mkdir(dirname(RUNTIME_CONFIG_FILE), { recursive: true });
  await writeFile(
    RUNTIME_CONFIG_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        topics
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(`[trend-watcher] runtime config synced (${topics.length} topics)`);
}

main().catch((error) => {
  console.error('[trend-watcher] failed to sync runtime config', error);
  process.exitCode = 1;
});
