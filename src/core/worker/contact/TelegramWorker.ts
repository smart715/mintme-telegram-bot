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
} from '../../service'

@singleton()
export class TelegramWorker {
    private readonly maxTelegramAccounts: number = config.get('telegram_max_accounts')
    private readonly serverIP: string = config.get('server_ip')

    private telegramClients: TelegramClient[] = []

    public constructor(
        private readonly telegramService: TelegramService,
        private readonly contactHistoryService: ContactHistoryService,
        private readonly contactMessageService: ContactMessageService,
        private readonly contactQueueService: ContactQueueService,
        private readonly tokenService: TokensService,
        private readonly logger: Logger,
    ) { }

    private async initializeNewAccountManager(tgAccount: TelegramAccount): Promise<TelegramClient> {
        const tgAccountManager = new TelegramClient(
            this.contactHistoryService,
            this.contactMessageService,
            this.contactQueueService,
            this.tokenService,
            this.telegramService,
            tgAccount,
        )

        await tgAccountManager.initialize()

        return tgAccountManager
    }

    public async run(): Promise<void> {
        this.telegramClients = []
        const currentServerAccounts = await this.telegramService.getServerAccounts(this.serverIP)

        for (let i = 0; i < this.maxTelegramAccounts; i++) {
            if (currentServerAccounts[i]) {
                this.telegramClients.push(await this.initializeNewAccountManager(currentServerAccounts[i]))
            } else {
                await this.requestNewAccount()
            }
        }

        await this.startContactingAllManagers(this.telegramClients)

        this.logger.info('Initialized Telegram clients: ', this.telegramClients.length)
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

        clients.forEach((client) => {
            if (!client.isInitialized) {
                this.logger.warn(
                    `[Telegram Worker ID: ${client.telegramAccount.id}] ` +
                    `Not initialized.`
                )

                return
            }

            if (!client.accountMessages?.length) {
                this.logger.warn(
                    `[Telegram Worker ID: ${client.telegramAccount.id}] ` +
                    `No messages stock available, Account not able to start messaging.`
                )

                return
            }

            contactingPromises.push(client.startContacting())
        })

        return Promise.all(contactingPromises)
    }
}
