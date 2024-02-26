import { EntityRepository, Repository } from 'typeorm'
import { singleton } from 'tsyringe'
import { CoinMarketCapAccount } from '../entity'

@singleton()
@EntityRepository(CoinMarketCapAccount)
export class CoinMarketCapAccountRepository extends Repository<CoinMarketCapAccount> {
    public async findAllEnabledAccounts(): Promise<CoinMarketCapAccount[]> {
        return this.find({
            where: {
                isDisabled: false,
            },
        })
    }
}
