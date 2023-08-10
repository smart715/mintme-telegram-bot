import { singleton } from 'tsyringe'
import { TokenRepository } from '../repository'
import { Token } from '../entity'
import { Blockchain, isValidEmail, isValidTgLink, isValidTwitterLink } from '../../utils'

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

    public async add(
        tokenAddress: string,
        tokenName: string,
        websites: string[],
        emails: string[],
        links: string[],
        workerSource: string,
        blockchain: Blockchain
    ): Promise<Token> {
        const token = new Token()

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

    public async getLastNotContactedTokens(blockchain: Blockchain): Promise<Token[]> {
        return this.tokenRepository.getLastNotContactedTokens(blockchain)
    }

    public async getNextWithoutTxDate(): Promise<Token | undefined> {
        return this.tokenRepository.getNextWithoutTxDate()
    }

    public getEmails(token: Token): string[] {
        return token.emails.filter(email => isValidEmail(email))
    }

    public getTwitterAccounts(token: Token): string[] {
        return token.links.filter(link => isValidTwitterLink(link))
    }

    public getTelegramAccounts(token: Token): string[] {
        return token.links.filter(link => isValidTgLink(link))
    }
}
