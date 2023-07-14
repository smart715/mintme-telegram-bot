import { singleton } from 'tsyringe';
import { CommandInterface, RunEnqueueTokenWorkerCmdArgv } from './types';
import { Arguments, Argv } from 'yargs';
import { Blockchain, logger } from '../utils';
import { EnqueueTokensWorker } from '../core';

@singleton()
export class RunEnqueueTokenWorker implements CommandInterface {
    public readonly command = 'run-enqueue-tokens-worker'
    public readonly description = 'Runs Enqueue tokens Worker'

    public constructor(
        private readonly enqueueTokensWorker: EnqueueTokensWorker,
    ) { }

    public builder(yargs: Argv<RunEnqueueTokenWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunEnqueueTokenWorkerCmdArgv>): Promise<void> {
        logger.info(`Started command ${this.command}`)

        await this.enqueueTokensWorker.run(argv.blockchain)

        logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
