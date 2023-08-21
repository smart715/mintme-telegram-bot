import { singleton } from 'tsyringe'
import { TelegramAccountsRepository } from '../repository'
import { TelegramAccount } from '../entity'

@singleton()
export class TelegramService {
    public constructor(
        private telegramAccountRepository: TelegramAccountsRepository,
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
        const accounts = await this.telegramAccountRepository.getServerAccounts(ip)
        return accounts
    }

    public async setAccountAsDisabled(tgAccount: TelegramAccount): Promise<void> {
        tgAccount.isDisabled = true
        await this.telegramAccountRepository.save(tgAccount)
    }

    public async setAccountLimitHitDate(tgAccount: TelegramAccount, date: Date): Promise<void> {
        tgAccount.limitHitResetDate = date
        await this.telegramAccountRepository.save(tgAccount)
    }
}
