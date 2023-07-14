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
