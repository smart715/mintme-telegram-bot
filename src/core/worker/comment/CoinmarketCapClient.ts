import { Logger } from 'winston'
import { By, Key, WebDriver, WebElement } from 'selenium-webdriver'
import { CoinMarketCapAccount } from '../../entity'
import {
    CMCService,
    SeleniumService,
} from '../../service'
import { destroyDriver } from '../../../utils'
import moment from 'moment'
import config from 'config'
import { CMCCryptocurrency, CMCWorkerConfig } from '../../types'
import { CoinMarketCommentWorker } from './CoinMarketCapCommentWorker'

export class CoinMarketCapClient {
    private readonly cmcAccount: CoinMarketCapAccount
    private driver: WebDriver
    private maxCommentsPerDay: number = 100
    private maxPerCycle: number = 8
    private currentlySubmitted: number = 0
    private continousFailedSubmits: number = 0
    private submittedCommentsPerDay: number = 0
    private maxCommentsPerCoin: number = 1
    private commentFrequency: number = 30
    public currentlyProcessingCoin: string = ''
    private parentWorker: CoinMarketCommentWorker

    public constructor(
        cmcAccount: CoinMarketCapAccount,
        parentWorker: CoinMarketCommentWorker,
        private readonly cmcService: CMCService,
        private readonly logger: Logger,
    ) {
        this.cmcAccount = cmcAccount
        this.parentWorker = parentWorker
    }

