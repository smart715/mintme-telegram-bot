import { Arguments, BuilderCallback, MiddlewareFunction } from 'yargs'
import { Blockchain } from '../utils'

export interface CommandInterface {
    command: string | ReadonlyArray<string>
    description: string
    middlewares?: MiddlewareFunction[]
    deprecated?: boolean | string

    builder: BuilderCallback<any, any>
    handler(args: Arguments<any>): void
}

export interface RunEnqueueTokenWorkerCmdArgv {
    blockchain: Blockchain,
}

export interface RunQueueWorkerCmdArgv {
    blockchain: Blockchain,
    repeat: number,
}

export interface RunExplorerWorkerCmdArgv {
    name: ExplorerWorkerNames,
    blockchain: Blockchain,
}

export enum ExplorerWorkerNames {
    HOLDINGS = 'token-holdings-worker',
    TRANSACTIONS = 'token-transactions-fetcher',
    TOP_ACCOUNTS = 'top-accounts-fetcher',
    TOP_TOKENS = 'top-tokens-fetcher',
    VALIDATORS = 'validators-fetcher',
    TOKEN_CHECKER = 'check-token-worker',
    EXPLORER_SEARCH = 'explorer-search-api-worker',
}

export interface RunCoinGeckoWorkerCmdArgv {
    blockchain: Blockchain,
}

export interface RunAdvnWorkerCmdArgv {
    blockchain: Blockchain,
}

export interface RunCoinDiscoveryWorkerCmdArgv {
    blockchain: Blockchain,
}

export interface RunCoinBrainWorkerCmdArgv {
    blockchain: Blockchain,
}

export interface RunCoinBuddyWorkerCmdArgv {
    blockchain: Blockchain,
}

export interface RunCoinCapWorkerCmdArgv {
    blockchain: Blockchain,
}

export interface RunCoinCatapultWorkerCmdArgv {
    blockchain: Blockchain,
}

export interface RunCoinCodexWorkerCmdArgv {
    blockchain: Blockchain,
}

export interface RunBitQueryWorkerCmdArgv {
    blockchain: Blockchain,
}

export interface RunCasualTokenWorkerCmdArgv {
    name: CasualTokenWorkerNames,
}

export enum CasualTokenWorkerNames {
    CRYPTO_VOTE_LIST = 'crypto-vote-list',
    ETH_PLORER = 'eth-plorer',
    GEM_FINDER = 'gem-finder',
    MEME_COIN = 'meme-coin',
    MOBULA = 'mobula',
    MY_COIN_VOTE = 'my-coin-vote',
    COIN_VOTE = 'coin-vote',
    COINS_HUNTER = 'coins-hunter',
    COINS_GODS = 'coins-gods',
    COIN_360 = 'coin-360',
    COIN_SNIPER = 'coin-sniper',
    COINMARKETCAP = 'coinmarketcap',
    COIN_LORE = 'coin-lore',
    COIN_SCOPE = 'coin-scope',
}

export interface RunRugFreeCoinsWorkerCmdArgv {
    blockchain: Blockchain,
}

export interface RunTop100TokensWorkerCmdArgv {
    blockchain: Blockchain,
}

export interface RunTokensInsightWorkerCmdArgv {
    blockchain: Blockchain,
}

export interface RunMyEtherListsWorkerCmdArgv {
    blockchain: Blockchain,
}

export interface RunRecentTokensWorkerCmdArgv {
    blockchain: Blockchain,
}
