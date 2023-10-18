import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { AbstractTokenWorker } from './AbstractTokenWorker'
import { ContactQueueService, MintmeService, TokensService, ContactHistoryService } from '../service'
import { Blockchain, getMaxAttemptsPerMethod } from '../../utils'
import { ContactHistoryStatusType, ContactMethod, TokenContactStatusType } from '../types'
import { Token } from '../entity'

@singleton()
export class EnqueueTokensWorker extends AbstractTokenWorker {
    public constructor(
        private readonly tokensService: TokensService,
        private readonly mintmeService: MintmeService,
        private readonly contactHistoryService: ContactHistoryService,
        private readonly contactQueueService: ContactQueueService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(blockchain: Blockchain|undefined): Promise<any> {
        this.logger.info(`[${EnqueueTokensWorker.name}] Started for ${blockchain} blockchain`)

        const listedTokensAdresses = await this.mintmeService.getCachedListedTokensAdresses()
        this.logger.info(`[${EnqueueTokensWorker.name}] Fetched listed addresses, amount: ${listedTokensAdresses.length}`)

        const tokensToContact = await this.tokensService.getLastNotContactedTokens(blockchain,
            getMaxAttemptsPerMethod(ContactMethod.EMAIL),
            getMaxAttemptsPerMethod(ContactMethod.TWITTER),
            getMaxAttemptsPerMethod(ContactMethod.TELEGRAM))
        this.logger.info(`[${EnqueueTokensWorker.name}] Tokens to review: ${tokensToContact.length}`)

        let queuedTokensCount = 0
        let skippedTokensCount = 0

        for (let i = 0; i < tokensToContact.length; i++) {
            const token = tokensToContact[i]
            this.logger.info(`Checking Token ${token.name}(${token.address}) - ${i+1}/${tokensToContact.length}`)

            if (listedTokensAdresses.includes(token.address)) {
                this.logger.warn(`[${EnqueueTokensWorker.name}] Address ${token.address} already listed`)
                skippedTokensCount++

                continue
            }

            if (await this.contactQueueService.isQueuedAddress(token.address)) {
                token.contactStatus = TokenContactStatusType.QUEUED
                await this.tokensService.saveTokenContactInfo(token)
                this.logger.warn(`[${EnqueueTokensWorker.name}] Address ${token.address} was already queued`)
                skippedTokensCount++
                continue
            }

            const { enqueued, contactChannel, nextContactMethod } = await this.tryToEnqueueToken(token)

            await this.tokensService.saveTokenContactInfo(token)

            if (enqueued) {
                queuedTokensCount++
                this.logger.info(`[${EnqueueTokensWorker.name}] ` +
                    `Token ${token.address} was queded for ${nextContactMethod} (${contactChannel}). ` +
                    `Saved with status ${token.contactStatus}`
                )
            } else {
                skippedTokensCount++
                this.logger.warn(`[${EnqueueTokensWorker.name}] ` +
                    `Token ${token.address} don't have any available contact method. ` +
                    `Saved with status ${token.contactStatus}`
                )
            }
        }

        this.logger.info(
            `[${EnqueueTokensWorker.name}] Finished. ` +
            `Queued tokens: ${queuedTokensCount}, skipped tokens: ${skippedTokensCount}`
        )
    }

    public async tryToEnqueueToken(token: Token, isFutureContact: boolean = false): Promise<{
        enqueued: boolean,
        nextContactMethod: ContactMethod | null,
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

            await this.contactQueueService.addToQueue(token.address,
                token.blockchain,
                contactChannel,
                isFutureContact,
                nextContactMethod
            )

            return { enqueued: true, nextContactMethod, contactChannel }
        }
    }

    private async checkTelegramLink(channel: string): Promise<string|undefined> {
        let link = channel.replace('https/', 'https:/')
            .replace('http/', 'https:/')
            .replace('http://', 'https://')
            .replace('www.', '')
            .replace('https://t.me/https://t.me/', 'https://t.me/')
            .replace('t.me/@', 't.me/')

        if (!link.startsWith('http')) {
            link = `https://${link}`
        }

        if (!link.startsWith('https://t.me/')) {
            this.logger.warn(`${link} is invalid`)
            return undefined
        }

        if (await this.contactQueueService.isQueuedChannel(link)) {
            this.logger.warn(`Telegram channel ${link} is already queued`)
            return undefined
        }

        if (await this.contactHistoryService.getChannelContactTimes(link) >=
        getMaxAttemptsPerMethod(ContactMethod.TELEGRAM)) {
            this.logger.warn(`Telegram channel ${link} was contacted before and channel limit hit`)
            return undefined
        }
        return link
    }

