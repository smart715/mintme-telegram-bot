import { singleton } from 'tsyringe'
import { CommandInterface } from './types'
import { logger } from '../utils'
import { LastTokenTxDateFetcher } from '../core'

@singleton()
export class RunLastTokenTxDateFetcher implements CommandInterface {
    public readonly command = 'run-last-token-tx-date-fetcher'
    public readonly description = 'Runs LastTokenTxDateFetcher'

    public constructor(
        private readonly lastTokenTxDateFetcher: LastTokenTxDateFetcher,
    ) { }

    public builder(): void {}

    public async handler(): Promise<void> {
        logger.info(`Started command ${this.command}`)

        await this.lastTokenTxDateFetcher.run()

        logger.info(`Command ${this.command} finished with success`)
    }
}
