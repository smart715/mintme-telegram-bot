import { Logger } from 'winston'
import { By, Key, WebDriver, WebElement } from 'selenium-webdriver'
import { CoinMarketCapAccount, CoinMarketCapComment } from '../../entity'
import {
    CMCService,
    SeleniumService,
} from '../../service'
import { destroyDriver } from '../../../utils'
import moment from 'moment'
import config from 'config'
import { CategoryCoin, CMCCryptocurrency, CMCWorkerConfig } from '../../types'
import { CoinMarketCommentWorker } from './CoinMarketCapCommentWorker'
import { ClientInterface } from '../ClientInterface'

export class CoinMarketCapClient implements ClientInterface {
    private readonly cmcAccount: CoinMarketCapAccount
    private driver: WebDriver
    private config: CMCWorkerConfig = config.get<CMCWorkerConfig>('cmcWorker')
    private currentlySubmitted: number = 0
    private continousFailedSubmits: number = 0
    private submittedCommentsPerDay: number = 0
    private currentIndex: number = 0
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
            destroyDriver(this.driver)

            this.logger.warn(
                `[CMC Client ID: ${this.cmcAccount.id}] not initialized. Can't login. Skipping...`
            )
            return false
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
        //this.driver = await SeleniumService.createDriver('', this.cmcAccount.proxy, this.logger)
        this.driver = await SeleniumService.createDriver('', undefined, this.logger)
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
        return this.submittedCommentsPerDay < this.config.maxCommentsPerDay
    }

    private log(message: string): void {
        this.logger.info(
            `[CMCC Worker ${this.cmcAccount.id}] ` +
            message
        )
    }

    public async startWorker(): Promise<void> {
        this.log(`Worker started`)

        const categoryId = this.config.currentCategoryTargetId
        const requestLimit = categoryId.length ? 1000 : this.config.requestLimit
        let requestOffset = 1

        while (true) { // eslint-disable-line

            if (categoryId.length) {
                const tokens = await this.cmcService.getCategoryTokens(
                    categoryId,
                    requestOffset,
                    requestLimit
                )

                await this.processTokens(tokens.data.coins)

                if (tokens.data.coins.length < requestLimit) {
                    break
                }
            } else {
                const tokens = await this.cmcService.getLastTokens(requestOffset, requestLimit)

                await this.processTokens(tokens.data)

                if (tokens.data.length < requestLimit) {
                    break
                }
            }

            if (this.isReachedCycleLimit()) {
                await this.cmcService.updateAccountLastLogin(this.cmcAccount, moment().toDate())

                this.log(`Reached cycle limit`)
                break
            }

            if (this.cmcAccount.continousFailed >= this.config.continousFailsDelays.length) {
                this.log(`Account failed for ${this.cmcAccount.continousFailed} continous times, Banning account`)

                await this.disableAccount()
            }

            requestOffset += requestLimit
        }

        this.log(`worker finished`)
    }

    // eslint-disable-next-line complexity
    private async processTokens(coins: CMCCryptocurrency[] | CategoryCoin[]): Promise<void> {
        this.currentIndex = 0

        for (const coin of coins) {
            this.currentIndex++

            if (!coin.is_active) {
                this.log(`Coin ${coin.name} is inactive, Skipping`)
                continue
            }

            if (coin.name.toLowerCase().includes('mintme') || coin.slug.toLowerCase().includes('mintme')) {
                this.log(`Our coin, skipping`)
                continue
            }

            if (this.parentWorker.isProcessingCoin(coin.slug)) {
                continue
            }

            if (this.isReachedCycleLimit()) {
                break
            }

            if (!this.isLoggedIn()) {
                this.log(`Account suspended or session expired, Disabling account`)
                await this.disableAccount()

                break
            }

            if (this.continousFailedSubmits >= this.config.maxCycleContinousFail) {
                this.log(`Skipping account due to exceeding max continous failed submits`)

                await this.cmcService.updateContinousFailedSubmits(
                    this.cmcAccount,
                    false
                )

                const failDelay = this.config.continousFailsDelays[this.cmcAccount.continousFailed] || 1
                await this.cmcService.updateAccountLastLogin(this.cmcAccount, moment().add(failDelay, 'hours').toDate())

                break
            }

            this.currentlyProcessingCoin = coin.slug
            const coinCommentHistory = await this.cmcService.getCoinSubmittedComments(coin.slug)

            if (coinCommentHistory.length &&
                moment().subtract(this.config.commentFrequency, 'days').isBefore(coinCommentHistory[0].createdAt)) {
                continue
            }

            if (this.config.maxCommentsPerCoin <= coinCommentHistory.length) {
                this.log(`Coin ${coin.name} was contacted ${coinCommentHistory.length} times, Skipping`)
                continue
            }

            const submittedCommentsIds = coinCommentHistory.map(entry => entry.commentId)
            const commentToSend = await this.cmcService.getRandomComment(submittedCommentsIds)

            if (!commentToSend) {
                this.log(`No available comment to send.`)
                return
            }

            let attempt = 0

            while (attempt < 3) {
                try {
                    this.log(`Posting a comment on ${coin.name} - ${this.currentIndex +1}/${coins.length} | Attempt #${attempt}`)
                    await this.postComment(coin, commentToSend)
                    break
                } catch (error) {
                    attempt++
                    this.log(`An error happened while posting comment, Error: ${error}`)
                }
            }

            await this.driver.sleep(20000)
        }
    }

    private async postComment(
        coin: CMCCryptocurrency | CategoryCoin,
        commentToSend: CoinMarketCapComment
    ): Promise<void> {
        this.driver.get(`https://coinmarketcap.com/currencies/${coin.slug}`)

        await this.driver.sleep(10000)

        const splittedComment = commentToSend.content.split(' ')

        const startPostingBtn = this.driver.findElement(By.id('cmc-editor'))
        await startPostingBtn.click()

        const inputField = await this.driver.findElement(By.css(`[role="textbox"]`))

        await this.driver.sleep(5000)

        this.log(`Typing post on ${coin.name}`)
        let isFirstWord = true

        await inputField.sendKeys(Key.chord(Key.CONTROL, 'a'))
        await this.driver.sleep(200)

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

        await this.driver.sleep(5000)

        const postBtn = await this.getBtnWithText('Post comment')

        if (!postBtn) {
            throw new Error('No post button found')
        }

        await this.driver.executeScript(`arguments[0].click()`, postBtn)

        let sleepTimes = 0
        let isSubmitted = true

        while (sleepTimes <= 60) {
            const pageSrc = await this.driver.getPageSource()

            if (pageSrc.toLowerCase().includes('please try again later')) {
                isSubmitted = false
                break
            }

            await this.driver.sleep(500)

            sleepTimes++
        }

        this.continousFailedSubmits++

        if (isSubmitted) {
            this.currentlySubmitted++
            this.continousFailedSubmits = 0

            await this.cmcService.updateContinousFailedSubmits(this.cmcAccount, true)

            await this.cmcService.addNewHistoryAction(
                this.cmcAccount.id,
                coin.slug,
                this.cmcAccount.id
            )
        }

        this.log(`Finished posting on ${coin.name} | Is Submitted: ${isSubmitted}`)
    }

    private async getBtnWithText(textToFind: string): Promise<WebElement|undefined> {
        const btns = await this.driver.findElements(By.css('button'))

        for (const btn of btns) {
            const btnText = await btn.getText()
            if (btnText.toLowerCase().includes(textToFind.toLowerCase())) {
                return btn
            }
        }

        return undefined
    }

    private isReachedCycleLimit(): boolean {
        return this.currentlySubmitted >= this.config.maxPerCycle
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
