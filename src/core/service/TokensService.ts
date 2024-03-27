import { singleton } from 'tsyringe'
import { TokenRepository } from '../repository'
import { QueuedContact, Token } from '../entity'
import { Blockchain, getValidLinks, isForbiddenTokenName, isValidEmail } from '../../utils'
import { ContactMethod, TokenContactStatusType, TokensCountGroupedBySourceAndBlockchain } from '../types'
import moment from 'moment'
import { Logger } from 'winston'

@singleton()
export class TokensService {
    public constructor(
        private tokenRepository: TokenRepository,
    ) {}

    public async findByAddressAndBlockchain(
        address: string,
        blockchain: Blockchain,
    ): Promise<Token | undefined> {
        return this.tokenRepository.findByAddressAndBlockchain(address, blockchain)
    }

    public async findByAddress(
        address: string,
    ): Promise<Token | undefined> {
        return this.tokenRepository.findByAddress(address)
    }

    public async findByName(
        name: string,
        blockchain: Blockchain,
    ): Promise<Token | undefined> {
        return this.tokenRepository.findByNameAndBlockchain(name, blockchain)
    }

    public async addOrUpdateToken(
        tokenAddress: string,
        tokenName: string,
        websites: string[],
        emails: string[],
        links: string[],
        workerSource: string,
        blockchain: Blockchain,
        logger: Logger,
    ): Promise<Token | undefined> {
        let token = await this.findByAddress(tokenAddress)

        if (token) {
            return this.updateTokenLinks(token, websites, emails, links)
        }

        if (isForbiddenTokenName(tokenName)) {
            logger.warn(`Ignored token ${tokenName} ${tokenAddress} :: ${blockchain} due to forbidden name.`)
            return undefined
        }

        token = new Token()

        token.address = tokenAddress
        token.blockchain = blockchain
        token.name = tokenName
        token.websites = websites
        token.emails = emails
        token.links = links
        token.source = workerSource

        try {
            await this.tokenRepository.insert(token)
        } catch (error: any) {
            logger.warn(`cannot insert token due to error: ${error.message}`)
            return undefined
        }

        return token
    }

    private async updateTokenLinks(
        token: Token,
        newWebsites: string[],
        newEmails: string[],
        newLinks: string[],
    ): Promise<Token> {
        newWebsites.forEach(newWebsite => {
            if (!token.websites.includes(newWebsite)) {
                token.websites.push(newWebsite)
            }
        })

        newEmails.forEach(newEmail => {
            if (!token.emails.includes(newEmail)) {
                token.emails.push(newEmail)
            }
        })

        newLinks.forEach(newLink => {
            if (!token.links.includes(newLink)) {
                token.links.push(newLink)
            }
        })

        if (TokenContactStatusType.NO_CONTACTS === token.contactStatus ||
            TokenContactStatusType.LIMIT_REACHED === token.contactStatus) {
            token.contactStatus = TokenContactStatusType.NOT_CONTACTED
        }

        await this.update(token)

        return token
    }

    public async update(token: Token): Promise<void> {
        await this.tokenRepository.save(token)
    }

    public async saveTokenContactInfo(token: Token): Promise<void> {
        await this.tokenRepository
            .save({
                id: token.id,
                contactStatus: token.contactStatus,
                lastContactAttempt: token.lastContactAttempt,
                lastContactMethod: token.lastContactMethod,
                emailAttempts: token.emailAttempts,
                twitterAttempts: token.twitterAttempts,
                telegramAttempts: token.telegramAttempts,
            })
    }

    public async getLastNotContactedTokens(blockchain: Blockchain|undefined,
        maxEmailAttempts: number,
        maxTwitterAttempts: number,
        maxTelegramAttempts: number): Promise<Token[]> {
        return this.tokenRepository.getLastNotContactedTokens(blockchain,
            maxEmailAttempts,
            maxTwitterAttempts,
            maxTelegramAttempts)
    }

    public async getCountGroupedBySourceAndBlockchain(from: Date): Promise<TokensCountGroupedBySourceAndBlockchain[]> {
        return this.tokenRepository.findGroupedBySourceAndBlockchain(from)
    }

    public async getNextWithoutTxDate(supportedBlockchains: Blockchain[]): Promise<Token | undefined> {
        return this.tokenRepository.getNextWithoutTxDate(supportedBlockchains)
    }

    public async isChannelOfRespondedToken(
        queuedContact: QueuedContact,
    ): Promise<boolean> {
        const isEmail = ContactMethod.EMAIL === queuedContact.contactMethod

        const isChannelOfRespondedToken = await this.tokenRepository.isChannelOfRespondedToken(queuedContact.channel,
            isEmail,
        )

        return isChannelOfRespondedToken
    }

    public getEmails(token: Token): string[] {
        return (token.emails ?? []).map(email => this.correctEmail(email)).filter(email => email !== '')
    }

    public correctEmail(email: string): string {
        const emailParts = email.split('http')
        const firstPart = emailParts[0].trim()

        return isValidEmail(firstPart) ? firstPart : ''
    }

    public getTwitterAccounts(token: Token): string[] {
        return getValidLinks(token.links, ContactMethod.TWITTER)
    }

    public getTelegramAccounts(token: Token): string[] {
        return getValidLinks(token.links, ContactMethod.TELEGRAM)
    }

    public async postContactingActions(token: Token, contactMethod: ContactMethod, isSuccess: boolean): Promise<void> {
        if (isSuccess) {
            token.lastContactMethod = contactMethod

            switch (contactMethod) {
                case ContactMethod.EMAIL:
                    token.emailAttempts++
                    break
                case ContactMethod.TWITTER:
                    token.twitterAttempts++
                    break
                case ContactMethod.TELEGRAM:
                    token.telegramAttempts++
                    break
            }

            token.lastContactAttempt = moment().utc().toDate()
            token.contactStatus = TokenContactStatusType.CONTACTED
        } else {
            token.contactStatus = TokenContactStatusType.NOT_CONTACTED
        }

        return this.update(token)
    }
}
