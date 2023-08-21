import { singleton } from 'tsyringe'
import { TokenRepository } from '../repository'
import { Token } from '../entity'
import { Blockchain, getValidLinks, isValidEmail } from '../../utils'
import { ContactMethod } from '../types'

@singleton()
export class TokensService {
    public readonly LINKS_DELIMITER: string = "\r\n"
    public readonly EMAIL_DELIMITER: string = ","

    public constructor(
        private tokenRepository: TokenRepository,
    ) {}

    public async findByAddress(
        address: string,
        blockchain: Blockchain,
    ): Promise<Token | undefined> {
        return this.tokenRepository.findByAddressAndBlockchain(address, blockchain)
    }

    public async addOrUpdateToken(
        tokenAddress: string,
        tokenName: string,
        websites: string[],
        email: string,
        links: string[],
        workerSource: string,
        blockchain: Blockchain
    ): Promise<void> {
        websites = this.normalizeLinks(websites)

        if (this.isAnyWebsiteForbidden(websites) || this.isTokenNameForbidden(tokenName)) {
            throw new Error("Forbidden website or token name")
        }

        links = this.normalizeLinks(links)

        const dbToken = await this.findByAddress(tokenAddress, blockchain)

        if (dbToken) {
            await this.updateToken(websites, email, links, blockchain, dbToken)
        } else {
            await this.insertToken(tokenAddress, tokenName, websites, email, links, workerSource, blockchain)
        }
    }

    private async insertToken(
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

    public async getLastNotContactedTokens(blockchain: Blockchain,
        maxEmailAttempts: number,
        maxTwitterAttempts: number,
        maxTelegramAttempts: number): Promise<Token[]> {
        return this.tokenRepository.getLastNotContactedTokens(blockchain,
            maxEmailAttempts,
            maxTwitterAttempts,
            maxTelegramAttempts)
    }

    public async getNextWithoutTxDate(): Promise<Token | undefined> {
        return this.tokenRepository.getNextWithoutTxDate()
    }

    public getEmails(token: Token): string[] {
        return token.emails.filter(email => isValidEmail(email))
    }

    public getTwitterAccounts(token: Token): string[] {
        return getValidLinks(token.links, ContactMethod.TWITTER)
    }

    public getTelegramAccounts(token: Token): string[] {
        return getValidLinks(token.links, ContactMethod.TELEGRAM)
    }
}
