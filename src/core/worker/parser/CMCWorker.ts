import { singleton } from 'tsyringe'
import { ParserWorkersService, TokensService } from '../../service'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, logger, parseBlockchainName } from '../../../utils'
import config from 'config'
import { CMCCryptocurrency } from '../../../types'

@singleton()
export class CMCWorker extends AbstractTokenWorker {
    private readonly workerName = 'CMC'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly supportedBlockchains = Object.values(Blockchain)

    public constructor(
        private readonly parserWorkersService: ParserWorkersService,
        private readonly tokensService: TokensService,
    ) {
        super()
    }

    public async run(): Promise<any> {
        logger.info(`${this.prefixLog} started`)

        const requestLimit = config.get<number>('cmc_request_limit')
        let requestStart = config.get<number>('cmc_request_start')

        // eslint-disable-next-line
        while (true) {
            const tokens = await this.parserWorkersService.getCmcLastTokens(requestStart, requestLimit)

            await this.processTokens(tokens.data)

            if (tokens.data.length < requestLimit) {
                break
            }

            requestStart += requestLimit
        }
    }

    private async processTokens(tokens: CMCCryptocurrency[]): Promise<void> {
        let token

        for (let i = 0; i < tokens.length; i++) {
            token = tokens[i]

            if (!token.platform?.token_address) {
                logger.warn(`${this.prefixLog} No address info found for ${token.name} . Skipping`)

                continue
            }

            let blockchain: Blockchain
            try {
                blockchain = parseBlockchainName(token.platform.slug)
            } catch (err) {
                logger.warn(`${this.prefixLog} Unknown blockchain (${token.platform.slug}) for ${token.name} . Skipping`)

                continue
            }

            if (!this.supportedBlockchains.includes(blockchain)) {
                logger.warn(`${this.prefixLog} Different blockchain found ${token.name} . Skipping`)

                continue
            }

            const tokenInfos = await this.parserWorkersService.getCmcTokenInfo(token.slug)

            if (!tokenInfos.data || !tokenInfos.data[token.id]) {
                logger.info(`${this.prefixLog} No token info found for ${token.name} . Skipping`)

                continue
            }

            const tokenInfo = tokenInfos.data[token.id]

            const tokenAddress = token.platform.token_address
            const tokenName = token.name
            const website = tokenInfo.urls.website?.length ? tokenInfo.urls.website[0] : ''
            const email = ''
            const links = this.getUsefulLinks(tokenInfo.urls)

            if (!await this.tokensService.findByAddress(tokenAddress, blockchain)) {
                await this.tokensService.addIfNotExists(
                    tokenAddress,
                    tokenName,
                    [ website ],
                    [ email ],
                    links,
                    this.workerName,
                    blockchain,
                )

                logger.info(
                    `${this.prefixLog} Added to DB: `,
                    tokenAddress,
                    tokenName,
                    website,
                    email,
                    links.join(','),
                    blockchain
                )
            } else {
                logger.info(`${this.prefixLog} ${token.name} already added. Skipping`)
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
