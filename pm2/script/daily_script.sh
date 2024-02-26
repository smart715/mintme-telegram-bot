# Run coin-codex
npm run cli -- run-fetch-token-worker --name=coin-codex

# Run gem-finder
npm run cli -- run-fetch-token-worker --name=gem-finder

# Run TopTokensFetcher for ETH, BSC and CRO
npm run cli -- run-explorer-worker --name=top-tokens-fetcher --blockchain=ETH
npm run cli -- run-explorer-worker --name=top-tokens-fetcher --blockchain=BSC
npm run cli -- run-explorer-worker --name=top-tokens-fetcher --blockchain=CRO

# Run ValidatorsFetcher
npm run cli -- run-explorer-worker --name=validators-fetcher --blockchain=BSC

# Run TopAccountsFetcher for ETH, BSC and CRO
npm run cli -- run-explorer-worker --name=top-accounts-fetcher --blockchain=ETH
npm run cli -- run-explorer-worker --name=top-accounts-fetcher --blockchain=BSC
npm run cli -- run-explorer-worker --name=top-accounts-fetcher --blockchain=CRO

#SOL long running workers
npm run cli -- run-explorer-worker --name=top-tokens-fetcher --blockchain=SOL
npm run cli -- run-explorer-worker --name=top-accounts-fetcher --blockchain=SOL
