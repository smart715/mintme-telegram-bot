import { singleton } from "tsyringe"
import { BnbTokensRepository, CroTokensRepository } from "../repository"
import { BnbToken, CroToken, EtherscanToken } from "../entity"
import { Blockchain } from "../../utils"

@singleton()
export class TokensService {
    public readonly LINKS_DELIMITER: string = "\r\n"
    public readonly EMAIL_DELIMITER: string = ","

    public constructor(
        private bnbTokensRepository: BnbTokensRepository,
        private etherscanTokensRepository: BnbTokensRepository,
        private croTokensRepository: CroTokensRepository
    ) {}

    public async findByAddress(
        address: string,
        blockchain: Blockchain,
    ): Promise<BnbToken | EtherscanToken | CroToken | undefined> {
        if (Blockchain.ETH === blockchain) {
            return this.etherscanTokensRepository.findByAddress(address)
        } else if (Blockchain.BSC === blockchain) {
            return this.bnbTokensRepository.findByAddress(address)
        } else if (Blockchain.CRO === blockchain) {
            return this.croTokensRepository.findByAddress(address)
        }

        return undefined
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
        normalizedWebsites: string[],
        email: string,
        normalizedLinks: string[],
        workerSource: string,
        blockchain: Blockchain
    ): Promise<void> {
        let token

        if (Blockchain.ETH === blockchain) {
            token = new EtherscanToken()
        } else if (Blockchain.BSC === blockchain) {
            token = new BnbToken()
        } else if (Blockchain.CRO === blockchain) {
            token = new CroToken()
        } else {
            throw new Error("Unknown blockchain")
        }

        token.tokenAddress = tokenAddress.toLowerCase()
        token.Name = tokenName
        token.website = this.linksToString(normalizedWebsites, this.LINKS_DELIMITER)
        token.email = email
        token.links = this.linksToString(normalizedLinks, this.LINKS_DELIMITER)
        token.source = workerSource
        token.DateAdded = new Date()

        if (Blockchain.ETH === blockchain) {
            await this.etherscanTokensRepository.save(token)
        } else if (Blockchain.BSC === blockchain) {
            await this.bnbTokensRepository.save(token)
        } else if (Blockchain.CRO === blockchain) {
            await this.croTokensRepository.save(token)
        }
    }

    private async updateToken(
        normalizedWebsites: string[],
        email: string,
        normalizedLinks: string[],
        blockchain: Blockchain,
        token: BnbToken | EtherscanToken | CroToken
    ): Promise<void> {
        const currentEmail = token.email.trim().replace("N/A", "")
        const currentWebsite = token.website.trim().replace("N/A", "")

        let hasChanges = false

        if (email && email != "" && email !== currentEmail && !currentEmail.includes(email)) {
            token.email = `${currentEmail}${currentEmail ? "," : ""}${email}`
            hasChanges = true
        }

        if (normalizedWebsites?.length) {
            const currentWebsites = this.linksStringToArray(currentWebsite, this.LINKS_DELIMITER)

            if (!this.isLinksArraysSame(normalizedWebsites, currentWebsites)) {
                token.website = this.linksToString(
                    this.mergeLinksArrays([...currentWebsites], normalizedWebsites),
                    this.LINKS_DELIMITER,
                )
                hasChanges = true
            }
        }

        if (normalizedLinks?.length) {
            const currentLinks = this.linksStringToArray(token.links, this.LINKS_DELIMITER)

            if (!this.isLinksArraysSame(normalizedLinks, currentLinks)) {
                token.links = this.linksToString(
                    this.mergeLinksArrays([...currentLinks], normalizedLinks),
                    this.LINKS_DELIMITER
                )
                hasChanges = true
            }
        }

        if (!hasChanges) {
            return
        }

        token.lastUpdate = new Date()

        if (Blockchain.ETH === blockchain) {
            await this.etherscanTokensRepository.save(token)
        } else if (Blockchain.BSC === blockchain) {
            await this.bnbTokensRepository.save(token)
        } else if (Blockchain.CRO === blockchain) {
            await this.croTokensRepository.save(token)
        } else {
            throw new Error("Unknown blockchain")
        }
    }

    private isWebsiteForbidden(website: string): boolean {
        const lowercased = website.toLocaleLowerCase()

        return lowercased.includes("realt.co") || lowercased.includes("cronos.org")
    }

    private isAnyWebsiteForbidden(websites: string[]): boolean {
        return websites.filter((website) => this.isWebsiteForbidden(website)).length > 0
    }

    private isTokenNameForbidden(name: string): boolean {
        const lowercasedName = name.toLowerCase()

        return lowercasedName.includes("x short") || lowercasedName.includes("x long") || name.startsWith("Aave ")
            || lowercasedName.includes("wrapped") || lowercasedName.includes("world 6 game")
            || "()" === lowercasedName.trim()
    }

    private normalizeLinks(links: string[]): string[] {
        return [...new Set(links
                .filter((link) => link !== null && link !== undefined && link !== "")
                .map((link) => link.toLowerCase().replace("mobile.twitter.com", "twitter.com").replace("www.", ""))
            )]
    }

    private linksToString(links: string[], delimiter: string): string {
        return links.join(delimiter)
    }

    private linksStringToArray(links: string, delimiter: string): string[] {
        return links.split(delimiter)
    }

    private isLinksArraysSame(arr1: string[], arr2: string[]): boolean {
        if (!arr1 || !arr2 || arr1.length !== arr2.length) {
            return false;
        }

        for (let i = 0; i < arr1.length; i++) {
            if (!arr1.includes(arr2[i])) {
                return false
            }
        }

        return true
    }

    private mergeLinksArrays(baseArray: string[], array: string[]): string[] {
        array.forEach((link) => {
            if (!baseArray.includes(link)) {
                baseArray.push(link)
            }
        })

        return baseArray
    }
}
