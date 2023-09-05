import { singleton } from 'tsyringe'
import { Between, EntityRepository, Repository } from 'typeorm'
import { ContactHistory, TwitterAccount } from '../entity'

@singleton()
@EntityRepository(ContactHistory)
export class ContactHistoryRepository extends Repository<ContactHistory> {
    public async getCountSentTwitterMessagesDaily(twitterAccount: TwitterAccount): Promise<number> {
        const now = new Date()
        const oneDayAgo = new Date()
        oneDayAgo.setHours(now.getHours() - 24)

        return this
            .count({
                where: {
                    twitterAccountId: twitterAccount.id,
                    isSuccess: true,
                    createdAt: Between(oneDayAgo, now),
                },
            })
    }

    public async getCountAttemptsTwitterDaily(twitterAccount: TwitterAccount): Promise<number> {
        const now = new Date()
        const oneDayAgo = new Date()
        oneDayAgo.setHours(now.getHours() - 24)

        return this
            .count({
                where: {
                    twitterAccountId: twitterAccount.id,
                    createdAt: Between(oneDayAgo, now),
                },
            })
    }
}
