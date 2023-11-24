import config from 'config'
import { singleton } from 'tsyringe'
import { ContactMessageRepository } from '../repository'
import { ContactMessage } from '../entity'
import { ContactMethod } from '../types'
import { ContactHistoryService } from './ContactHistoryService'

@singleton()
export class ContactMessageService {
    private readonly telegramMessagesPerAccount: number = config.get('telegram_unique_messages_per_account')

    public constructor(
        private contactMessageRepository: ContactMessageRepository,
        private contactHistoryService: ContactHistoryService,
    ) { }

    public async getAll(isTg: boolean): Promise<ContactMessage[]> {
        return this.contactMessageRepository.getAllMessages(isTg)
    }

    public async getNextContactMessage(
        contactMethod: ContactMethod,
        currentAttempt: number,
        channel: string,
    ): Promise<ContactMessage | undefined> {
        const isTgOnly = ContactMethod.TELEGRAM === contactMethod

        let contactMessage = await this.contactMessageRepository.getNextAttemptMessage(isTgOnly, currentAttempt)

        if (!contactMessage) {
            const lastSentMessageId = await this.contactHistoryService.getLastSentMessageId(channel)
            contactMessage = await this.contactMessageRepository.getRandomContactMessage(lastSentMessageId)
        }

        return contactMessage
    }

    public async getOneContactMessage(): Promise<ContactMessage|undefined> {
        return this.contactMessageRepository.findOne({ isTgOnly: false })
    }

    public async getAccountMessages(isTelegram: boolean, accountId: number): Promise<ContactMessage[]> {
        let messages = await this.contactMessageRepository.getAccountMessages(isTelegram, accountId)

        if (messages.length < this.telegramMessagesPerAccount) {
            await this.assignAccountMessages(accountId, (this.telegramMessagesPerAccount - messages.length))
            messages = await this.contactMessageRepository.getAccountMessages(isTelegram, accountId)
        }

        return messages
    }

    public async assignAccountMessages(accId: number, messagesCount: number): Promise<void> {
        const messages = await this.contactMessageRepository.find({
            where: {
                accountID: null,
                isTgOnly: true,
            },
            take: messagesCount,
        })

        if (messages.length > 0) {
            for (const message of messages) {
                message.accountID = accId
                await this.contactMessageRepository.save(message)
            }
        }
    }
}
