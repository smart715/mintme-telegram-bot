import { singleton } from "tsyringe"
import { CMCService, TokensService } from "../service"
import { AbstractTokenWorker } from "./AbstractTokenWorker"
import { Blockchain, logger, parseBlockchainName } from "../../utils"
import { CMCCryptocurrency } from "../../types"
import config from "config"

@singleton()
export class CMCWorker extends AbstractTokenWorker {
    public readonly workerName: string = "CMC"

    public constructor(
        private readonly cmcService: CMCService,
        private readonly tokensService: TokensService,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        logger.info(`${CMCWorker.name} started for ${currentBlockchain} blockchain`)

        const requestLimit = config.get<number>("cmc_request_limit")
        let requestStart = config.get<number>("cmc_request_start")

        while(true) {
            const tokens = await this.cmcService.getLastTokens(requestStart, requestLimit)

            await this.processTokens(tokens.data, currentBlockchain)

            if (tokens.data.length < requestLimit) {
                break
            }

            requestStart += requestLimit
        }
    }

    private async processTokens(tokens: CMCCryptocurrency[], currentBlockchain: Blockchain): Promise<void> {
        let token

        for (let i = 0; i < tokens.length; i++) {
            token = tokens[i]

            if (!token.platform?.token_address) {
                logger.warn(`No address info found for ${token.name} . Skipping`)

                continue
            }

            let blockchain: Blockchain
            try {
                blockchain = parseBlockchainName(token.platform.slug)
            } catch (err) {
                logger.warn(`Unknown blockchain (${token.platform.slug}) for ${token.name} . Skipping`)
    
                continue
            }

            if (currentBlockchain != blockchain) {
                logger.warn(`Different blockchain found ${token.name} . Skipping`)

                continue
            }

            const tokenInfos = await this.cmcService.getTokenInfo(token.slug)

            if (!tokenInfos.data || !tokenInfos.data[token.id]) {
                logger.warn(`No token info found for ${token.name} . Skipping`)

                continue
            }

            const tokenInfo = tokenInfos.data[token.id]

            const tokenAddress = token.platform.token_address
            const tokenName = `${token.name} (${token.symbol})`

            await this.tokensService.addOrUpdateToken(
                tokenAddress,
                tokenName,
                [tokenInfo.urls.website?.length ? tokenInfo.urls.website[0] : ""],
                "",
                this.getUsefulLinks(tokenInfo.urls),
                this.workerName,
                blockchain,
            )
            logger.info(`${tokenName} :: added :: ${tokenAddress}`)

            // sleep to avoid too many requests
            await new Promise(r => setTimeout(r, 2000))
        }
    }
    private getUsefulLinks(linksObj: {[type: string] : string[]}): string[] {
        const links: string[] = []

        Object.values(linksObj).forEach((links: string[]) => {
            links.push(...links)
        })

        return links
    }
}
