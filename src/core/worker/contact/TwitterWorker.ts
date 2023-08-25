import { singleton } from 'tsyringe'
import { TwitterService } from '../../service'
import config from "config";
import {TwitterAccount} from "../../entity";
import {TelegramClient} from "./telegram";

@singleton()
export class TwitterWorker {
    private readonly maxTwitterAccount: number = config.get('twitter_max_accounts_simultaneous')

    private twitterClients: TwitterClient[] = []

    public constructor(
        private readonly twitterService: TwitterService
    ) {
    }

    public async run(): Promise<void> {
        const allAccounts = await this.twitterService.getAllAccounts()

        let currentAccountIndex = 0

        while (currentAccountIndex < allAccounts.length && currentAccountIndex < this.maxTwitterAccount) {
            const account = allAccounts[currentAccountIndex]

            const twitterClient = this.initNewClient(account)

            this.twitterClients.push(twitterClient)

            currentAccountIndex++
        }

        await this.startContactingAllManagers()
    }

    private async initNewClient(twitterAccount: TwitterAccount): Promise<TwitterClient> {
        // init new twitter client
    }

    private startContactingAllManagers(): Promise<void[]> {
        // start contacting all managers
    }
}
