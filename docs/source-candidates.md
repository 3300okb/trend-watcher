# 収集対象ソース候補（MVP）

## 方針
- RSS または公式 API で安定取得できる媒体を優先
- `web` / `AI` / `tech` へカテゴリマッピング可能なものを選定
- 商用利用可否・robots/利用規約を都度確認

## AI
1. OpenAI Blog - https://openai.com/news/rss.xml
2. Google DeepMind Blog - https://deepmind.google/blog/rss.xml
3. Anthropic News - https://www.anthropic.com/news/rss.xml
4. Hugging Face Blog - https://huggingface.co/blog/feed.xml
5. Stability AI Blog - https://stability.ai/news/rss
6. Meta AI Blog - https://ai.meta.com/blog/rss/

## Web
1. Chrome Developers Blog - https://developer.chrome.com/blog/rss.xml
2. Mozilla Hacks - https://hacks.mozilla.org/feed/
3. WebKit Blog - https://webkit.org/blog/feed/
4. Vercel Blog - https://vercel.com/blog/rss.xml
5. Cloudflare Blog - https://blog.cloudflare.com/rss/
6. MDN Blog - https://developer.mozilla.org/en-US/blog/rss.xml

## Tech
1. The Verge (Tech) - https://www.theverge.com/rss/index.xml
2. TechCrunch - https://techcrunch.com/feed/
3. Ars Technica - http://feeds.arstechnica.com/arstechnica/index
4. Wired - https://www.wired.com/feed/rss
5. MIT Technology Review - https://www.technologyreview.com/feed/
6. IEEE Spectrum - https://spectrum.ieee.org/rss/fulltext

## 開発者向け追加候補
1. GitHub Blog - https://github.blog/feed/
2. Stack Overflow Blog - https://stackoverflow.blog/feed/
3. InfoQ - https://feed.infoq.com/
4. Hacker News (Algolia API) - https://hn.algolia.com/api

## 初期投入推奨
- まず 12 ソース（カテゴリごとに 4）で開始
- 1 週間以内に 20 ソースへ拡張