    private async getFirstNotFailedChannel(
        token: Token,
        channels: string[],
        contactMethod: ContactMethod): Promise<string> {
        for (const channel of channels) {
            const channelWithoutProtocol = channel.replace('https://', '')

            if (!await this.contactHistoryService.isFailedChannel(channelWithoutProtocol)) {
                if (contactMethod === ContactMethod.TELEGRAM) {
                    const link = await this.checkTelegramLink(channel)
                    if (!link) {
                        continue
                    }

                    this.logger.info(`Checking if telegram channel ${link} available`)

                    await new Promise(f => setTimeout(f, 1000))

                    if (await this.contactQueueService.isExistingTg(link, this.logger)) {
                        this.logger.info(`Telegram channel ${link} is active`)
                        return link
                    } else {
                        this.logger.warn(`Telegram channel ${link} not active`)
                        await this.contactHistoryService.addRecord(token.address,
                            token.blockchain,
                            ContactMethod.TELEGRAM,
                            false,
                            0,
                            link,
                            ContactHistoryStatusType.ACCOUNT_NOT_EXISTS)
                        continue
                    }
                }

                if (await this.contactQueueService.isQueuedChannel(channel)) {
                    this.logger.warn(`channel ${channel} is already queued`)
                    continue
                }

                if (await this.contactHistoryService.getChannelContactTimes(channel) >=
                getMaxAttemptsPerMethod(contactMethod)) {
                    this.logger.warn(`channel ${channel} was contacted before and channel limit hit`)
                    continue
                }

                return channel
            } else {
                this.logger.warn(`Skipping Channel ${channel} for previous faliure`)
                continue
            }
        }
        return ''
    }

    private async getAvailableChannels(token: Token): Promise<string[]> {
        const emails = this.tokensService.getEmails(token)
        const twitterChannels = this.tokensService.getTwitterAccounts(token)
        const telegramChannels = this.tokensService.getTelegramAccounts(token)

        let availableEmails = ''
        if (token.emailAttempts < getMaxAttemptsPerMethod(ContactMethod.EMAIL)) {
            availableEmails = await this.getFirstNotFailedChannel(token, emails, ContactMethod.EMAIL)
        }

        let availableTwitterChannels = ''
        if (token.twitterAttempts < getMaxAttemptsPerMethod(ContactMethod.TWITTER)) {
            availableTwitterChannels = await this.getFirstNotFailedChannel(token,
                twitterChannels,
                ContactMethod.TWITTER)
        }

        let availableTelegramChannels = ''
        if (token.telegramAttempts < getMaxAttemptsPerMethod(ContactMethod.TELEGRAM)) {
            availableTelegramChannels = await this.getFirstNotFailedChannel(token,
                telegramChannels,
                ContactMethod.TELEGRAM)
        }

        return [ availableEmails, availableTwitterChannels, availableTelegramChannels ]
    }

    // eslint-disable-next-line complexity
    private getNextContactMethod(
        lastContactMethod: ContactMethod,
        email: string,
        twitter: string,
        telegram: string,
    ): { contactMethod: ContactMethod | null, channel: string } {
        let contactMethod = null
        let channel = ''

        if (
            (!lastContactMethod && email)
            || (lastContactMethod === ContactMethod.EMAIL && email && !twitter && !telegram)
            || (lastContactMethod === ContactMethod.TWITTER && email && !telegram)
            || (lastContactMethod === ContactMethod.TELEGRAM && email)
        ) {
            contactMethod = ContactMethod.EMAIL
            channel = email
        } else if (
            (!lastContactMethod && !email && twitter)
            || (lastContactMethod === ContactMethod.EMAIL && twitter)
            || (lastContactMethod === ContactMethod.TWITTER && twitter && !telegram && !email)
            || (lastContactMethod === ContactMethod.TELEGRAM && twitter && !email)
        ) {
            contactMethod = ContactMethod.TWITTER
            channel = twitter
        } else if (
            (!lastContactMethod && !email && !twitter && telegram)
            || (lastContactMethod === ContactMethod.EMAIL && telegram && !twitter)
            || (lastContactMethod === ContactMethod.TWITTER && telegram)
            || (lastContactMethod === ContactMethod.TELEGRAM && telegram && !email && !twitter)
        ) {
            contactMethod = ContactMethod.TELEGRAM
            channel = telegram
        }

        return { contactMethod, channel }
    }
}
