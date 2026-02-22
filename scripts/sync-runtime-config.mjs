import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { getConfiguredExcludePatterns, getConfiguredTopics } from './lib/runtime-config.mjs';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const RUNTIME_CONFIG_FILE = resolve(ROOT, 'public/data/runtime-config.json');

async function main() {
  const topics = await getConfiguredTopics();
  const excludePatterns = await getConfiguredExcludePatterns();
  await mkdir(dirname(RUNTIME_CONFIG_FILE), { recursive: true });
  await writeFile(
    RUNTIME_CONFIG_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        topics,
        excludePatterns
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(`[trend-watcher] runtime config synced (${topics.length} topics, ${excludePatterns.length} excludes)`);
}

main().catch((error) => {
  console.error('[trend-watcher] failed to sync runtime config', error);
  process.exitCode = 1;
});
