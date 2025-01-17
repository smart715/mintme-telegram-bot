import {
    ContactHistoryService,
    ContactMessageService,
    ContactQueueService,
    MailerService,
    TokensService,
} from '../../../service'
import { ContactHistoryStatusType, ContactMethod } from '../../../types'
import { sleep, isValidEmail } from '../../../../utils'
import { ContactHistory, ContactMessage, QueuedContact, Token } from '../../../entity'
import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import dns from 'dns/promises'

@singleton()
export class MailerWorker {
    private readonly workerName = MailerWorker.name
    private readonly queueIsEmptySleepTime = 60 * 1000
    private readonly sleepTimeBetweenItems = 5 * 1000
    private readonly maxRetries = 5

    public constructor(
        private readonly contactQueueService: ContactQueueService,
        private readonly tokensService: TokensService,
        private readonly contactMessageService: ContactMessageService,
        private readonly contactHistoryService: ContactHistoryService,
        private readonly mailer: MailerService,
        private readonly logger: Logger,
    ) { }

    public async run(): Promise<void> {
        this.logger.info(`[${this.workerName}] Started`)

        await this.contactQueueService.resetProcessingStat(ContactMethod.EMAIL)

        // eslint-disable-next-line
        while (true) {
            const queueItem = await this.contactQueueService.getFirstFromQueue(ContactMethod.EMAIL, this.logger)

            if (!queueItem) {
                this.logger.info(`[${this.workerName}] Email queue is empty, sleep...`)
                await sleep(this.queueIsEmptySleepTime)

                continue
            }

            await this.processQueueItem(queueItem)
            await sleep(this.sleepTimeBetweenItems)
        }
    }

    private async processQueueItem(queueItem: QueuedContact, retries = 0): Promise<void> {
        const token = await this.tokensService.findByAddress(queueItem.address)

        if (!token) {
            await this.contactQueueService.removeFromQueue(queueItem.address, queueItem.blockchain)
            this.logger.info(`[${this.workerName}] No token for ${queueItem.address} :: ${queueItem.blockchain} . Skipping`)

            return
        }

        if (!isValidEmail(queueItem.channel)) {
            const correctedEmail = this.tokensService.correctEmail(queueItem.channel)

            if (correctedEmail && isValidEmail(correctedEmail)) {
                queueItem.channel = correctedEmail
            } else {
                await this.contactQueueService.markEntryAsError(queueItem)
                await this.mailer.sendFailedWorkerEmail(`Invalid email address: ${queueItem.channel}. Marked as an error.`)
                return
            }
        }


        const isValidQueuedContact = await this.contactQueueService.preContactCheckAndCorrect(
            queueItem,
            token,
            this.logger)

        if (!isValidQueuedContact) {
            return
        }


        this.logger.info(
            `[${this.workerName}] Started processing ${queueItem.address} ${queueItem.blockchain} :: ${queueItem.channel}. `
        )

        try {
            const contactResult = await this.contact(queueItem.channel, token)
            await this.contactQueueService.removeFromQueue(queueItem.address, queueItem.blockchain)
            await this.tokensService.postContactingActions(
                token,
                ContactMethod.EMAIL,
                ContactHistoryStatusType.SENT === contactResult,
            )
        } catch (error) {
            const typedError = error as Error
            this.logger.error(`[${this.workerName}] Error sending email: ${typedError.message}`)

            if (retries < this.maxRetries) {
                this.logger.info(`[${this.workerName}] Retrying email sending (Retry ${retries + 1})`)
                await sleep(this.sleepTimeBetweenItems)

                return this.processQueueItem(queueItem, retries + 1)
            } else {
                await this.handleMaxRetriesReached(queueItem)
            }
        }

        this.logger.info(`[${this.workerName}] ` +
            `Proceeding of ${queueItem.address} :: ${queueItem.blockchain} finished`
        )
    }

    private async handleMaxRetriesReached(queueItem: QueuedContact): Promise<void> {
        this.logger.info(`[${this.workerName}] Max retries reached. Marking the entry as an error.`)
        await this.contactQueueService.markEntryAsError(queueItem)
        await this.mailer.sendFailedWorkerEmail(`Max retries reached. Marking as an error: ${queueItem.channel}.`)
    }

    private async contact(email: string, token: Token): Promise<ContactHistoryStatusType> {
        const contactMessage = await this.getContactMessage(token.emailAttempts + 1, email)
        const [ title, content ] = await this.buildMessage(contactMessage, token)
        const contactResult = await this.sendEmail(email, title, content)

        await this.saveHistoryRecord(
            token,
            email,
            contactResult,
            contactMessage,
        )

        this.logger.info(`[${this.workerName}] ` +
            `Token ${token.address} was contacted to ${email} with status ${contactResult}.`
        )

        return contactResult
    }

    private async getContactMessage(currentAttempt: number, channel: string): Promise<ContactMessage> {
        const messageTemplate = await this.contactMessageService.getNextContactMessage(
            ContactMethod.EMAIL,
            currentAttempt,
            channel,
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
    ): Promise<ContactHistoryStatusType.SENT |
    ContactHistoryStatusType.ACCOUNT_NOT_EXISTS |
    ContactHistoryStatusType.NO_MX_RECORD> {
        try {
            const hostName = receiverEmail.split('@')
            const emailMxRecords = await dns.resolveMx(hostName[1])

            if (!emailMxRecords.length) {
                return ContactHistoryStatusType.NO_MX_RECORD
            }
        } catch (error) {
            this.logger.error(error)
            return ContactHistoryStatusType.NO_MX_RECORD
        }

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
}
