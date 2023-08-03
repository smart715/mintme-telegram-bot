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
