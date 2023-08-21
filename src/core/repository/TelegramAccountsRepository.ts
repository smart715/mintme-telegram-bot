import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { TelegramAccount } from '../entity'

@singleton()
@EntityRepository(TelegramAccount)
export class TelegramAccountsRepository extends Repository<TelegramAccount> {
    public async getAllAccounts(): Promise<TelegramAccount[]> {
        const accounts = await this.find()
        return accounts
    }

    public async findByID(accountID: number): Promise<TelegramAccount | undefined> {
        const account = await this.findOne({ where: { id: accountID } })
        return account
    }

    public async getServerAccounts(ip: string): Promise<TelegramAccount[]> {
        const accounts = await this.find({
            where: {
                assignedServerIP: ip,
                isDisabled: false,
            },
        })
        return accounts
    }
}
