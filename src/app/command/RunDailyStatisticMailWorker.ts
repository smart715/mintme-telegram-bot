import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { CommandInterface } from './types'
import { sleep } from '../../utils'
import { DailyStatisticMailWorker, MailerService } from '../../core'

@singleton()
export class RunDailyStatisticMailWorker implements CommandInterface {
    public readonly command = 'run-daily-statistic-worker'
    public readonly description = 'This command runs Dail Statistic Mail worker from cli'

    public constructor(
        private readonly dailyStatisticMailWorker: DailyStatisticMailWorker,
        private readonly mailService: MailerService,
        private readonly logger: Logger,
    ) { }

    public builder(): void {}

    public async handler(): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        try {
            await this.dailyStatisticMailWorker.run()
        } catch (err) {
            await this.mailService.sendFailedWorkerEmail(`Error while running ${this.constructor.name}`, err)

            throw err
        }

        this.logger.info(`Command ${this.command} finished with success`)

        await sleep(1000)

        process.exit()
    }
}
