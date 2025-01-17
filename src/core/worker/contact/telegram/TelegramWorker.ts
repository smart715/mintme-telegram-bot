import { singleton } from 'tsyringe'
import config from 'config'
import { Logger } from 'winston'
import { TelegramClient } from './index'
import { TelegramAccount } from '../../../entity'
import {
    ContactHistoryService,
    TokensService,
    TelegramService,
    ContactMessageService,
    ContactQueueService,
    ProxyService,
    MailerService,
} from '../../../service'
import { Environment, sleep, TelegramWorkerMode } from '../../../../utils'
import { ContactMethod } from '../../../types'
import { WorkerInterface } from '../../WorkerInterface'

@singleton()
export class TelegramWorker implements WorkerInterface {
    private readonly maxTelegramAccounts: number = config.get('telegram_max_accounts_simultaneous')

    private telegramClients: TelegramClient[] = []
    private mode: TelegramWorkerMode

    public constructor(
        private readonly telegramService: TelegramService,
        private readonly contactHistoryService: ContactHistoryService,
        private readonly contactMessageService: ContactMessageService,
        private readonly contactQueueService: ContactQueueService,
        private readonly tokenService: TokensService,
        private readonly proxyService: ProxyService,
        private readonly mailerService: MailerService,
        private readonly environment: Environment,
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
            this.mailerService,
            this.environment,
            this.logger
        )

        await tgAccountManager.initialize()

        return tgAccountManager
    }

    public async run(mode: TelegramWorkerMode): Promise<void> {
        this.logger.info(`Running Telegram worker | Mode: ${mode}`)

        await this.contactQueueService.resetProcessingStat(ContactMethod.TELEGRAM)

        this.mode = mode
        this.telegramClients = []

        const allAccounts = await this.telegramService.getAllAccounts(mode)

        if (0 === allAccounts.length) {
            await this.mailerService
                .sendFailedWorkerEmail(`${this.constructor.name} Doesn't have available accounts to login`)

            this.logger.error(
                `[Telegram Worker] DB doesn't have available account to login. Aborting.`
            )

            return
        }

        this.logger.info(`Found ${allAccounts.length} accounts to use`)

        let currentAccountIndex: number = 0
        const usedAccountsIds: number[] = []

        while (usedAccountsIds.length < allAccounts.length) {
            this.telegramClients = []
            this.logger.info(`Initializing new ${this.maxTelegramAccounts} accounts | cursor: ${currentAccountIndex} | Used ${usedAccountsIds.length} of ${allAccounts.length}`)

            while (this.telegramClients.length < this.maxTelegramAccounts) {
                const account = allAccounts[currentAccountIndex]
                const isUsed = usedAccountsIds.includes(account.id)
                const isLoggedInProxy = account && account.proxy && this.telegramClients.some(tgClient =>
                    tgClient.telegramAccount.proxy.id === account.proxy.id)

                if (account &&
                    !isUsed &&
                    !isLoggedInProxy
                ) {
                    this.logger.info(`Trying to initialize account ${account.id}:: ${account.phoneNumber}`)
                    const tgClient = await this.initializeNewAccountManager(account)
                    usedAccountsIds.push(account.id)

                    if (tgClient.isInitialized) {
                        this.telegramClients.push(tgClient)
                    } else {
                        await tgClient.destroyDriver()
                    }
                } else {
                    this.logger.info(`Skipped Account ${account.id} | Is Used: ${isUsed} | isLoggedInProxy: ${isLoggedInProxy}`)
                }

                currentAccountIndex++

                if (currentAccountIndex > allAccounts.length - 1) {
                    currentAccountIndex = 0
                }

                if (usedAccountsIds.length === allAccounts.length) {
                    break
                }
            }

            try {
                await this.startAllClients(this.telegramClients)
            } finally {
                await this.destroyDrivers()
            }
        }

        await this.startAllClients(this.telegramClients)

        this.logger.info('Initialized Telegram clients: ', this.telegramClients.length)
        await sleep(60000)
        const restart = await this.run(mode)
        return restart
    }

    public async startAllClients(clients: TelegramClient[]): Promise<void[]> {
        const workerPromises: Promise<void>[] = []

        clients.forEach(async (client) => {
            if (!client.isInitialized) {
                this.logger.warn(
                    `[Telegram Worker ID: ${client.telegramAccount.id}] ` +
                    `Not initialized.`
                )

                return
            }

            if (!client.accountMessages?.length &&
                TelegramWorkerMode.ALL == this.mode) {
                const msg = `[Telegram Worker ID: ${client.telegramAccount.id}] ` +
                    `No messages stock available, Account not able to start messaging.`

                this.logger.warn(msg)
                await this.mailerService.sendFailedWorkerEmail(msg)

                return
            }

            switch (this.mode) {
                case TelegramWorkerMode.ALL:
                    workerPromises.push(client.startWorker())
                    break
                case TelegramWorkerMode.RESPONSES:
                    workerPromises.push(client.startResponsesWorker())
                    break
            }
        })

        return Promise.all(workerPromises)
    }

    public async destroyDrivers(): Promise<void> {
        for (const client of this.telegramClients) {
            await client.destroyDriver()
        }
    }
}
