import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { CoinLoreService, ParserWorkersService, TokensService } from '../../service'
import { Builder, By, WebDriver } from 'selenium-webdriver'
import { Blockchain, logger } from '../../../utils'
import config from 'config'

@singleton()
export class CoinLoreWorker extends AbstractTokenWorker {
    private readonly workerName = 'coinlore'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly batchSize: number = config.get('coinlore_request_batch_size')

    public constructor(
        private parserWorkersService: ParserWorkersService,
        private tokensService: TokensService,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        let coinsCount = await this.parserWorkersService.getCoinLoreCoinsCount()

        logger.info('Creating selenium builder')

        const driver = await new Builder()
            .forBrowser('chrome')
            .usingServer('http://selenium-hub:4444')
            .build()

        logger.info('Selenium builder created ' + currentBlockchain)

        while (coinsCount > 0) {
            const coins = await this.parserWorkersService.loadCoinLoreTokensList(
                coinsCount - this.batchSize,
                this.batchSize
            )

            await this.processTokens(coins, driver)

            coinsCount -= this.batchSize
        }

        await driver.quit()
    }

    public async processTokens(coins: any[], driver: WebDriver): Promise<any> {
        let coin
        for (let i = 0; i < coins.length; i++) {
            coin = coins[i]

            logger.info(`${this.prefixLog} Fetching :: ${coin.name} (${coin.symbol})`)

            await driver.get(this.parserWorkersService.getCoinLoreTokenPageLink(coin.nameid))

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
                    logger.info(`${this.prefixLog} ${coin.name} (${coin.symbol}) :: didn't added :: wrong blockchain`)
                    continue
                }

                await this.tokensService.addIfNotExists(
                    tokenAddress,
                    `${coin.name} (${coin.symbol})`,
                    [ links.shift() || '' ],
                    [ '' ],
                    links,
                    'coinlore',
                    coinBlockchain
                )

                logger.info(`${this.prefixLog} ${coin.name} (${coin.symbol}) :: added :: ${tokenAddress}`)
            } catch (err: any) {
                logger.warn(`${this.prefixLog} ${coin.name} (${coin.symbol}) :: didn't added :: something went wrong`)

                throw err
            }
        }
    }
}
