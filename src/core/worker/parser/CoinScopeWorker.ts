import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, logger } from '../../../utils'
import { CoinScopeService, TokenCachedDataService, TokensService } from '../../service'
import { Builder, WebDriver } from 'selenium-webdriver'

@singleton()
export class CoinScopeWorker extends AbstractTokenWorker {
    public readonly workerName: string = 'CoinScope'

    public constructor(
        private readonly coinScopeService: CoinScopeService,
        private readonly tokensService: TokensService,
        private readonly tokenCachedDataRepository: TokenCachedDataService,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<any> {
        logger.info('Creating selenium builder')
        const cachedIds = (await this.tokenCachedDataRepository.getIdsBySource(this.workerName))
            .map((r) => (r as any).token_id)

        const driver = await new Builder()
            .forBrowser('chrome')
            .usingServer('http://selenium-hub:4444')
            .build()

        logger.info('Selenium builder created')

        try {
            const reactFolder = await this.coinScopeService.getReactBuildFolderName(driver)

            logger.info('react folder: ', reactFolder)

            let page = 1

            // eslint-disable-next-line
            while (true) {
                await new Promise(r => setTimeout(r, 2000))
                const tokensData = await this.coinScopeService.getTokensData(reactFolder, page, currentBlockchain)
                const coinSlugs = tokensData?.pageProps?.coinSlugs

                page++

                if (!coinSlugs || 0 === coinSlugs) {
                    break
                }

                for (let i = 0; i < coinSlugs.length; i++) {
                    if (cachedIds.includes(coinSlugs[i].toLowerCase())) {
                        logger.warn(`Found cached data for ${coinSlugs[i]}. Skipping`)
                        continue
                    }

                    await this.processTokenData(coinSlugs[i], driver, currentBlockchain)

                    await new Promise(r => setTimeout(r, 2000))
                }

                break
            }
        } catch (err) {
            driver.quit()

            throw err
        } finally {
            driver.quit()
        }
    }

    private async processTokenData(tokenId: string, driver: WebDriver, currentBlockchain: Blockchain): Promise<void> {
        const tokenData = await this.coinScopeService.scrapeTokenData(tokenId, driver)

        if (!tokenData.tokenAddress) {
            logger.warn(`Address not found for ${tokenId} (${tokenData.tokenName}). Skipping`)

            return
        }

        await this.tokensService.addOrUpdateToken(
            tokenData.tokenAddress,
            `${tokenData.tokenName} (${tokenId.toUpperCase()})`,
            [ tokenData.website ],
            '',
            tokenData.links,
            this.workerName,
            currentBlockchain,
        )

        await this.tokenCachedDataRepository.cacheTokenData(
            tokenId.toLowerCase(),
            this.workerName,
            JSON.stringify(tokenData),
        )

        logger.info(`Successfuly saved data about ${tokenId}`)
    }
}
