# Run coin-codex
npm run cli -- run-fetch-token-worker --name=coin-codex

# Run gem-finder
npm run cli -- run-fetch-token-worker --name=gem-finder

#SOL long running workers
npm run cli -- run-explorer-worker --name=top-tokens-fetcher --blockchain=SOL
npm run cli -- run-explorer-worker --name=top-accounts-fetcher --blockchain=SOL
