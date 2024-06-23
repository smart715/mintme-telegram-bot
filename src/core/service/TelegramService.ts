import { singleton } from 'tsyringe'
import { TelegramAccountsRepository, TelegramResponseRepository, BlacklistRepository, TelegramAutoDmResponseRepository } from '../repository'
import { TelegramAccount, ProxyServer, TelegramAutoDmResponse } from '../entity'
import { ProxyService } from './ProxyServerService'
import { TelegramWorkerMode } from '../../utils'
import moment from 'moment'

@singleton()
export class TelegramService {
    public constructor(
        private telegramAccountRepository: TelegramAccountsRepository,
        private telegramResponseRepository: TelegramResponseRepository,
        private proxyService: ProxyService,
        private blacklistRepository: BlacklistRepository,
        private telegramAutoDmResponseRepository: TelegramAutoDmResponseRepository
    ) { }

    public async getAllAccounts(mode: TelegramWorkerMode|undefined = undefined): Promise<TelegramAccount[]> {
        if (TelegramWorkerMode.RESPONSES === mode) {
            return this.telegramAccountRepository.getAllAccountsForResponseWorker()
        }

        return this.telegramAccountRepository.getAllAccounts()
    }

    public async assginLoginDateToAccount(accountID: number, time: Date) :Promise<TelegramAccount | undefined> {
        const account = await this.telegramAccountRepository.findById(accountID)

        if (account) {
            account.lastLogin = time
            await this.telegramAccountRepository.save(account)
        }

        return account
    }

    public async setAccountAsDisabled(tgAccount: TelegramAccount): Promise<void> {
        tgAccount.isDisabled = true
        await this.telegramAccountRepository.save(tgAccount)
    }

    public async updateLastResponsesFetchDate(tgAccount: TelegramAccount): Promise<void> {
        tgAccount.lastResponsesFetchDate = moment().utc().toDate()
        await this.telegramAccountRepository.save(tgAccount)
    }

    public async setAccountLimitHitDate(tgAccount: TelegramAccount, date: Date): Promise<void> {
        tgAccount.limitHitResetDate = date
        await this.telegramAccountRepository.save(tgAccount)
    }

    public async addNewResponse(
        chatLink: string,
        chatMessages: string,
        tgAccount: TelegramAccount,
        type: string
    ): Promise<void> {
        const conditions = [
            this.telegramResponseRepository.isExistingReponse(chatLink, chatMessages),
            this.blacklistRepository.isChatInBlacklist(chatLink),
            this.blacklistRepository.isMessagesContainsBlacklistWord(chatMessages),
            this.blacklistRepository.isUsernameInBlacklist(chatLink),
        ]

        if ((await Promise.all(conditions)).some((value) => value)) {
            return
        }

        const telegramResponse = this.telegramResponseRepository.create({
            chatLink: chatLink,
            chatMessages: chatMessages,
            isChecked: false,
            telegamAccount: tgAccount,
            type: type,
        })

        await this.telegramResponseRepository.insert(telegramResponse)
    }

    public async assignNewProxyForAccount(tgAccount: TelegramAccount): Promise<ProxyServer|undefined> {
        const proxy = await this.proxyService.getFirstAvailableProxy()

        if (proxy) {
            tgAccount.proxy = proxy
            await this.telegramAccountRepository.save(tgAccount)
        }

        return proxy
    }

    public async getAutoResponderMessage(order: number): Promise<TelegramAutoDmResponse|undefined> {
        return this.telegramAutoDmResponseRepository.getMessageToSend(order)
    }
}
