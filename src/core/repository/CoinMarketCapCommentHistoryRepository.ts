import { singleton } from 'tsyringe'
import { Between, EntityRepository, Repository } from 'typeorm'
import { CoinMarketCapAccount, CoinMarketCapCommentHistory } from '../entity'

@singleton()
@EntityRepository(CoinMarketCapCommentHistory)
export class CoinMarketCapCommentHistoryRepository extends Repository<CoinMarketCapCommentHistory> {
    public async getAccountCommentsCountPerDay(cmcAccount: CoinMarketCapAccount): Promise<number> {
        const now = new Date()
        const oneDayAgo = new Date()
        oneDayAgo.setHours(now.getHours() - 24)

        return this
            .count({
                where: {
                    accountId: cmcAccount.id,
                    createdAt: Between(oneDayAgo, now),
                },
            })
    }

    public async getCoinSubmittedComments(coinId: string): Promise<CoinMarketCapCommentHistory[]> {
        return this.find({
            where: {
                coinId
            },
            order: {
                createdAt: 'DESC',
            },
        })
    }
}
