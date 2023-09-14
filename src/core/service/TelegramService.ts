import { singleton } from 'tsyringe'
import { TelegramAccountsRepository } from '../repository'
import { ProxyServer, TelegramAccount } from '../entity'
import { ProxyService } from './ProxyServerService'

@singleton()
export class TelegramService {
    public constructor(
        private telegramAccountRepository: TelegramAccountsRepository,
        private proxyService: ProxyService,
    ) { }

    public async assignNewAccountToServer(ip: string): Promise<TelegramAccount|undefined> {
        const account = await this.telegramAccountRepository.findOne({ where: {
            assignedServerIP: null,
            isDisabled: 0,
        } })

        if (account) {
            account.assignedServerIP = ip
            await this.telegramAccountRepository.save(account)
            return account
        }

        return undefined
    }

    public async getServerAccounts(ip: string): Promise<TelegramAccount[]> {
        return this.telegramAccountRepository.getServerAccounts(ip)
    }

    public async getAllAccounts(): Promise<TelegramAccount[]> {
        return this.telegramAccountRepository.getAllAccounts()
    }

    public async setAccountAsDisabled(tgAccount: TelegramAccount): Promise<void> {
        tgAccount.isDisabled = true
        await this.telegramAccountRepository.save(tgAccount)
    }

    public async setAccountLimitHitDate(tgAccount: TelegramAccount, date: Date): Promise<void> {
        tgAccount.limitHitResetDate = date
        await this.telegramAccountRepository.save(tgAccount)
    }

    public async assignNewProxyForAccount(tgAccount: TelegramAccount): Promise<ProxyServer|undefined> {
        const proxy = await this.proxyService.getFirstAvailableProxy()

        if (proxy) {
            tgAccount.proxy = proxy
            await this.telegramAccountRepository.save(tgAccount)
        }

        return proxy
    }
}
