import { singleton } from 'tsyringe'
import { TokenRepository } from '../repository'
import { Token } from '../entity'
import { Blockchain, getValidLinks, isValidEmail } from '../../utils'
import { ContactMethod } from '../types'
import { TokensCountGroupedBySourceAndBlockchain } from '../../types'

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

    public async getLastNotContactedTokens(blockchain: Blockchain,
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

    public getEmails(token: Token): string[] {
        return token.emails?.filter(email => isValidEmail(email)) ?? []
    }

    public getTwitterAccounts(token: Token): string[] {
        return getValidLinks(token.links, ContactMethod.TWITTER)
    }

    public getTelegramAccounts(token: Token): string[] {
        return getValidLinks(token.links, ContactMethod.TELEGRAM)
    }
}
