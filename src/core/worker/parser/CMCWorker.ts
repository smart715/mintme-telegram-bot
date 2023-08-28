import { singleton } from 'tsyringe'
import { CMCService, TokensService } from '../../service'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { parseBlockchainName } from '../../../utils'
import { Logger } from 'winston'

@singleton()
export class CMCWorker extends AbstractTokenWorker {
    public constructor(
        private readonly cmcService: CMCService,
        private readonly tokensService: TokensService,
        private readonly logger: Logger
    ) {
        super()
    }

    public async run(): Promise<any> {
        this.logger.info(`${CMCWorker.name} started`)

        const tokens = await this.cmcService.getLastTokens(10325, 10)

        tokens.data.forEach(async token => {
            if (!token.platform?.token_address) {
                return
            }

            const tokenInfos = await this.cmcService.getTokenInfo(token.slug)

            if (!tokenInfos.data || !tokenInfos.data[token.id]) {
                this.logger.info(`no token info found for ${token.name} . Skipping`)

                return
            }

            const tokenInfo = tokenInfos.data[token.id]

            const tokenAddress = token.platform.token_address
            const tokenName = token.name
            const website = tokenInfo.urls.website?.length ? tokenInfo.urls.website[0] : ''
            const email = ''
            const links = this.getUsefulLinks(tokenInfo.urls)
            const workerSource = 'CMC'
            const blockchain = parseBlockchainName(token.platform.slug)

            const foundToken = await this.tokensService.findByAddress(
                tokenAddress,
                blockchain,
            )

            if (foundToken) {
                this.logger.info(` ${token.name} already added. Skipping`)

                return
            } else {
                await this.tokensService.addIfNotExists(
                    tokenAddress,
                    tokenName,
                    [ website ],
                    [ email ],
                    links,
                    workerSource,
                    blockchain,
                )
                this.logger.info(
                    'Added to DB: ',
                    [
                        tokenAddress,
                        tokenName,
                        website,
                        email,
                        links.join(','),
                        workerSource,
                        blockchain,
                    ]
                )
            }
        })
    }

    private getUsefulLinks(linksObj: {[type: string] : string[]}): string[] {
        const links: string[] = []

        Object.values(linksObj).forEach((links: string[]) => {
            links.push(...links)
        })

        return links
    }
}
