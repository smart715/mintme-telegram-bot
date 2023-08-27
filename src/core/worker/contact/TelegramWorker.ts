import { singleton } from 'tsyringe'
import config from 'config'
import { Logger } from 'winston'
import { TelegramClient } from './telegram'
import { TelegramAccount } from '../../entity'
import {
    ContactHistoryService,
    TokensService,
    TelegramService,
    ContactMessageService,
    ContactQueueService,
    ProxyService,
} from '../../service'
import { sleep } from '../../../utils'

@singleton()
export class TelegramWorker {
    private readonly maxTelegramAccounts: number = config.get('telegram_max_accounts_simultaneous')
    private readonly serverIP: string = config.get('server_ip')

    private telegramClients: TelegramClient[] = []

    public constructor(
        private readonly telegramService: TelegramService,
        private readonly contactHistoryService: ContactHistoryService,
        private readonly contactMessageService: ContactMessageService,
        private readonly contactQueueService: ContactQueueService,
        private readonly tokenService: TokensService,
        private readonly proxyService: ProxyService,
        private readonly logger: Logger,
    ) { }

    private async initializeNewAccountManager(tgAccount: TelegramAccount): Promise<TelegramClient> {
        const tgAccountManager = new TelegramClient(
            this.contactHistoryService,
            this.contactMessageService,
            this.contactQueueService,
            this.tokenService,
            this.telegramService,
            this.proxyService,
            tgAccount,
            this.logger
        )

        await tgAccountManager.initialize()

        return tgAccountManager
    }

    public async run(): Promise<void> {
        const allAccounts = await this.telegramService.getAllAccounts()
        let currentAccountIndex: number = 0
        while (currentAccountIndex < allAccounts.length) {
            this.telegramClients = []
            for (let i = 0; i < this.maxTelegramAccounts; i++) {
                const account = allAccounts[currentAccountIndex]
                if (account) {
                    this.telegramClients.push(await this.initializeNewAccountManager(account))
                }
                currentAccountIndex++
            }

            await this.startContactingAllManagers(this.telegramClients)

            for (const client of this.telegramClients) {
                await client.destroyDriver()
            }
        }
        await sleep(60000)
        const restart = await this.run()
        return restart
    }

    public async disableAccount(telegramAccount: TelegramAccount): Promise<void> {
        await this.telegramService.setAccountAsDisabled(telegramAccount)
        delete this.telegramClients[this.telegramClients.findIndex(
            mgr => mgr.telegramAccount.id === telegramAccount.id)]
        await this.requestNewAccount()
    }

    public async requestNewAccount(): Promise<void> {
        const newAccount = await this.telegramService.assignNewAccountToServer(this.serverIP)

        if (newAccount) {
            this.telegramClients.push(await this.initializeNewAccountManager(newAccount))
        } else {
            this.logger.warn('No accounts stock available')
        }
    }

    private startContactingAllManagers(clients: TelegramClient[]): Promise<void[]> {
        const contactingPromises: Promise<void>[] = []

        for (const client of clients) {
            if (!client.isInitialized) {
                this.logger.warn(
                    `[Telegram Worker ID: ${client.telegramAccount.id}] ` +
                    `Not initialized.`
                )

                continue
            }

            if (!client.accountMessages?.length) {
                this.logger.warn(
                    `[Telegram Worker ID: ${client.telegramAccount.id}] ` +
                    `No messages stock available, Account not able to start messaging.`
                )

                continue
            }

            contactingPromises.push(client.startContacting())
        }

        return Promise.all(contactingPromises)
    }
}
