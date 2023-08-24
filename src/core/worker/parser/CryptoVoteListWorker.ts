import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { NewestCheckedTokenService, TokensService } from '../../service'
import { RetryAxios, Blockchain, tokenAddressRegexp } from '../../../utils'
import { NewestTokenChecker, StopCheckException } from './NewestTokenChecker'

@singleton()
export class CryptoVoteListWorker extends NewestTokenChecker {
    //here we have 12 predefined rows on ech page we need to skip
    private readonly predefinedTokensOffset = 12

    public constructor(
        private readonly tokensService: TokensService,
        protected readonly newestCheckedTokenService: NewestCheckedTokenService,
        private readonly retryAxios: RetryAxios,
        protected readonly logger: Logger,
    ) {
        super(
            CryptoVoteListWorker.name,
            newestCheckedTokenService,
            logger,
        )
    }

    protected override async checkPage(page: number): Promise<void> {
        const tokens = await this.fetchTokens(page)

        if (this.noTokens(tokens)) {
            throw new StopCheckException(this.allPagesAreChecked)
        }

        for (let i = this.predefinedTokensOffset; i < tokens.length; i++) {
            await this.processToken(tokens[i])
        }
    }

    private async fetchTokens(page: number): Promise<string[]> {
        const response = await this.retryAxios.get(this.buildPageUrl(page), this.logger)

        return response.data.match(RegExp('<tr>(.+?)</tr>', 'gs')) ?? []
    }

    private buildPageUrl(page: number): string {
        return `https://cryptovotelist.com/newborns/page/${page}`
    }

    private noTokens(tokens: string[]): boolean {
        return this.predefinedTokensOffset >= tokens.length
    }

    private async processToken(tokenInfo: string): Promise<void> {
        const blockchain = this.getBlockchain(tokenInfo)
        const tokenAddress = this.getTokenAddress(tokenInfo)
        const tokenName = this.getName(tokenInfo)

        await this.newestCheckedCheck(tokenName)

        if (!blockchain) {
            return
        }

        await this.tokensService.addIfNotExists(
            tokenAddress,
            tokenName,
            [],
            [],
            [],
            this.workerName,
            blockchain,
        )
    }

    private getBlockchain(tokenInfo: string): Blockchain | null {
        if (tokenInfo.includes('Binance Smart Chain')) {
            return Blockchain.BSC
        }

        if (tokenInfo.includes('Ethereum')) {
            return Blockchain.ETH
        }

        return null
    }

    private getTokenAddress(tokenInfo: string): string {
        return tokenInfo.toLowerCase().match(RegExp(tokenAddressRegexp))?.[0] ?? ''
    }

    private getName(tokenInfo: string): string {
        const name = tokenInfo
            .match(RegExp('<b>(.+?)</font></b>'))?.[0]
            .replace('<b>', '')
            .replace('</font></b>', '')
            ?? ''

        const symbol = tokenInfo
            .match(RegExp('<small>(.+?)</small>'))?.[0]
            .replace('<small>', '')
            .replace('</small>', '')
            ?? ''

        return `${name} (${symbol})`
    }
}
