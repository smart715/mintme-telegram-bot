import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { CoinLoreService, TokensService } from '../../service'
import { Builder, By, WebDriver } from 'selenium-webdriver'
import { Blockchain, logger } from '../../../utils'
import config from 'config'

@singleton()
export class CoinLoreWorker extends AbstractTokenWorker {
    public readonly workerName: string = 'coinlore'

    private readonly batchSize: number = config.get('coinlore_request_batch_size')

    public constructor(
        private coinLoreService: CoinLoreService,
        private tokensService: TokensService,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        let coinsCount = await this.coinLoreService.getCoinsCount()

        logger.info('Creating selenium builder')

        const driver = await new Builder()
            .forBrowser('chrome')
            .usingServer('http://selenium-hub:4444')
            .build()

        logger.info('Selenium builder created ' + currentBlockchain)

        while (coinsCount > 0) {
            const coins = await this.coinLoreService.loadTokensList(coinsCount - this.batchSize, this.batchSize)

            await this.processTokens(coins, driver)

            coinsCount -= this.batchSize
        }

        await driver.quit()
    }

    public async processTokens(coins: any[], driver: WebDriver): Promise<any> {
        let coin
        for (let i = 0; i < coins.length; i++) {
            coin = coins[i]
            logger.info(`Fetching :: ${coin.name} (${coin.symbol})`)
            await driver.get(this.coinLoreService.getTokenPageLink(coin.nameid))

            try {
                const tokenAddress = await driver.findElement(By.css('td.token-address')).getText()
                const linksElements = await driver.findElements(By.css('.coin__links_list a'))

                const links = []
                for (let j = 0; j < linksElements.length; j++) {
                    links.push(await linksElements[j].getAttribute('href'))
                }

                let coinBlockchain
                links.forEach((link) => {
                    if (link.includes('bscscan.com')) {
                        coinBlockchain = Blockchain.BSC
                    } else if (link.includes('etherscan.io')) {
                        coinBlockchain = Blockchain.ETH
                    }
                })

                if (!coinBlockchain) {
                    logger.info(`${coin.name} (${coin.symbol}) :: didn't added :: wrong blockchain`)
                    continue
                }

                await this.tokensService.addOrUpdateToken(
                    tokenAddress,
                    `${coin.name} (${coin.symbol})`,
                    [ links.shift() || '' ],
                    '',
                    links,
                    'coinlore',
                    coinBlockchain
                )
                logger.info(`${coin.name} (${coin.symbol}) :: added :: ${tokenAddress}`)
            } catch (err: any) {
                logger.warn(`${coin.name} (${coin.symbol}) :: didn't added :: something went wrong`)
                logger.warn(err.message)
            }
        }
    }
}
