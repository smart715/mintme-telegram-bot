import { singleton } from 'tsyringe'
import { TokenRepository } from '../repository'
import { Token } from '../entity'
import { Blockchain, getValidLinks, isValidEmail } from '../../utils'
import { ContactMethod, TokenContactStatusType, TokensCountGroupedBySourceAndBlockchain } from '../types'
import moment from 'moment'

@singleton()
export class TokensService {
    public constructor(
        private tokenRepository: TokenRepository,
    ) {}

    public async findByAddress(
        address: string,
        blockchain: Blockchain,
    ): Promise<Token | undefined> {
        return this.tokenRepository.findByAddressAndBlockchain(address, blockchain)
    }

    public async findByName(
        name: string,
        blockchain: Blockchain,
    ): Promise<Token | undefined> {
        return this.tokenRepository.findByNameAndBlockchain(name, blockchain)
    }

    public async addIfNotExists(
        tokenAddress: string,
        tokenName: string,
        websites: string[],
        emails: string[],
        links: string[],
        workerSource: string,
        blockchain: Blockchain
    ): Promise<Token> {
        let token = await this.findByAddress(tokenAddress, blockchain)

        if (token) {
            return token
        }

        token = new Token()

        token.address = tokenAddress
        token.blockchain = blockchain
        token.name = tokenName
        token.websites = websites
        token.emails = emails
        token.links = links
        token.source = workerSource

        await this.tokenRepository.insert(token)

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

    public async getNextWithoutTxDate(): Promise<Token | undefined> {
        return this.tokenRepository.getNextWithoutTxDate()
    }

    public async findIfThereRespondedTokensByQueuedChannel(
        queuedChannel: string,
        isEmail: boolean = false
    ): Promise<boolean> {
        const tokens = await this.tokenRepository.findTokensByQueuedChannel(queuedChannel, {
            isEmail,
            onlyResponded: true,
        })

        return !!tokens
    }

    public async findTokensByQueuedChannelAndMarkThemResponded(
        queuedChannel: string,
        isEmail: boolean = false
    ): Promise<void> {
        const tokens = await this.tokenRepository.findTokensByQueuedChannel(queuedChannel, { isEmail })

        tokens.forEach(async (token) => {
            await this.tokenRepository.save({
                id: token.id,
                contactStatus: TokenContactStatusType.RESPONDED,
            })
        })
    }

    public getEmails(token: Token): string[] {
        return token.emails?.filter(email => isValidEmail(email)) ?? []
    }

    public getTwitterAccounts(token: Token): string[] {
        return getValidLinks(token.links, ContactMethod.TWITTER)
    }

    public getTelegramAccounts(token: Token): string[] {
        return getValidLinks(token.links, ContactMethod.TELEGRAM)
    }

    public async postContactingActions(token: Token, contactMethod: ContactMethod): Promise<void> {
        token.lastContactMethod = contactMethod
        token.lastContactAttempt = moment().utc().toDate()
        token.contactStatus = TokenContactStatusType.CONTACTED

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

        return this.update(token)
    }
}
