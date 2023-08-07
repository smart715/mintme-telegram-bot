import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, findContractAddress, getHrefFromTagString, getHrefValuesFromTagString, logger } from '../../../utils'
import { TokensService, AdvnService } from '../../service'
import { AdvnGeneralResponse } from '../../../types'

@singleton()
export class AdvnWorker extends AbstractTokenWorker {
    private readonly prefixLog = '[ADVN]'
    private readonly unsupportedBlockchains: Blockchain[] = [ Blockchain.CRO ]

    public constructor(
        private readonly advnService: AdvnService,
        private readonly tokenService: TokensService,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        logger.info(`${this.prefixLog} started`)

        if (this.unsupportedBlockchains.includes(currentBlockchain)) {
            logger.error(`[AdvnWorker] Unsupported blockchain: ${currentBlockchain}. Aborting.`)

            return
        }

        const target: string = Blockchain.BSC === currentBlockchain
            ? 'Binance'
            : 'Ethereum'

        let count: number = 3000
        let start: number = 0

        do {
            logger.info(`${this.prefixLog} Page start ${start}`)

            let tokens: AdvnGeneralResponse

            try {
                tokens = await this.advnService.getTokens(start)
            } catch (ex: any) {
                logger.error(
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
                    logger.warn(
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

                await this.tokenService.add(
                    tokenAddress,
                    name,
                    [ website ],
                    [ '' ],
                    links,
                    'ADVN',
                    currentBlockchain,
                )

                logger.info(
                    `${this.prefixLog} Added to DB:`,
                    tokenAddress,
                    name,
                    website,
                    links,
                    'ADVN',
                    currentBlockchain
                )
            }

            count = tokens.data.length
            start += 3000
        } while (count > 0)

        logger.info(`${this.prefixLog} Finished`)
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
