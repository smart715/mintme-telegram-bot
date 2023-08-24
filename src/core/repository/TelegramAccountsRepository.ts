import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { TelegramAccount } from '../entity'

@singleton()
@EntityRepository(TelegramAccount)
export class TelegramAccountsRepository extends Repository<TelegramAccount> {
    public async getAllAccounts(): Promise<TelegramAccount[]> {
        return this.find({
            where: {
                isDisabled: false,
            },
        })
    }

    public async findByID(accountID: number): Promise<TelegramAccount | undefined> {
        return this.findOne({ where: { id: accountID } })
    }

    public async getServerAccounts(ip: string): Promise<TelegramAccount[]> {
        return this.find({
            where: {
                assignedServerIP: ip,
                isDisabled: false,
            },
        })
    }
}