    public async init(): Promise<boolean> {
        this.log(`Creating driver instance`)

        this.submittedCommentsPerDay = await this.cmcService.getAccountCommentsCountPerDay(this.cmcAccount)

        if (!this.isBelowLimit()) {
            this.log(`Account is not below limits, Skipping`)
            return false
        }

        const isDriverCreated = await this.createDriverWithProxy()

        if (!isDriverCreated) {
            this.logger.warn(`Couldn't initialize driver with proxy`)
            return false
        }

        const isLoggedIn = await this.login()

        if (!isLoggedIn) {
            this.logger.warn(
                `[CMC Client ID: ${this.cmcAccount.id}] not initialized. Can't login. Skipping...`
            )
        }

        await this.cmcService.updateAccountLastLogin(this.cmcAccount, moment().toDate())
        this.log(`Logged in | Sent last 24H: ${this.submittedCommentsPerDay}`)

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

            await this.driver.sleep(5000)

            if (await this.isLoggedIn()) {
                return true
            }

            if (retries < 3) {
                this.log(`Retrying to login, Attempt #${retries}`)
                return await this.login(retries + 1)
            } else {
                this.logger.warn(
                    `[CMC Client ${this.cmcAccount.id}] ` +
                    `Account is banned or credentials are wrong, Disabling account`
                )

                await this.disableAccount()

                return false
            }
        } catch (e) {
            this.logger.error(e)
            return false
        }
    }

    private async getNewProxy(): Promise<boolean> {
        const newProxy = await this.cmcService.assignNewProxyForAccount(this.cmcAccount)

        if (!newProxy) {
            this.log(`No proxy stock available, Failed to initialize`)
            return false
        }

        this.cmcAccount.proxy = newProxy

        return true
    }

    private async createDriverWithProxy(): Promise<boolean> {
        if (!this.cmcAccount.proxy || this.cmcAccount.proxy.isDisabled) {
            this.logger.info(`Proxy is invalid or disabled, Getting new one`)
            if (!await this.getNewProxy()) {
                this.logger.warn(`No proxy stock available`)

                return false
            }
        }

        this.logger.info(`Creating driver instance`)
        this.driver = await SeleniumService.createDriver('', this.cmcAccount.proxy, this.logger)
        this.logger.info(`Testing if proxy working`)

        if (await SeleniumService.isInternetWorking(this.driver)) {
            return true
        } else {
            const retry = await this.createDriverWithProxy()
            return retry
        }
    }

    private async isLoggedIn(): Promise<boolean> {
        const loginBtn = await this.driver.findElements(By.css(`[data-btnname="Log In"]`))

        return 0 === loginBtn.length
    }

    private async disableAccount(): Promise<void> {
        this.cmcAccount.isDisabled = true
        await this.cmcService.setAccountAsDisabled(this.cmcAccount)
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

            if (this.isReachedCycleLimit()) {
                await this.cmcService.updateAccountLastLogin(this.cmcAccount, moment().toDate())

                this.log(`Reached cycle limit`)
                break
            }

            if (tokens.data.length < requestLimit) {
                break
            }

            if (this.cmcAccount.continousFailed >= 15) {
                this.log(`Account failed for ${this.cmcAccount.continousFailed} continous times, Banning account`)

                await this.disableAccount()
            }

            requestOffset += requestLimit
        }

        this.log(`worker finished`)
    }

    private async processTokens(coins: CMCCryptocurrency[]): Promise<void> {
        for (const coin of coins) {
            if (!coin.is_active) {
                this.log(`Coin ${coin.name} is inactive, Skipping`)
                continue
            }

            if (coin.name.toLowerCase().includes('mintme')) {
                this.log(`Our coin, skipping`)
                continue
            }

            if (this.parentWorker.isProcessingCoin(coin.slug)) {
                continue
            }

            if (this.isReachedCycleLimit()) {
                break
            }

            if (coin.slug.toLowerCase().includes('mintme')) {
                this.log(`Skipping our coin MintMe`)
                continue
            }

            if (this.continousFailedSubmits >= 5) {
                this.log(`Skipping account due to exceeding max continous failed submits`)

                await this.cmcService.updateContinousFailedSubmits(this.cmcAccount,
                    this.cmcAccount.continousFailed + this.continousFailedSubmits)

                await this.cmcService.updateAccountLastLogin(this.cmcAccount, moment().add(60, 'minutes').toDate())
                break
            }

            this.currentlyProcessingCoin = coin.slug

            const coinCommentHistory = await this.cmcService.getCoinSubmittedComments(coin.slug)
            if (coinCommentHistory.length &&
                moment().subtract(this.commentFrequency, 'days').isBefore(coinCommentHistory[0].createdAt)) {
                continue
            }

            if (this.maxCommentsPerCoin <= coinCommentHistory.length) {
                this.log(`Coin ${coin.name} was contacted ${coinCommentHistory.length} times, Skipping`)
                continue
            }

            const submittedCommentsIds = coinCommentHistory.map(entry => entry.commentId)
            const commentToSend = await this.cmcService.getRandomComment(submittedCommentsIds)

            if (!commentToSend) {
                this.log(`No available comment to send.`)
                return
            }

            this.log(`Posting a comment on ${coin.name}`)

            this.driver.get(`https://coinmarketcap.com/currencies/${coin.slug}`)

            await this.driver.sleep(5000)

            const splittedComment = commentToSend.content.split(' ')

            const startPostingBtn = this.driver.findElement(By.className('post-button-placeholder'))
            await startPostingBtn.click()

            const inputField = await this.driver.findElement(By.css(`[role="textbox"]`))

            await this.driver.sleep(10000)

            this.log(`Typing post on ${coin.name}`)
            let isFirstWord = true

            for (const part of splittedComment) {
                if (part.toLowerCase().includes('$mintme')) {
                    await this.inputAndSelectCoinMention('MINTME', 'MintMe.com Coin', inputField)
                }

                if (part.toLowerCase().includes('$coin') && !isFirstWord) {
                    await this.inputAndSelectCoinMention(coin.symbol, coin.name, inputField)
                }

                await inputField.sendKeys(part.replace('$coin', '').replace('$mintme', '') + ' ')
                await this.driver.sleep(100)

                isFirstWord = false
            }

            this.log(`Finished typing comment, Clicking post button after 10 seconds`)

            await this.driver.sleep(10000)

            const postButtonContainer = await this.driver.findElement(By.className('editor-post-button'))
            const postBtn = await postButtonContainer.findElement(By.css('button'))

            await this.driver.executeScript(`arguments[0].click()`, postBtn)

            let sleepTimes = 0
            let isSubmitted = false

            while (sleepTimes <= 60) {
                const pageSrc = await this.driver.getPageSource()

                if (pageSrc.toLowerCase().includes('post submitted')) {
                    isSubmitted = true
                    break
                }

                await this.driver.sleep(500)

                sleepTimes++
            }

            this.continousFailedSubmits++

            if (isSubmitted) {
                this.currentlySubmitted++
                this.continousFailedSubmits = 0

                await this.cmcService.updateContinousFailedSubmits(this.cmcAccount, 0)

                await this.cmcService.addNewHistoryAction(this.cmcAccount.id,
                    coin.slug,
                    this.cmcAccount.id)
            }

            this.log(`Finished posting on ${coin.name} | Is Submitted: ${isSubmitted}`)

            await this.driver.sleep(20000)
        }
    }

    private isReachedCycleLimit(): boolean {
        return this.currentlySubmitted >= this.maxPerCycle
    }

    private async inputAndSelectCoinMention(symbol: string, name:string, inputField: WebElement): Promise<void> {
        try {
            await inputField.sendKeys(`$${symbol}`)

            await this.driver.sleep(3000)

            const mentionPortalElement = await this.driver.findElement(By.css(`[data-cy="mentions-portal"]`))

            let isSelectedCorrectMention = false

            while (!isSelectedCorrectMention) {
                const selectedMention = await mentionPortalElement.findElement(By.className('selected'))?.getText()

                if (selectedMention.includes(name)) {
                    await inputField.sendKeys(Key.ENTER)
                    await inputField.sendKeys(` `)

                    isSelectedCorrectMention = true
                } else {
                    await inputField.sendKeys(Key.ARROW_DOWN)
                }
            }
        } catch (error) {
            this.log(`Couldn't get mention portal or selected item, Error: ${error}`)
            return
        }
    }

    public async destroyDriver(): Promise<void> {
        await destroyDriver(this.driver)
    }
}
