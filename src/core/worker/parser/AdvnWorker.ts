import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import {
    Blockchain,
    findContractAddress,
    getHrefFromTagString,
    getHrefValuesFromTagString,
    parseBlockchainName,
} from '../../../utils'
import { TokensService, AdvnService } from '../../service'
import { AdvnGeneralResponse } from '../../../types'

@singleton()
export class AdvnWorker extends AbstractTokenWorker {
    private readonly workerName = 'ADVN'
    private readonly prefixLog = `[${this.workerName}]`

    public constructor(
        private readonly advnService: AdvnService,
        private readonly tokenService: TokensService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        this.logger.info(`${this.prefixLog} started`)

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
                if (!advnToken.platform) {
                    continue
                }

                let blockchain: Blockchain

                try {
                    blockchain = parseBlockchainName(advnToken.platform.toString())
                } catch (e) {
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

                const tokenInDb = await this.tokenService.findByAddress(tokenAddress, blockchain)

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
                    blockchain,
                )

                this.logger.info(
                    `${this.prefixLog} Added to DB:`,
                    [
                        tokenAddress,
                        name,
                        website,
                        links,
                        this.workerName,
                        blockchain,
                    ]
                )
            }

            count = tokens.data.length
            start += 3000
        } while (count > 0)

        this.logger.info(`${this.prefixLog} Finished`)
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
