import { singleton } from 'tsyringe';
import { Blockchain, logger, parseContactMethod } from '../../utils';
import { ChannelStatusType, ContactHistoryStatusType, ContactMethod, TokenContactStatusType } from '../types';
import { ChannelStatusService, ContactHistoryService, ContactQueueService, TokensService } from '../service';
import { ContactMessage, Token } from '../entity';
import { EnqueueTokensWorker } from './EnqueueTokensWorker';

@singleton()
export class QueueWorker {

    public constructor(
        private readonly contactQueueService: ContactQueueService,
        private readonly channelStatusService: ChannelStatusService,
        private readonly tokensService: TokensService,
        private readonly contactHistoryService: ContactHistoryService,
        private readonly enqueueTokensWorker: EnqueueTokensWorker,
    ) { }

    public async run(blockchain: Blockchain, repeatSeconds: number): Promise<void> {
        logger.info(`[${QueueWorker.name}] Started for ${blockchain} blockchain`)

        if (repeatSeconds > 0) {
            await this.runQueueRepeatable(repeatSeconds)
        } else {
            await this.runQueueRecursively()
        }

        logger.info(`[${QueueWorker.name}] Finished.`)
    }

    private async runQueueRecursively(): Promise<void> {
        const queueItem = await this.contactQueueService.getFirstFromQueue()

        if (!queueItem) {
            logger.info(`[${QueueWorker.name}] Queue is empty.`)
            return
        }

        await this.contactQueueService.setProcessing(queueItem)

        const token = await this.tokensService.findByAddress(queueItem.address, queueItem.blockchain)

        if (!token) {
            await this.contactQueueService.removeFromQueue(queueItem.address, queueItem.blockchain)

            logger.info(`[${QueueWorker.name}] No token for ${queueItem.address} :: ${queueItem.blockchain} . Skipping`)

            return this.runQueueRecursively()
        }

        if (TokenContactStatusType.RESPONDED === token.contactStatus) {
            await this.contactQueueService.removeFromQueue(queueItem.address, queueItem.blockchain)

            logger.info(
                `[${QueueWorker.name}] ` +
                `Token for ${queueItem.address} :: ${queueItem.blockchain} is marked as responded. Skipping`
            )

            return this.runQueueRecursively()
        }

        logger.info(
            `[${QueueWorker.name}] Started proccessing ${queueItem.address} :: ${queueItem.channel}. `+
            `Status saved as processing`
        )

        const contactMethod = parseContactMethod(queueItem.channel)
        const message = await this.getContactMessage()

        let contactResult: ChannelStatusType

        if (ContactMethod.EMAIL === contactMethod) {
            contactResult = await this.contactViaEmail(queueItem.channel, message)
        } else if (ContactMethod.TWITTER === contactMethod) {
            contactResult = await this.contactViaTwitter(queueItem.channel, message)
        } else if (ContactMethod.TELEGRAM === contactMethod) {
            contactResult = await this.contactViaTelegram(queueItem.channel, message)
        } else {
            logger.warn(
                `[${QueueWorker.name}] Unknown contact method for ${queueItem.address} :: ${queueItem.channel}. ` +
                `Skipping`
            )

            return this.runQueueRecursively()
        }

        await this.channelStatusService.saveChannelStatus(
            queueItem.channel,
            token.address,
            token.blockchain,
            contactResult
        )

        await this.saveHistoryRecord(token, queueItem.channel, contactMethod, contactResult, message)

        logger.info(`[${QueueWorker.name}] ` +
            `Token ${token.address} was contacted to ${queueItem.channel} with status ${contactResult}.`
        )

        await this.contactQueueService.removeFromQueue(queueItem.address, queueItem.blockchain)

        this.updateTokenInfo(token, contactMethod)

        const isFutureContact = ChannelStatusType.ACTIVE === contactResult
        const {
            enqueued,
            contactChannel,
            nextContactMethod
        } = await this.enqueueTokensWorker.tryToEnqueueToken(token, isFutureContact)

        token.lastContactAttempt = new Date()
        await this.tokensService.saveTokenContactInfo(token)

        if (enqueued) {
            logger.info(`[${QueueWorker.name}] ` +
                `Token ${token.address} was queded for for future contact via ${nextContactMethod} (${contactChannel}). ` +
                `Saved with status ${token.contactStatus}`
            )
        } else {
            logger.warn(`[${QueueWorker.name}] ` +
                `Token ${token.address} don't have any available contact method. ` +
                `Saved with status ${token.contactStatus}`
            )
        }

        logger.info(`[${QueueWorker.name}] ` +
            `Proceeding of ${queueItem.address} :: ${queueItem.blockchain} finished`
        )

        return this.runQueueRecursively()
    }

    private async runQueueRepeatable(repeatInSeconds: number): Promise<void> {
        await this.runQueueRecursively()

        logger.info(`[${QueueWorker.name}] Sleeping for ${repeatInSeconds} seconds`)

        await new Promise(resolve => setTimeout(resolve, repeatInSeconds * 1000))

        await this.runQueueRepeatable(repeatInSeconds)
    }

    // TODO: task for another issue
    private async contactViaEmail(email: string, message: ContactMessage): Promise<ChannelStatusType> {
        await new Promise(resolve => setTimeout(resolve, 3000))

        return ChannelStatusType.ACTIVE
    }

    private async contactViaTwitter(twitterUrl: string, message: ContactMessage): Promise<ChannelStatusType> {
        await new Promise(resolve => setTimeout(resolve, 3000))

        return ChannelStatusType.ACTIVE
    }

    private async contactViaTelegram(telegramUrl: string, message: ContactMessage): Promise<ChannelStatusType> {
        await new Promise(resolve => setTimeout(resolve, 3000))

        return ChannelStatusType.ACTIVE
    }

    // TODO: Task for another issue
    private async getContactMessage(): Promise<ContactMessage> {
        return new ContactMessage()
    }

    private updateTokenInfo(token: Token, contactMethod: ContactMethod): void {
        if (ContactMethod.EMAIL === contactMethod) {
            token.lastContactMethod = ContactMethod.EMAIL
            token.emailAttempts++
        } else if (ContactMethod.TWITTER === contactMethod) {
            token.lastContactMethod = ContactMethod.TWITTER
            token.twitterAttempts++
        } else if (ContactMethod.TELEGRAM === contactMethod) {
            token.lastContactMethod = ContactMethod.TELEGRAM
            token.telegramAttempts++
        }

        token.lastContactAttempt = new Date()
    }

    private async saveHistoryRecord(
        token: Token,
        channel: string,
        contactMethod: ContactMethod,
        contactResult: ChannelStatusType,
        message: ContactMessage,
    ): Promise<void> {
        let status: ContactHistoryStatusType
        let isSuccess = false
        if (ChannelStatusType.ACTIVE === contactResult) {
            status = ContactHistoryStatusType.SENT
            isSuccess = true
        } else {
            // TODO: add proper typings
            status = contactResult as unknown as ContactHistoryStatusType
        }

        return this.contactHistoryService.addRecord(
            token.address,
            token.blockchain,
            contactMethod,
            isSuccess,
            message.id,
            channel,
            status
        )
    }
}
