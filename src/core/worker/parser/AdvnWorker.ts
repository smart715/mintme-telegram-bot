import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, findContractAddress, getHrefFromTagString, getHrefValuesFromTagString } from '../../../utils'
import { TokensService, AdvnService } from '../../service'
import { AdvnGeneralResponse } from '../../../types'

@singleton()
export class AdvnWorker extends AbstractTokenWorker {
    private readonly workerName = 'ADVN'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly unsupportedBlockchains: Blockchain[] = [ Blockchain.CRO ]

    public constructor(
        private readonly advnService: AdvnService,
        private readonly tokenService: TokensService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        this.logger.info(`${this.prefixLog} started`)

        if (this.unsupportedBlockchains.includes(currentBlockchain)) {
            this.logger.error(`${this.prefixLog} Unsupported blockchain: ${currentBlockchain}. Aborting.`)

            return
        }

        const target: string = this.getTarget(currentBlockchain)

        let count: number = 0
        let start: number = 0

        do {
            this.logger.info(`${this.prefixLog} Page start ${start}`)

            let tokens: AdvnGeneralResponse

            try {
                tokens = await this.advnService.getTokens(start)
            } catch (ex: any) {
                this.logger.error(
                    `${this.prefixLog} Aborting. Failed to fetch all tokens. Start: ${start} Reason: ${ex.message}`
                )

                return
            }

            for (const advnToken of tokens.data) {
                if (!advnToken.platform?.toString().includes(target)) {
                    continue
                }

                const nameSymbolArr = advnToken.name_symbol
                const name = nameSymbolArr[0] + '(' + nameSymbolArr[nameSymbolArr.length - 1] + ')'
                const id = name
                    .replace(' ', '-')
                    .replace('(', '-')
                    .replace(')', '')

                let tokenInfo: string

                try {
                    tokenInfo = await this.advnService.getTokenInfo(id)
                } catch (ex: any) {
                    this.logger.warn(
                        `${this.prefixLog} Failed to fetch token info for ${id} Reason: ${ex.message}. Skipping...`
                    )

                    continue
                }

                const tokenAddress = findContractAddress(tokenInfo)

                if (!tokenAddress || !tokenAddress.startsWith('0x')) {
                    continue
                }

                const website = this.getWebsite(tokenInfo)
                const links = this.getLinks(tokenInfo)

                const tokenInDb = await this.tokenService.findByAddress(tokenAddress, currentBlockchain)

                if (tokenInDb) {
                    continue
                }

                await this.tokenService.addIfNotExists(
                    tokenAddress,
                    name,
                    [ website ],
                    [ '' ],
                    links,
                    this.workerName,
                    currentBlockchain,
                )

                this.logger.info(
                    `${this.prefixLog} Added to DB:`,
                    [
                        tokenAddress,
                        name,
                        website,
                        links,
                        this.workerName,
                        currentBlockchain,
                    ]
                )
            }

            count = tokens.data.length
            start += 3000
        } while (count > 0)

        this.logger.info(`${this.prefixLog} Finished`)
    }

    private getTarget(blockchain: Blockchain): string {
        switch (blockchain) {
            case Blockchain.BSC:
                return 'Binance'
            case Blockchain.ETH:
                return 'Ethereum'
            default:
                throw new Error('Wrong blockchain provided. Target doesn\'t exists for provided blockchain')
        }
    }

    private getWebsite(tokenInfo: string): string {
        const websiteRawTags = tokenInfo.match(/<tr title="Official Website(.+?)<\/td>(.+?)<\/tr>/)

        if (null === websiteRawTags) {
            return ''
        }

        return getHrefFromTagString(websiteRawTags)
    }

    private getLinks(tokenInfo: string): string[] {
        const linksRawTags = tokenInfo.match(/<table class="table table-hover fundamentals social">(.+?)<\/table>/)

        if (null === linksRawTags) {
            return []
        }

        return getHrefValuesFromTagString(linksRawTags)
    }
}