import { singleton } from 'tsyringe'
import { Between, EntityRepository, Repository } from 'typeorm'
import { ContactHistory, TwitterAccount } from '../entity'
import { GroupedContactsCount } from '../types'
import moment from 'moment'

@singleton()
@EntityRepository(ContactHistory)
export class ContactHistoryRepository extends Repository<ContactHistory> {
    public async getCountSentTwitterMessagesDaily(twitterAccount: TwitterAccount): Promise<number> {
        const now = moment().utc()
        const startOfDay = moment().utc().subtract(1, 'day').endOf('day')

        return this
            .count({
                where: {
                    twitterAccountId: twitterAccount.id,
                    isSuccess: true,
                    createdAt: Between(startOfDay.toDate(), now.toDate()),
                },
            })
    }

    public async getCountAttemptsTwitterDaily(twitterAccount: TwitterAccount): Promise<number> {
        const now = moment().utc()
        const startOfDay = moment().utc().subtract(1, 'day').endOf('day')

        return this
            .count({
                where: {
                    twitterAccountId: twitterAccount.id,
                    createdAt: Between(startOfDay.toDate(), now.toDate()),
                },
            })
    }

    public async findTotalCountGroupedByContactMethod(fromDate: Date): Promise<GroupedContactsCount[]> {
        const result = await this.createQueryBuilder()
            .select([
                'COUNT(*) as tokens',
                'blockchain',
                'contact_method',
                'is_success',
            ])
            .andWhere('created_at > :from', { from: fromDate })
            .groupBy('contact_method, is_success, blockchain')
            .orderBy('tokens', 'DESC')
            .getRawMany()

        return result as GroupedContactsCount[]
    }

    public async findLastContactAttempt(
        channel: string,
        tgAccountId: number|undefined
    ): Promise<ContactHistory | undefined> {
        const qryBuilder = this.createQueryBuilder()
            .where(channel)

        if (tgAccountId) {
            qryBuilder.andWhere('`tgAccountId` = :tgAccountId', { tgAccountId })
        }

        return qryBuilder
            .orderBy('createdAt DESC')
            .getOne()
    }
}
