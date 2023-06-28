import { singleton } from "tsyringe"
import { BnbTokensRepository, CroTokensRepository } from "../repository"
import { BnbToken, CroToken, EtherscanToken } from "../entity"

@singleton()
export class TokensService {
    public constructor(
        private bnbTokensRepository: BnbTokensRepository,
        private etherscanTokensRepository: BnbTokensRepository,
        private croTokensRepository: CroTokensRepository
    ) {}

    public async findByAddress(
        address: string,
        blockchain: string,
    ): Promise<BnbToken | EtherscanToken | CroToken | undefined> {
        if (blockchain === "eth") {
            return this.etherscanTokensRepository.findByAddress(address)
        } else if (blockchain === "bnb") {
            return this.bnbTokensRepository.findByAddress(address)
        } else if (blockchain === "cro") {
            return this.croTokensRepository.findByAddress(address)
        }

        return undefined
    }

    public async add(
        tokenAddress: string,
        tokenName: string,
        website: string,
        email: string,
        links: string,
        workerSource: string,
        blockchain: string
    ): Promise<void> {
        let token

        if (blockchain === "ethereum") {
            token = new EtherscanToken()
        } else if (blockchain === "bnb") {
            token = new BnbToken()
        } else if (blockchain === "cro") {
            token = new CroToken()
        } else {
            return
        }

        token.tokenAddress = tokenAddress
        token.Name = tokenName
        token.website = website
        token.email = email
        token.links = links
        token.source = workerSource
        token.DateAdded = new Date()

        if (blockchain === "ethereum") {
            await this.etherscanTokensRepository.save(token)
        } else if (blockchain === "bnb") {
            await this.bnbTokensRepository.save(token)
        } else if (blockchain === "cro") {
            await this.croTokensRepository.save(token)
        }
    }
}