import config from 'config'
import moment from 'moment'
import { Logger } from 'winston'
import { singleton } from 'tsyringe'
import { MailerService, TokensService } from '../../service'
import { TokensCountGroupedBySource } from '../../../types'

@singleton()
export class DailyStatisticMailWorker {
    private readonly email: string = config.get('email_daily_statistic')

    constructor(
        private readonly tokenService: TokensService,
        private readonly mailerService: MailerService,
        private readonly logger: Logger
    ) { }

    public async run(): Promise<void> {
        const currentDate = moment();
        const fromDate = currentDate.subtract(7, 'days');

        const tokens = await this.tokenService.getCountGroupedBySource(fromDate)

        const tokensWorkerMsg = this.buildTokensWorkerMsg(tokens)

        await this.mailerService.sendEmail(this.email, 'test', JSON.stringify(tokens))

        this.logger.info(fromDate.format())
        this.logger.info(JSON.stringify(tokens))
    }

    private buildTokensWorkerMsg(tokens: TokensCountGroupedBySource): string {
        let msg = ''
    }
}
