import { singleton } from "tsyringe";
import { AbstractTokenWorker } from "./AbstractTokenWorker";
import { CoinLoreService, TokensService } from "../service";
import { Builder, By, WebDriver } from "selenium-webdriver";

@singleton()
export class CoinLoreWorker extends AbstractTokenWorker {
    public readonly workerName: string = "coinlore"
    
    readonly BATCH_SIZE: number = 10

    public constructor(
        private coinLoreService: CoinLoreService,
        private tokensService: TokensService,
    ) {
        super()
    }

    public async run(): Promise<void> {
        let coinsCount = await this.coinLoreService.getCoinsCount()

        console.log("Creating selenium builder")

        let driver = await new Builder()
            .forBrowser('chrome')
            .usingServer('http://selenium-hub:4444')
            .build()

        console.log("Selenium builder created")

        while (coinsCount > 0) {
            const coins = await this.coinLoreService.loadTokensList(coinsCount - this.BATCH_SIZE, this.BATCH_SIZE)

            await this.processTokens(coins, driver)

            coinsCount -= this.BATCH_SIZE
        }

        await driver.quit()
    }

    public async processTokens(coins: any[], driver: WebDriver): Promise<any> {
        let coin
        for (let i = 0; i < coins.length; i++) {
            coin = coins[i]
            console.log(`Fetching :: ${coin.name} (${coin.symbol})`)
            await driver.get(this.coinLoreService.getTokenPageLink(coin.nameid))

            try {
                const tokenAddress = await driver.findElement(By.css('td.token-address')).getText()
                const linksElements = await driver.findElements(By.css('.coin__links_list a'))

                const links = []
                for (let j = 0; j < linksElements.length; j++) {
                    links.push(await linksElements[j].getAttribute('href'))
                }

                let coinBlockchain = null
                links.forEach((link) => {
                    if (link.includes("bscscan.com")) {
                        coinBlockchain = "bnb"
                    } else if (link.includes("etherscan.io")) {
                        coinBlockchain = "eth"
                    }
                })

                if (!coinBlockchain) {
                    console.log(`${coin.name} (${coin.symbol}) :: didn't added :: wrong blockchain`)
                    continue
                }

                await this.tokensService.addOrUpdateToken(
                    tokenAddress,
                    `${coin.name} (${coin.symbol})`,
                    [links.shift() || ""],
                    "",
                    links,
                    "coinlore",
                    coinBlockchain
                )
                console.log(`${coin.name} (${coin.symbol}) :: added :: ${tokenAddress}`)
            } catch (err: any) {
                console.log(`${coin.name} (${coin.symbol}) :: didn't added :: something went wrong`)
                console.log(err.message)
            }
        }
    }
}