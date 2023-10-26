import { Blockchain, sleep, TokenNamesGenerator } from '../../../utils'
import { LastCheckedTokenNameService, TokensService } from '../../service'
import axios from 'axios'
import { EthprolerTokenInfoResponse } from '../../types'
import { Logger } from 'winston'
import { AbstractParserWorker } from './AbstractParserWorker'

export class EthplorerWorker extends AbstractParserWorker {
    private readonly workerName = EthplorerWorker.name
    private readonly blockchain = Blockchain.ETH
    private readonly saveSeparator = '|'
    private readonly tokAddressIndex = 2
    private readonly sleepTimeBetweenAxiosRequests = 60 * 1000

    public constructor(
        private readonly tokenNamesGenerator: TokenNamesGenerator,
        private readonly lastCheckedTokenNameService: LastCheckedTokenNameService,
        private readonly tokensService: TokensService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        this.logger.info(`[${this.workerName}] Started`)

        const [ lastNameCombination, lastPage ] = await this.getLastCheckedConfiguration()
        let currentNameCombination = lastNameCombination
        let currentPage = lastPage + 1

        while (this.tokenNamesGenerator.noFurtherCombinations !== currentNameCombination) {
            await this.checkCombination(currentNameCombination, currentPage)

            currentPage = 1
            currentNameCombination = this.tokenNamesGenerator.getNextCombination(currentNameCombination)
        }

        this.logger.info(`[${this.workerName}] Finished`)
    }

    private async getLastCheckedConfiguration(): Promise<[string, number]> {
        const lastCheckedConfig = await this.lastCheckedTokenNameService.getLastCheckedTokenName(
            this.workerName,
            this.blockchain,
        )

        if (!lastCheckedConfig) {
            return [ this.tokenNamesGenerator.getNextCombination(''), 0 ]
        }

        const result = lastCheckedConfig.split(this.saveSeparator)

        return [ result[0], Number(result[1]) ]
    }

    private async checkCombination(nameCombination: string, startPage: number): Promise<void> {
        let page = startPage

        while (true) { // eslint-disable-line
            this.logger.info(`[${this.workerName}] Search: ${nameCombination}, Page: ${page}`)

            const tokens = await this.fetchTokens(nameCombination, page)

            if (!tokens.length) {
                break
            }

            for (const token of tokens) {
                const tokenAddress = token[this.tokAddressIndex]

                if (await this.tokensService.findByAddress(tokenAddress)) {
                    continue
                }

                await this.processTokenAddress(tokenAddress, page)
            }

            await this.saveLastCheckedConfig(nameCombination, page)

            page += 1
        }
    }

    private async fetchTokens(nameCombination: string, page: number): Promise<[]> {
        let response

        while (true) {  // eslint-disable-line
            try {
                response = await axios.get(this.buildPageUrl(nameCombination, page))
                await sleep(this.sleepTimeBetweenAxiosRequests)

                return response.data.results
            } catch (error) {
                this.logger.warn(`[${this.workerName}] Error response during fetching tokens page, sleep`)
            }

            await sleep(this.sleepTimeBetweenAxiosRequests)
        }
    }

    private buildPageUrl(nameCombination: string, page: number): string {
        return `https://ethplorer.io/service/service.php?page=${page}&pageSize=100&search=${nameCombination}`
    }

    private async processTokenAddress(tokenAddress: string, page: number): Promise<void> {
        this.logger.info(`[${this.workerName}] Checking Address: ${tokenAddress}, Page: ${page}`)

        const tokenInfo = await this.fetchTokenInfo(tokenAddress)
        const tokenName = this.getTokenName(tokenInfo)
        const links = this.getLinks(tokenInfo)

        if (links.length) {
            await this.tokensService.addOrUpdateToken(
                tokenAddress,
                tokenName,
                [ tokenInfo.token.website ],
                [],
                links,
                this.workerName,
                this.blockchain,
            )
        }
    }

    private async fetchTokenInfo(tokenAddress: string): Promise<EthprolerTokenInfoResponse> {
        let response

        while (true) {  // eslint-disable-line
            try {
                response = await axios.get(this.buildTokenUrl(tokenAddress))
                await sleep(this.sleepTimeBetweenAxiosRequests)

                return response.data
            } catch (error) {
                this.logger.warn(`[${this.workerName}] Error response during fetching token info, sleep`)
            }

            await sleep(this.sleepTimeBetweenAxiosRequests)
        }
    }

    private buildTokenUrl(tokenAddress: string): string {
        return `https://ethplorer.io/service/service.php?data=${tokenAddress}`
    }

    private getTokenName(tokenInfo: EthprolerTokenInfoResponse): string {
        return `${tokenInfo.token.name} (${tokenInfo.token.symbol})`
    }

    private getLinks(tokenInfo: EthprolerTokenInfoResponse): string[] {
        const links: string[] = []

        if (tokenInfo.token.telegram) {
            links.push(tokenInfo.token.telegram)
        }

        if (tokenInfo.token.facebook) {
            links.push('https://facebook.com/' + tokenInfo.token.facebook)
        }

        if (tokenInfo.token.twitter) {
            links.push('https://twitter.com/' + tokenInfo.token.twitter)
        }

        if (tokenInfo.token.reddit) {
            links.push('https://www.reddit.com/r/' + tokenInfo.token.reddit)
        }

        return links
    }

    private async saveLastCheckedConfig(nameCombination: string, page: number): Promise<void> {
        const combination = nameCombination + this.saveSeparator + page
        await this.lastCheckedTokenNameService.save(this.workerName, this.blockchain, combination)
    }
}
