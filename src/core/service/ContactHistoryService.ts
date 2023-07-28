import { singleton } from 'tsyringe'
import { ContactHistoryRepository } from '../repository'
import { ContactHistoryStatusType, ContactMethod } from '../types'
import { ContactHistory } from '../entity'
import { Blockchain } from '../../utils'

@singleton()
export class ContactHistoryService {
    public constructor(
        private readonly contactHistoryRepository: ContactHistoryRepository,
    ) { }

    public async addRecord(
        address: string,
        blockchain: Blockchain,
        contactMethod: ContactMethod,
        isSuccess: boolean,
        messageId: number,
        channel: string,
        status: ContactHistoryStatusType
    ): Promise<void> {
        const contactHistoryRecord = new ContactHistory(
            address,
            blockchain,
            contactMethod,
            isSuccess,
            messageId,
            channel,
            status,
        )

        await this.contactHistoryRepository.insert(contactHistoryRecord)
    }
}
