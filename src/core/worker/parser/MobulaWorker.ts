import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { singleton } from 'tsyringe'
import { RetryAxios, Blockchain, logger, parseBlockchainName } from '../../../utils'
import { TokensService } from '../../service'
import { MobulaSearchResponse } from '../../../types'

@singleton()
export class MobulaWorker extends AbstractTokenWorker {
    private readonly workerName = MobulaWorker.name
    private readonly searchUrl = `https://postgrest-external.app-mobula.com/assets?select=name%2Csymbol%2Ccontracts%2Cblockchains%2Cwebsite%2Ctwitter&or=%28name.ilike.%25%2Cname.ilike.%29`

    public constructor(
        private readonly tokensService: TokensService,
        private readonly retryAxios: RetryAxios,
    ) {
        super()
    }

    public async run(): Promise<void> {
        logger.info(`[${this.workerName}] Started`)

        const tokens = await this.fetchTokens()

        for (const token of tokens) {
            await this.addToken(token)
        }

        logger.info(`[${this.workerName}] Finished`)
    }

    private async fetchTokens(): Promise<MobulaSearchResponse[]> {
        const response = await this.retryAxios.get(this.searchUrl)

        return response.data
    }

    private async addToken(tokenInfo: MobulaSearchResponse): Promise<void> {
        const blockchains = tokenInfo.blockchains

        for (const rawBlockchain of blockchains) {
            const blockchain = this.parseBlockchain(rawBlockchain)
            const blockchainIndex = blockchains.indexOf(rawBlockchain)
            const contractAddress = tokenInfo.contracts[blockchainIndex]

            if (!blockchain || !contractAddress) {
                continue
            }

            await this.tokensService.addIfNotExists(
                contractAddress,
                this.getTokenName(tokenInfo),
                [ tokenInfo.website ],
                [],
                [ tokenInfo.twitter ],
                this.workerName,
                blockchain,
            )
        }
    }

    private getTokenName(tokenInfo: MobulaSearchResponse): string {
        return `${tokenInfo.name} (${tokenInfo.symbol})`
    }

    private parseBlockchain(rawBlockchain: string): Blockchain | null {
        try {
            return parseBlockchainName(rawBlockchain)
        } catch {
            return null
        }
    }
}
