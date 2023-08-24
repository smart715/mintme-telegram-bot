import {
    ContactHistoryService,
    ContactMessageService,
    ContactQueueService,
    MailerService,
    TokensService,
} from '../../service'
import { EnqueueTokensWorker } from '../EnqueueTokensWorker'
import { ContactHistoryStatusType, ContactMethod, TokenContactStatusType } from '../../types'
import { logger, sleep } from '../../../utils'
import { ContactHistory, ContactMessage, QueuedContact, Token } from '../../entity'
import { singleton } from 'tsyringe'

@singleton()
export class MailerWorker {
    private readonly workerName = MailerWorker.name
    private readonly queueIsEmptySleepTime = 60 * 1000
    private readonly sleepTimeBetweenItems = 5 * 1000

    public constructor(
        private readonly contactQueueService: ContactQueueService,
        private readonly tokensService: TokensService,
        private readonly contactMessageService: ContactMessageService,
        private readonly contactHistoryService: ContactHistoryService,
        private readonly enqueueTokensWorker: EnqueueTokensWorker,
        private readonly mailer: MailerService,
    ) { }

    public async run(): Promise<void> {
        logger.info(`[${this.workerName}] Started`)

        // eslint-disable-next-line
        while (true) {
            const queueItem = await this.contactQueueService.getFirstFromQueue(ContactMethod.EMAIL)

            if (!queueItem) {
                logger.info(`[${this.workerName}] Email queue is empty, sleep...`)
                await sleep(this.queueIsEmptySleepTime)

                continue
            }

            await this.processQueueItem(queueItem)
            await sleep(this.sleepTimeBetweenItems)
        }
    }

    private async processQueueItem(queueItem: QueuedContact): Promise<void> {
        const token = await this.tokensService.findByAddress(queueItem.address, queueItem.blockchain)

        if (!token) {
            await this.contactQueueService.removeFromQueue(queueItem.address, queueItem.blockchain)
            logger.info(`[${this.workerName}] No token for ${queueItem.address} :: ${queueItem.blockchain} . Skipping`)

            return
        }

        if (TokenContactStatusType.RESPONDED === token.contactStatus) {
            await this.contactQueueService.removeFromQueue(queueItem.address, queueItem.blockchain)

            logger.info(
                `[${this.workerName}] ` +
                `Token for ${queueItem.address} :: ${queueItem.blockchain} is marked as responded. Removed from queue. Skipping`
            )

            return
        }

        logger.info(
            `[${this.workerName}] Started processing ${queueItem.address} ${queueItem.blockchain} :: ${queueItem.channel}. `
        )

        const contactResult = await this.contact(queueItem.channel, token)
        await this.contactQueueService.removeFromQueue(queueItem.address, queueItem.blockchain)
        await this.updateTokenInfo(token)

        await this.tryToEnqueueToken(token, contactResult)

        logger.info(`[${this.workerName}] ` +
            `Proceeding of ${queueItem.address} :: ${queueItem.blockchain} finished`
        )
    }

    private async contact(email: string, token: Token): Promise<ContactHistoryStatusType> {
        const contactMessage = await this.getContactMessage(token.emailAttempts + 1)
        const [ title, content ] = await this.buildMessage(contactMessage, token)
        const contactResult = await this.sendEmail(email, title, content)

        await this.saveHistoryRecord(
            token,
            email,
            contactResult,
            contactMessage,
        )

        logger.info(`[${this.workerName}] ` +
            `Token ${token.address} was contacted to ${email} with status ${contactResult}.`
        )

        return contactResult
    }

    private async getContactMessage(currentAttempt: number): Promise<ContactMessage> {
        const messageTemplate = await this.contactMessageService.getNextContactMessage(
            ContactMethod.EMAIL,
            currentAttempt,
        )

        if (!messageTemplate) {
            throw new Error(`[${this.workerName}] ` +
                `message template doesn't exist for ` +
                `contact method: ${ContactMethod.EMAIL}, attempt: ${currentAttempt}`
            )
        }

        return messageTemplate
    }

    private async buildMessage(contactMessage: ContactMessage, token: Token): Promise<string[]> {
        const title = contactMessage.title
            .replace(/XXXCOINXXX/g, token.name)
            .replace(/XXXBLOCKCHAINXXX/g, token.blockchain)

        const content = contactMessage.content
            .replace(/XXXCOINXXX/g, token.name)
            .replace(/XXXBLOCKCHAINXXX/g, token.blockchain)

        return [ title, content ]
    }

    private async sendEmail(
        receiverEmail: string,
        title: string,
        content: string,
    ): Promise<ContactHistoryStatusType.SENT | ContactHistoryStatusType.ACCOUNT_NOT_EXISTS> {
        return await this.mailer.sendEmail(receiverEmail, title, content)
            ? ContactHistoryStatusType.SENT
            : ContactHistoryStatusType.ACCOUNT_NOT_EXISTS
    }

    private async saveHistoryRecord(
        token: Token,
        email: string,
        contactResult: ContactHistoryStatusType,
        contactMessage: ContactMessage,
    ): Promise<ContactHistory> {
        return this.contactHistoryService.addRecord(
            token.address,
            token.blockchain,
            ContactMethod.EMAIL,
            ContactHistoryStatusType.SENT === contactResult,
            contactMessage.id,
            email,
            contactResult,
        )
    }

    private async updateTokenInfo(token: Token): Promise<void> {
        token.lastContactMethod = ContactMethod.EMAIL
        token.emailAttempts++
        token.lastContactAttempt = new Date()

        return this.tokensService.update(token)
    }

    private async tryToEnqueueToken(token: Token, contactResult: ContactHistoryStatusType): Promise<void> {
        const isFutureContact = ContactHistoryStatusType.SENT === contactResult
        const {
            enqueued,
            contactChannel,
            nextContactMethod,
        } = await this.enqueueTokensWorker.tryToEnqueueToken(token, isFutureContact)

        if (enqueued) {
            logger.info(`[${this.workerName}] ` +
                `Token ${token.address} was queued for for future contact via ${nextContactMethod} (${contactChannel}). ` +
                `Saved with status ${token.contactStatus}`
            )
        } else {
            logger.warn(`[${this.workerName}] ` +
                `Token ${token.address} don't have any available contact method. ` +
                `Saved with status ${token.contactStatus}`
            )
        }
    }
}
