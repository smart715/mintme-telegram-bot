import config from 'config'
import { singleton } from 'tsyringe'
import { TokensService} from '../../service'

@singleton()
export class DailyStatisticMailWorker {
    private readonly email: string = config.get('email_daily_statistic')

    constructor(
        private readonly tokenService: TokensService,
    ) { }

    public async run(): Promise<void> {
        const tokens = await this.tokenService.getCountGroupedBySourceAndBlockchain()
    }
}
