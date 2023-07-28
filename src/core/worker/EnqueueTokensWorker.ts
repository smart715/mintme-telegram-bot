import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from './AbstractTokenWorker'
import { ChannelStatusService, ContactQueueService, MintmeService, TokensService } from '../service'
import { Blockchain, logger } from '../../utils'
import { ContactMethod, TokenContactStatusType } from '../types'
import { Token } from '../entity'

@singleton()
export class EnqueueTokensWorker extends AbstractTokenWorker {
    public constructor(
        private readonly tokensService: TokensService,
        private readonly mintmeService: MintmeService,
        private readonly channelStatusService: ChannelStatusService,
        private readonly contactQueueService: ContactQueueService,
    ) {
        super()
    }

    public async run(blockchain: Blockchain): Promise<any> {
        logger.info(`[${EnqueueTokensWorker.name}] Started for ${blockchain} blockchain`)

        let listedTokensAdresses: string[]
        try {
            listedTokensAdresses = await this.mintmeService.getCachedListedTokensAdresses()
            logger.info(`[${EnqueueTokensWorker.name}] Fetched listed addresses, amount: ${listedTokensAdresses.length}`)
        } catch (err: any) {
            logger.error(`[${EnqueueTokensWorker.name}] Could not fetch listed addresses, error: ${err?.message}`)

            listedTokensAdresses = []
        }

        const tokensToContact = await this.tokensService.getLastNotContactedTokens(blockchain)
        logger.info(`[${EnqueueTokensWorker.name}] Tokens to review: ${tokensToContact.length}`)

        let queuedTokensCount = 0
        let skippedTokensCount = 0

        for (let i = 0; i < tokensToContact.length; i++) {
            const token = tokensToContact[i]

            if (listedTokensAdresses.includes(token.address)) {
                logger.warn(`[${EnqueueTokensWorker.name}] Address ${token.address} already listed`)
                skippedTokensCount++

                return
            }

            const { enqueued, contactChannel, nextContactMethod } = await this.tryToEnqueueToken(token)

            await this.tokensService.saveTokenContactInfo(token)

            if (enqueued) {
                queuedTokensCount++
                logger.info(`[${EnqueueTokensWorker.name}] ` +
                    `Token ${token.address} was queded for ${nextContactMethod} (${contactChannel}). ` +
                    `Saved with status ${token.contactStatus}`
                )
            } else {
                skippedTokensCount++
                logger.warn(`[${EnqueueTokensWorker.name}] ` +
                    `Token ${token.address} don't have any available contact method. ` +
                    `Saved with status ${token.contactStatus}`
                )
            }
        }

        logger.info(
            `[${EnqueueTokensWorker.name}] Finished. ` +
            `Queued tokens: ${queuedTokensCount}, skipped tokens: ${skippedTokensCount}`
        )
    }

    public async tryToEnqueueToken(token: Token, isFutureContact: boolean = false): Promise<{
        enqueued: boolean,
        nextContactMethod: ContactMethod|null,
        contactChannel: string
    }> {
        const [ availableEmail, availableTwitter, availableTelegram ] = await this.getAvailableChannels(token)

        const { contactMethod: nextContactMethod, channel: contactChannel } = this.getNextContactMethod(
            token.lastContactMethod,
            availableEmail,
            availableTwitter,
            availableTelegram
        )

        if (!nextContactMethod) {
            if (0 === token.emailAttempts && 0 === token.twitterAttempts && 0 === token.telegramAttempts) {
                token.contactStatus = TokenContactStatusType.NO_CONTACTS
            } else {
                token.contactStatus = TokenContactStatusType.LIMIT_REACHED
            }

            return { enqueued: false, nextContactMethod: null, contactChannel: '' }
        } else {
            token.contactStatus = TokenContactStatusType.QUEUED

            await this.contactQueueService.addToQueue(token.address, token.blockchain, contactChannel, isFutureContact)

            return { enqueued: true, nextContactMethod, contactChannel }
        }
    }

    private async getAvailableChannels(token: Token): Promise<string[]> {
        const emails = this.tokensService.getEmails(token)
        const twitterChannels = this.tokensService.getTwitterAccounts(token)
        const telegramChannels = this.tokensService.getTelegramAccounts(token)

        const channelStatuses = await this.channelStatusService.getContactsByChannels(
            [ ...emails, ...twitterChannels, ...telegramChannels ],
        )

        const availableEmails = this.channelStatusService.getFirstAvailableChannelCached(
            emails,
            channelStatuses,
            token.address,
            token.blockchain
        )

        const availableTwitterChannels = this.channelStatusService.getFirstAvailableChannelCached(
            twitterChannels,
            channelStatuses,
            token.address,
            token.blockchain
        )

        const availableTelegramChannels = this.channelStatusService.getFirstAvailableChannelCached(
            telegramChannels,
            channelStatuses,
            token.address,
            token.blockchain
        )

        return [ availableEmails, availableTwitterChannels, availableTelegramChannels ]
    }

    // eslint-disable-next-line complexity
    private getNextContactMethod(
        lastContactMethod: ContactMethod,
        email: string,
        twitter: string,
        telegram: string,
    ): {contactMethod: ContactMethod|null, channel: string} {
        let contactMethod = null
        let channel = ''

        if (
            !lastContactMethod && email
            || lastContactMethod === ContactMethod.EMAIL && email && !twitter && !telegram
            || lastContactMethod === ContactMethod.TWITTER && email && !telegram
            || lastContactMethod === ContactMethod.TELEGRAM && email
        ) {
            contactMethod = ContactMethod.EMAIL
            channel = email
        } else if (
            !lastContactMethod && !email && twitter
            || lastContactMethod === ContactMethod.EMAIL && twitter
            || lastContactMethod === ContactMethod.TWITTER && twitter && !telegram && !email
            || lastContactMethod === ContactMethod.TELEGRAM && twitter && !email
        ) {
            contactMethod = ContactMethod.TWITTER
            channel = twitter
        } else if (
            !lastContactMethod && !email && !twitter && telegram
            || lastContactMethod === ContactMethod.EMAIL && telegram && !twitter
            || lastContactMethod === ContactMethod.TWITTER && telegram
            || lastContactMethod === ContactMethod.TELEGRAM && telegram && !email && !twitter
        ) {
            contactMethod = ContactMethod.TELEGRAM
            channel = telegram
        }

        return { contactMethod, channel }
    }
}
