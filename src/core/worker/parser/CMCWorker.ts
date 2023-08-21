import { singleton } from 'tsyringe'
import { CMCService, TokensService } from '../../service'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, logger, parseBlockchainName } from '../../../utils'
import config from 'config'
import { CMCCryptocurrency } from '../../../types'

@singleton()
export class CMCWorker extends AbstractTokenWorker {
    public constructor(
        private readonly cmcService: CMCService,
        private readonly tokensService: TokensService,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<any> {
        logger.info(`${CMCWorker.name} started`)

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
                logger.info(`no token info found for ${token.name} . Skipping`)

                continue
            }

            const tokenInfo = tokenInfos.data[token.id]

            const tokenAddress = token.platform.token_address
            const tokenName = token.name
            const website = tokenInfo.urls.website?.length ? tokenInfo.urls.website[0] : ''
            const email = ''
            const links = this.getUsefulLinks(tokenInfo.urls)
            const workerSource = 'CMC'

            const foundToken = await this.tokensService.findByAddress(
                tokenAddress,
                blockchain,
            )

            if (foundToken) {
                logger.info(` ${token.name} already added. Skipping`)

                return
            } else {
                await this.tokensService.add(
                    tokenAddress,
                    tokenName,
                    [ website ],
                    [ email ],
                    links,
                    workerSource,
                    blockchain,
                )
                logger.info(
                    'Added to DB: ',
                    tokenAddress,
                    tokenName,
                    website,
                    email,
                    links.join(','),
                    workerSource,
                    blockchain
                )
            }
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
