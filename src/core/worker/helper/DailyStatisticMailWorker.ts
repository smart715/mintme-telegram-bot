import { singleton } from 'tsyringe'
import config from "config";

@singleton()
export class DailyStatisticMailWorker {
    private readonly email: string = config.get('email_daily_statistic')

    public async run(): Promise<void> {

    }
}
