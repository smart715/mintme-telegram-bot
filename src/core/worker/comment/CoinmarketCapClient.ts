import { Logger } from 'winston'
import { By, WebDriver } from 'selenium-webdriver'
import { CoinMarketCapAccount, CoinMarketCapComment } from '../../entity'
import {
    CMCService,
    SeleniumService,
} from '../../service'
import { destroyDriver } from '../../../utils'
import moment from 'moment'
import config from 'config'
import { CMCCryptocurrency, CMCWorkerConfig } from '../../types'

export class CoinMarketCapClient {
    private readonly cmcAccount: CoinMarketCapAccount
    private driver: WebDriver
    private maxCommentsPerDay: number = 30
    private submittedCommentsPerDay: number = 0
    private maxCommentsPerCoin: number = 1

    public constructor(
        cmcAccount: CoinMarketCapAccount,
        private readonly cmcService: CMCService,
        private readonly logger: Logger,
    ) {
        this.cmcAccount = cmcAccount
    }

    public async init(): Promise<boolean> {
        this.log(`Creating driver instance`)

        this.submittedCommentsPerDay = await this.cmcService.getAccountCommentsCountPerDay(this.cmcAccount)

        if (!this.isBelowLimit()) {
            this.log(`Account is not below limits, Skipping`)
            return false
        }

        this.driver = await SeleniumService.createDriver('', undefined, this.logger)

        const isLoggedIn = await this.login()

        if (!isLoggedIn) {
            this.logger.warn(
                `[CMC Client ID: ${this.cmcAccount.id}] not initialized. Can't login. Skipping...`
            )
        }

        this.log(`Logged in`)

        return true
    }

    private async login(retries: number = 1): Promise<boolean> {
        try {
            this.log(`Logging in, Attempt #${retries}`)

            await this.driver.get('https://coinmarketcap.com/')

            this.log(`Setting cookies`)

            const cookies: object = JSON.parse(this.cmcAccount.cookiesJSON)

            for (const [ key, value ] of Object.entries(cookies)) {
                await this.driver.manage().addCookie({
                    name: key,
                    value,
                    domain: '.coinmarketcap.com',
                    path: '/',
                    expiry: moment().add(1, 'year').toDate(),
                    httpOnly: 'Authorization' === key,
                    secure: 'Authorization' === key || 'x-csrf-token' === key,
                })
            }

            this.log(`Setting local storage`)

            const localStorage = JSON.parse(this.cmcAccount.localStorageJSON)

            for (const key of Object.keys(localStorage)) {
                await this.driver.executeScript('localStorage.setItem(arguments[0], arguments[1])', key, localStorage[key])
            }

            await this.driver.sleep(10000)

            await this.driver.navigate().refresh()

            await this.driver.sleep(300000)

            return true
            /*
            if (await this.isLoggedIn()) {
                return true
            }

            if (retries < 3) {
                this.log(`Retrying to login, Attempt #${retries}`)
                return await this.login(retries + 1)
            } else {
                this.logger.warn(
                    `[CMC Client ${this.cmcAccount.id}] ` +
                    `Account is banned or credentials are wrong, Err: USER_DEACTIVATED. Disabling account`
                )
                await this.disableAccount()

                return false
            }*/
        } catch (e) {
            this.logger.error(e)
            return false
        }
    }

    private isBelowLimit(): boolean {
        return this.submittedCommentsPerDay < this.maxCommentsPerDay
    }

    private log(message: string): void {
        this.logger.info(
            `[CMCC Worker ${this.cmcAccount.id}] ` +
            message
        )
    }

    public async startWorker(): Promise<void> {
        this.log(`Worker started`)

        const requestLimit = config.get<CMCWorkerConfig>('cmcWorker')['requestLimit']
        let requestOffset = config.get<CMCWorkerConfig>('cmcWorker')['requestOffset']

        while (true) { // eslint-disable-line
            const tokens = await this.cmcService.getLastTokens(requestOffset, requestLimit)

            await this.processTokens(tokens.data)

            if (tokens.data.length < requestLimit) {
                break
            }

            requestOffset += requestLimit
        }

        this.log(`worker finished`)
    }

    private async processTokens(coins: CMCCryptocurrency[]): Promise<void> {
        for (const coin of coins) {
            this.driver.get(`https://coinmarketcap.com/currencies/${coin.slug}`)

            const coinCommentHistory = await this.cmcService.getCoinSubmittedComments(coin.slug)

            if (this.maxCommentsPerCoin >= coinCommentHistory.length) {
                this.log(`Coin ${coin.name} was contacted ${coinCommentHistory.length} times, Skipping`)
                continue
            }

            const submittedCommentsIds = coinCommentHistory.map(entry => entry.commentId)
            const commentToSend = await this.cmcService.getRandomComment(submittedCommentsIds)
            
            if (!commentToSend) {
                this.log(`No available comment to send.`)
            }

            await this.driver.sleep(2000)
        }
    }

    private async getSelectedMentionText(): Promise<string | undefined> {
        try {
            const mentionPortalElement = await this.driver.findElement(By.css(`[data-cy="mentions-portal"]`))

            const selectedMention = await mentionPortalElement.findElement(By.className('selecrted'))

            return selectedMention.getText()
        } catch (error) {
            this.log(`Couldn't get mention portal or selected item, Error: ${error}`)
            return
        }
    }

    public async destroyDriver(): Promise<void> {
        await destroyDriver(this.driver)
    }
}
