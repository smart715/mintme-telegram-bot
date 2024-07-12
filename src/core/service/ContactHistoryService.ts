import moment from 'moment'
import { singleton } from 'tsyringe'
import { ContactHistoryRepository } from '../repository'
import { ContactHistoryStatusType, ContactMethod, GroupedContactsCount } from '../types'
import { ContactHistory, TwitterAccount } from '../entity'
import { Blockchain } from '../../utils'
import config from 'config'

@singleton()
export class ContactHistoryService {
    public constructor(
        private readonly contactHistoryRepository: ContactHistoryRepository,
    ) { }

    public async getAmountOfTelegramSentMessagesPerAccount(accountId: number): Promise<{ group: number, dm: number }> {
        const result = await this.contactHistoryRepository
            .createQueryBuilder()
            .select([ `SUM(CASE WHEN status LIKE 'SENT_GROUP%' THEN 1 ELSE 0 END) AS count_group`, `SUM(CASE WHEN status = 'SENT_DM' THEN 1 ELSE 0 END) AS count_dm` ])
            .where('tg_account_id = :accountId', { accountId })
            .andWhere('is_success = 1')
            .andWhere('created_at > :thresholdDate', { thresholdDate: moment().utc().subtract(1, 'day').format() })
            .getRawOne()

        return { group: result.count_group || 0, dm: result.count_dm || 0 }
    }

    public async getCountSentTwitterMessagesDaily(twitterAccount: TwitterAccount): Promise<number> {
        return this.contactHistoryRepository.getCountSentTwitterMessagesDaily(twitterAccount)
    }

    public async getCountAttemptsTwitterDaily(twitterAccount: TwitterAccount): Promise<number> {
        return this.contactHistoryRepository.getCountAttemptsTwitterDaily(twitterAccount)
    }

    public async addRecord(
        address: string,
        blockchain: Blockchain,
        contactMethod: ContactMethod,
        isSuccess: boolean,
        messageId: number,
        channel: string,
        status: ContactHistoryStatusType,
        tgAccountId?: number,
        twitterAccountId?: number,
    ): Promise<ContactHistory> {
        const contactHistoryRecord = new ContactHistory(
            address,
            blockchain,
            contactMethod,
            isSuccess,
            messageId,
            channel,
            status,
        )

        if (tgAccountId) {
            contactHistoryRecord.tgAccountId = tgAccountId
        }

        if (twitterAccountId) {
            contactHistoryRecord.twitterAccountId = twitterAccountId
        }

        await this.contactHistoryRepository.insert(contactHistoryRecord)

        return contactHistoryRecord
    }

    public async isFailedChannel(contactChannel: string): Promise<boolean> {
        const lastHistoryEntry = await this.contactHistoryRepository.createQueryBuilder()
            .where(`channel LIKE '%${contactChannel}'`)
            .andWhere(`NOT status ='UNKNOWN'`)
            .orderBy('created_at', 'DESC')
            .getOne()

        return !!lastHistoryEntry && !lastHistoryEntry.isSuccess
    }

    public async isFailedDuetoDisabledDm(contactChannel: string,
        contactMethod: ContactMethod,
    ): Promise<boolean> {
        if (ContactMethod.TWITTER !== contactMethod) {
            return false
        }

        const dmNotEnabledLimit = parseInt(config.get('dm_not_enabled_time_limit_in_days'))

        const lastFailEntry = await this.contactHistoryRepository.createQueryBuilder()
            .where(`channel LIKE '%${contactChannel}'`)
            .andWhere(`is_success = 0`)
            .orderBy('created_at', 'DESC')
            .getOne()

        return !!lastFailEntry &&
            ContactHistoryStatusType.DM_NOT_ENABLED === lastFailEntry.status &&
            moment().subtract(dmNotEnabledLimit, 'days').isAfter(moment(lastFailEntry.createdAt))
    }

    public async isChannelCanBeContacted(contactChannel: string): Promise<boolean> {
        const delaySameChannelInSeconds = parseInt(config.get('contact_frequency_same_channel_in_seconds'))

        const contactingCount = await this.contactHistoryRepository.createQueryBuilder()
            .where(`channel LIKE '%${contactChannel.replace('https://', '')}'`)
            .andWhere(
                '(created_at > :thresholdDate)',
                { thresholdDate: moment().utc().subtract(delaySameChannelInSeconds, 'second').format() }
            )
            .getCount()

        return 0 === contactingCount
    }

    public async getChannelContactTimes(contactChannel: string): Promise<number> {
        const contactTimes = await this.contactHistoryRepository.createQueryBuilder()
            .where(`channel = '${contactChannel}'`)
            .andWhere(`NOT status ='UNKNOWN'`)
            .getCount()
        return contactTimes
    }

    public async getTotalCountGroupedByContactMethod(fromDate: Date): Promise<GroupedContactsCount[]> {
        return this.contactHistoryRepository.findTotalCountGroupedByContactMethod(fromDate)
    }

    public async getLastSentMessageId(channel: string): Promise<number | undefined> {
        const lastContactAttempt = await this.contactHistoryRepository.findLastContactAttempt(channel, undefined)

        if (!lastContactAttempt) {
            return undefined
        }

        return lastContactAttempt.messageId
    }

    public async findLastContactAttempt(
        channel: string,
        tgAccountId: number|undefined
    ): Promise<ContactHistory | undefined> {
        return this.contactHistoryRepository.findLastContactAttempt(channel, tgAccountId)
    }
}
