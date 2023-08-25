import { EntityRepository, Repository } from 'typeorm'
import { singleton } from 'tsyringe'
import { TwitterAccount } from '../entity'

@singleton()
@EntityRepository(TwitterAccount)
export class TwitterAccountRepository extends Repository<TwitterAccount> {
    public async getAllAccounts(): Promise<TwitterAccount[]> {
        return this.find({
            where: {
                isDisabled: false,
            },
        })
    }
}
