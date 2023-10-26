import { singleton } from 'tsyringe'
import { RetryAxios, Blockchain, parseBlockchainName } from '../../../utils'
import { TokensService } from '../../service'
import { MobulaSearchResponse } from '../../types'
import { Logger } from 'winston'
import { AbstractParserWorker } from './AbstractParserWorker'

@singleton()
export class MobulaWorker extends AbstractParserWorker {
    private readonly workerName = MobulaWorker.name
    private readonly searchUrl = `https://postgrest-external.app-mobula.com/assets?select=name%2Csymbol%2Ccontracts%2Cblockchains%2Cwebsite%2Ctwitter&or=%28name.ilike.%25%2Cname.ilike.%29`

    public constructor(
        private readonly tokensService: TokensService,
        private readonly retryAxios: RetryAxios,
        private readonly checkedTokenService: CheckedTokenService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        this.logger.info(`[${this.workerName}] Started`)

        const tokens = await this.fetchTokens()

        for (const token of tokens) {
            await this.addToken(token)
        }

        this.logger.info(`[${this.workerName}] Finished`)
    }

    private async fetchTokens(): Promise<MobulaSearchResponse[]> {
        const response = await this.retryAxios.get(this.searchUrl, this.logger)

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

            if (await this.checkedTokenService.isChecked(contractAddress, this.workerName)) {
                this.logger.warn(`${this.workerName} ${contractAddress} already checked. Skipping`)

                continue
            }

            await this.checkedTokenService.saveAsChecked(contractAddress, this.workerName)

            await this.tokensService.addOrUpdateToken(
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
