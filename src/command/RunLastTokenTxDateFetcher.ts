import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { CommandInterface } from './types'
import { LastTokenTxDateFetcher } from '../core'

@singleton()
export class RunLastTokenTxDateFetcher implements CommandInterface {
    public readonly command = 'run-last-token-tx-date-fetcher'
    public readonly description = 'Runs LastTokenTxDateFetcher'

    public constructor(
        private readonly lastTokenTxDateFetcher: LastTokenTxDateFetcher,
        private readonly logger: Logger,
    ) { }

    public builder(): void {}

    public async handler(): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        await this.lastTokenTxDateFetcher.run()

        this.logger.info(`Command ${this.command} finished with success`)
    }
}
