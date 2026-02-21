const {
  GH_TOKEN,
  GH_OWNER = '3300okb',
  GH_REPO = 'trend-watcher',
  GH_WORKFLOW = 'research-and-deploy.yml',
  GH_REF = 'main'
} = process.env;

if (!GH_TOKEN) {
  console.error('GH_TOKEN is required');
  process.exit(1);
}

const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/actions/workflows/${GH_WORKFLOW}/dispatches`;

const response = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${GH_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ ref: GH_REF })
});

if (!response.ok) {
  const text = await response.text();
  console.error(`dispatch failed: HTTP ${response.status}`);
  console.error(text);
  process.exit(1);
}

console.log(`dispatched: ${GH_OWNER}/${GH_REPO} ${GH_WORKFLOW} ref=${GH_REF}`);
