import { Logger } from 'winston'
import { CommandInterface } from './types'
import { TwitterWorker } from '../../core'
import { sleep } from '../../utils'

export class RunTwitterWorker implements CommandInterface {
    public readonly command = 'run-twitter-worker'
    public readonly description = 'Runs Twitter worker'

    public constructor(
        private readonly twitterWorker: TwitterWorker,
        private readonly logger: Logger,
    ) { }

    public builder(): void {}

    public async handler(): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        await this.twitterWorker.run()

        this.logger.info(`Command ${this.command} finished with success`)

        await sleep(1000)

        process.exit()
    }
}
