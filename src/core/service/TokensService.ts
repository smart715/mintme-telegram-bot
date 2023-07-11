import { singleton } from 'tsyringe'
import { TokenRepository } from '../repository'
import { Token } from '../entity'
import { Blockchain, isValidEmail, isValidTgLink, isValidTwitterLink } from '../../utils'

@singleton()
export class TokensService {
    public static readonly LINKS_DELIMITER: string = ','
    public static readonly EMAIL_DELIMITER: string = ','

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
        let token = new Token()

        token.address = tokenAddress
        token.blockchain = blockchain
        token.name = tokenName
        token.websites = websites.join(TokensService.LINKS_DELIMITER)
        token.emails = emails.join(TokensService.EMAIL_DELIMITER)
        token.links = links.join(TokensService.LINKS_DELIMITER)
        token.source = workerSource

        await this.tokenRepository.insert(token)

        return token
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

    public getEmails(token: Token): string[] {
        return token.emails && token.emails.includes('@')
            ? token.emails.split(TokensService.EMAIL_DELIMITER).filter((email) => isValidEmail(email))
            : []
    }

    public getTwitterAccounts(token: Token): string[] {
        return token.links && token.links.includes('twitter.com')
            ? token.links.split(TokensService.LINKS_DELIMITER).filter((link) => isValidTwitterLink(link))
            : []
    }

    public getTelegramAccounts(token: Token): string[] {
        return token.links && token.links.includes('t.me')
            ? token.links.split(TokensService.LINKS_DELIMITER).filter((link) => isValidTgLink(link))
            : []
    }
}
