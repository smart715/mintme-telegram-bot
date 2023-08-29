import { singleton } from 'tsyringe'
import { CMCService, CheckedTokenService, TokensService } from '../../service'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, parseBlockchainName, sleep } from '../../../utils'
import config from 'config'
import { CMCCryptocurrency } from '../../../types'
import { CMCWorkerConfig } from '../../types'
import { Logger } from 'winston'

@singleton()
export class CMCWorker extends AbstractTokenWorker {
    private readonly workerName = 'CMC'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly supportedBlockchains = Object.values(Blockchain)

    public constructor(
        private readonly cmcService: CMCService,
        private readonly tokensService: TokensService,
        private readonly checkedTokenService: CheckedTokenService,
        private readonly logger: Logger
    ) {
        super()
    }

    public async run(): Promise<any> {
        this.logger.info(`${this.prefixLog} Worker started`)

        const requestLimit = config.get<CMCWorkerConfig>('cmcWorker')['requestLimit']
        let requestOffset = config.get<CMCWorkerConfig>('cmcWorker')['requestOffset']

        while (true) { // eslint-disable-line
            const tokens = await this.cmcService.getLastTokens(requestOffset, requestLimit)

            await this.processTokens(tokens.data)

            if (tokens.data.length < requestLimit) {
                break
            }

            requestOffset += requestLimit
        }

        this.logger.info(`${this.prefixLog} worker finished`)
    }

    private async processTokens(tokens: CMCCryptocurrency[]): Promise<void> {
        for (const token of tokens) {
            if (await this.checkedTokenService.isChecked(token.slug, this.workerName)) {
                this.logger.warn(`${this.prefixLog} ${token.slug} already checked. Skipping`)

                continue
            }

            await this.checkedTokenService.saveAsChecked(token.slug, this.workerName)

            if (!token.platform?.token_address) {
                this.logger.warn(`${this.prefixLog} No address info found for ${token.name} . Skipping`)

                continue
            }

            let blockchain: Blockchain
            try {
                blockchain = parseBlockchainName(token.platform.slug)
            } catch (err) {
                this.logger.warn(`${this.prefixLog} Unknown blockchain (${token.platform.slug}) for ${token.name} . Skipping`)

                continue
            }

            if (!this.supportedBlockchains.includes(blockchain)) {
                this.logger.warn(`${this.prefixLog} Different blockchain found ${token.name} . Skipping`)

                continue
            }

            const tokenInfos = await this.cmcService.getTokenInfo(token.slug)

            if (!tokenInfos.data || !tokenInfos.data[token.id]) {
                this.logger.warn(`${this.prefixLog} No token info found for ${token.name} . Skipping`)

                continue
            }

            const tokenInfo = tokenInfos.data[token.id]

            const tokenAddress = token.platform.token_address
            const tokenName = token.name
            const website = tokenInfo.urls.website?.length ? tokenInfo.urls.website[0] : ''
            const email = ''
            const links = this.getUsefulLinks(tokenInfo.urls)

            await this.tokensService.addIfNotExists(
                tokenAddress,
                tokenName,
                [ website ],
                [ email ],
                links,
                this.workerName,
                blockchain,
            )

            this.logger.info(
                `${this.prefixLog} Token saved to database: `,
                [ tokenAddress, tokenName, blockchain ]
            )

            await sleep(2000)
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
