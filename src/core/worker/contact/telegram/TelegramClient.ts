import config from 'config'
import { ContactMessage, TelegramAccount } from '../../../entity'
import {
    ContactHistoryService,
    SeleniumService,
    TokensService,
    ContactMessageService,
    ContactQueueService,
    TelegramService,
    ProxyService, MailerService,
} from '../../../service'
import { By, Key, WebDriver, WebElement } from 'selenium-webdriver'
import * as fs from 'fs'
import { Environment, getRandomNumber } from '../../../../utils'
import { ChatType, ContactHistoryStatusType, ContactMethod, TelegramChannelCheckResultType } from '../../../types'
import moment from 'moment'
import { Logger } from 'winston'
import { ClientInterface } from '../../ClientInterface'

export class TelegramClient implements ClientInterface {
    private readonly maxMessagesPerDay: number = config.get('telegram_account_max_day_messages')
    private readonly messagesDelay: number = config.get('telegram_messages_delay_in_seconds')
    private readonly limitLogginIn: number = config.get('telegram_limit_logging_in_in_mins')
    private readonly maxMessagesPerCycle: number = config.get('telegram_max_sent_messages_per_cycle')
    private readonly responsesWorkerDelay: number = config.get('telegram_responses_worker_delay')
    private readonly oldGroupMinimumAge: number = config.get('telegram_min_old_group_age')
    private readonly groupsLeaverWorkerDelay: number = config.get('telegram_groups_leaver_worker_delay')
    private sentMessages: number
    public telegramAccount: TelegramAccount
    private driver: WebDriver
    public accountMessages: ContactMessage[]
    private messageToSendIndex: number = 0
    public isInitialized: boolean = false
    private runResponeseWorker: boolean = false
    private runContactingWorker: boolean = false
    private runOldGroupsLeaver: boolean = false
    private potentialFalsePositiveInRow: number = 0
    private successMessages: number = 0
    private checkedChatIds: string[] = []
    private accountFirstName: string

    public constructor(
        private readonly contactHistoryService: ContactHistoryService,
        private readonly contactMessageService: ContactMessageService,
        private readonly contactQueueService: ContactQueueService,
        private readonly tokenService: TokensService,
        private readonly telegramService: TelegramService,
        private readonly proxyService: ProxyService,
        telegramAccount: TelegramAccount,
        private readonly mailerService: MailerService,
        private readonly environment: Environment,
        private readonly logger: Logger
    ) {
        this.telegramAccount = telegramAccount
    }

    private isRunWorker(delayDays: number, lastRunDate: Date): boolean {
        const dateDelay = moment().utc().subtract(delayDays, 'days')
        const dateLastRun = moment(lastRunDate)

        return !dateLastRun.isValid() || dateLastRun.isBefore(dateDelay)
    }

    public async initialize(): Promise<void> {
        this.runResponeseWorker = this.isRunWorker(
            this.responsesWorkerDelay,
            this.telegramAccount.lastResponsesFetchDate
        )

        this.runOldGroupsLeaver = this.isRunWorker(
            this.groupsLeaverWorkerDelay,
            this.telegramAccount.lastGroupsLeavingDate
        )

        const limitHitDate = moment(this.telegramAccount.limitHitResetDate)
        const currentDate = moment().utc()

        if (limitHitDate.isAfter(currentDate)) {
            const diffMs = limitHitDate.diff(currentDate, 'milliseconds')
            const msInDay = 86400000
            this.log(
                `${diffMs / msInDay} days to contact from this account again, Limit hit reset: ${limitHitDate.format()}`
            )
        } else {
            this.runContactingWorker = true
        }

        if (!this.runContactingWorker && !this.runResponeseWorker) {
            this.log(`Skipping account, Contacting and Responses workers `)
            return
        }

        if (!this.isAccountLastLoginBeforeLimit()) {
            this.logger.warn(`Account can't try to login, last login date: ${this.telegramAccount.lastLogin}`)
            return
        }

        const isDriverCreated = await this.createDriverWithProxy()

        if (!isDriverCreated) {
            this.logger.warn(`Couldn't initialize driver with proxy`)
            return
        }

        const isLoggedIn = await this.login()

        if (isLoggedIn) {
            await this.updateSentMessages()
            await this.getAccountMessages()
            this.accountFirstName = await this.driver.executeScript(await this.getScript('GetAccountFirstName'))

            this.isInitialized = true
            this.log(`
                Logged in | 24h Sent messages: ${this.sentMessages} | Account Messages: ${this.accountMessages.length} | Proxy: ${this.telegramAccount.proxy.proxy}`
            )
        }
    }

    private async createDriverWithProxy(): Promise<boolean> {
        if (!this.telegramAccount.proxy || this.telegramAccount.proxy.isDisabled) {
            this.log(`Proxy is invalid or disabled, Getting new one`)
            if (!await this.getNewProxy()) {
                await this.mailerService.sendFailedWorkerEmail(`[TelegramWorker] Can't create proxy for telegram id:` +
                    ` ${this.telegramAccount.id}. No proxy stock available.`)

                this.logger.warn(`No proxy stock available`)

                return false
            }
        }

        this.log(`Creating driver instance`)
        this.driver = await SeleniumService.createDriver('', this.telegramAccount.proxy, this.logger)
        this.log(`Testing if proxy working`)

        if (await SeleniumService.isInternetWorking(this.driver)) {
            return true
        } else {
            this.logger.warn(`Proxy ${this.telegramAccount.proxy.proxy} doesn't work, disabling the proxy and will retry with new one`)
            await this.destroyDriver()
            await this.proxyService.setProxyDisabled(this.telegramAccount.proxy)

            const retry = await this.createDriverWithProxy()
            return retry
        }
    }

    private async getNewProxy(): Promise<boolean> {
        const newProxy = await this.telegramService.assignNewProxyForAccount(this.telegramAccount)
        if (!newProxy) {
            this.log(`No proxy stock available, Failed to initialize`)
            return false
        }
        this.telegramAccount.proxy = newProxy
        return true
    }

    private async getAccountMessages(): Promise<void> {
        this.accountMessages = await this.contactMessageService.getAccountMessages(true, this.telegramAccount.id)
    }

    private async updateSentMessages(): Promise<void> {
        const amounts = await this.contactHistoryService
            .getAmountOfTelegramSentMessagesPerAccount(this.telegramAccount.id)

        this.sentMessages = +amounts.dm + +amounts.group
    }

    private async isLoggedIn(): Promise<boolean> {
        const findSearchBar = await this.driver.findElements(By.id('telegram-search-input'))

        if (findSearchBar.length > 0) {
            return true
        } else {
            return false
        }
    }

    public async login(retries: number = 1): Promise<boolean> {
        try {
            this.log(`Logging in, Attempt #${retries}`)
            const driver = this.driver
            await driver.get('https://web.telegram.org/a/')
            await driver.sleep(10000)
            const localStorage = JSON.parse(this.telegramAccount.localStorageJson)
            Object.keys(localStorage).forEach(async function (key) {
                await driver.executeScript('localStorage.setItem(arguments[0], arguments[1])', key, localStorage[key])
            })

            await driver.sleep(10000)
            await driver.navigate().refresh()
            await driver.sleep(15000)

            if (await this.isLoggedIn()) {
                await this.saveLastLogin()
                return true
            } else {
                if (retries < 3) {
                    this.log(`Retrying to login, Attempt #${retries}`)
                    return await this.login(retries + 1)
                } else {
                    this.logger.warn(`Account is banned, Err: USER_DEACTIVATED_BAN`)
                    await this.disableAccount()
                    return false
                }
            }
        } catch (e) {
            this.log(`Error 6969 ${e}`)
            return false
        }
    }

    private isAccountLastLoginBeforeLimit(): boolean {
        const beforeLimitLogginIn = moment().subtract(this.limitLogginIn, 'minutes')
        return !(
            moment(this.telegramAccount.lastLogin).isValid() &&
            moment(this.telegramAccount.lastLogin).isAfter(beforeLimitLogginIn)
        )
    }

    private async saveLastLogin(): Promise<TelegramAccount | undefined> {
        return this.telegramService.assginLoginDateToAccount(this.telegramAccount.id, moment().toDate())
    }

    private isLimitHit(): boolean {
        return this.sentMessages >= this.maxMessagesPerDay
    }

    private async getScript(scriptFile: string): Promise<string> {
        const script = await fs.readFileSync(
            `src/core/worker/contact/telegram/scripts/${scriptFile}.js`, 'utf-8'
        )

        return script
    }

    private setNextMessageIndex(): void {
        if (this.messageToSendIndex < this.accountMessages.length - 1) {
            this.messageToSendIndex++
        } else {
            this.messageToSendIndex = 0
        }
    }

    private async sendDM(): Promise<ContactHistoryStatusType> {
        this.log(`Trying to send DM`)

        if (this.isLimitHit()) {
            return ContactHistoryStatusType.ACCOUNT_LIMIT_HIT
        }

        if (await this.isMessagesRestricted()) {
            this.log('Only accepts messages from premium user')
            return ContactHistoryStatusType.DM_PREMIUM_ONLY
        }

        if (await this.inputAndSendMessage()) {
            await this.driver.sleep(20000)
            const middleColumn = await this.getMiddleColumn()

            if (!middleColumn) {
                return ContactHistoryStatusType.ACCOUNT_NOT_EXISTS
            }

            if (await this.isTempBanned([ middleColumn ])) {
                return ContactHistoryStatusType.ACCOUNT_TEMP_BANNED
            }

            return ContactHistoryStatusType.SENT_DM
        } else {
            return ContactHistoryStatusType.ACCOUNT_NOT_EXISTS
        }
    }

    private getMessageTemplate(): string {
        return this.accountMessages[this.messageToSendIndex].content
    }

    private async inputAndSendMessage(message: string = ''): Promise<boolean> {
        try {
            this.log(
                `[Telegram Worker ${this.telegramAccount.id}] ` +
                `Checking if group messaging enabled`
            )

            const messageInput = await this.driver.findElement(By.id('editable-message-text'))
            const messageToSend = message.length ? message : this.getMessageTemplate()

            if (messageInput) {
                this.log('Found input box, sending message')

                await messageInput.sendKeys(messageToSend)
                await this.driver.sleep(20000)

                if (!this.isProd()) {
                    this.log('Environment is not production. Skipping sending message')
                }

                await messageInput.sendKeys(Key.RETURN)

                this.sentMessages++
                return true
            }

            return false
        } catch (error) {
            return false
        }
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

    private async joinAndVerifyGroup(retries: number = 1): Promise<void> {
        const joinBtn = await this.getBtnWithText('join group')

        if (joinBtn) {
            await this.driver.actions().click(joinBtn).perform()
            await this.driver.sleep(10000)

            if (await this.getBtnWithText('join group')) {
                const isUsersLimit = await this.isGroupMaxUsersLimit()

                if (isUsersLimit) {
                    return
                }

                this.log(`Group joining limit hit, Attempt ${retries}/2`)

                if (retries < 2) {
                    await this.driver.sleep(5000)
                    const retry = await this.joinAndVerifyGroup(retries + 1)
                    return retry
                }
                //set limit hit
                this.sentMessages = this.maxMessagesPerDay
            }

            await this.driver.sleep(10000)

            const scrollBtn = await this.driver.findElements(By.className('icon-arrow-down'))
            if (scrollBtn.length > 0) {
                await this.driver.actions().click(scrollBtn[0]).perform()
                await this.driver.sleep(2000)
            }

            const verifyStrs = [
                'you\'re human',
                'not robot',
                'unblock',
                'unlock ',
                'verify',
                'human',
                'unmute me',
                'a bot',
                'tap to verify',
            ]

            const pageSrc = await this.driver.getPageSource()

            for (let i = 0; i < verifyStrs.length; i++) {
                if (pageSrc.toLowerCase().includes(verifyStrs[i])) {
                    this.log(`Clicking on verify button`)
                    await this.driver.executeScript(await this.getScript('ClickVerifyBtns'))

                    await this.driver.sleep(10000)

                    break
                }
            }
        }
    }

    private async getMiddleColumn(): Promise<WebElement|undefined> {
        const middleColumnSelector = await this.driver.findElements(By.id('MiddleColumn'))

        if (middleColumnSelector.length) {
            return middleColumnSelector[0]
        }

        return undefined
    }

    private async isLoading(middleColumn: WebElement): Promise<boolean> {
        const loadingSpinner = await middleColumn.findElements(By.className('loading'))
        return loadingSpinner.length > 0
    }

    private async isLoaded(): Promise<boolean> {
        const middleColumn = await this.getMiddleColumn()

        if (!middleColumn) {
            return false
        }

        if (await this.isLoading(middleColumn)) {
            await this.driver.sleep(10000)

            if (await this.isLoading(middleColumn)) {
                return false
            }
        }

        return true
    }

    private async checkAnnouncementChannel(): Promise<ContactHistoryStatusType> {
        const groupJoinTexts = [ 'tap to verify', 'join group' ]

        for (const btnText of groupJoinTexts) {
            const foundBtn = await this.getBtnWithText(btnText)

            if (foundBtn) {
                return ContactHistoryStatusType.ANNOUNCEMENTS_POTENTIAL_GROUP
            }
        }

        return ContactHistoryStatusType.ANNOUNCEMENTS_NO_GROUP
    }

    private async leaveGroup(): Promise<void> {
        return this.driver.executeScript(await this.getScript('LeaveGroup'))
    }

    private async sendGroupMessage(tgLink: string, verified: boolean = false): Promise<ContactHistoryStatusType> {
        this.log(`Trying to send group message`)

        if (this.isLimitHit()) {
            return ContactHistoryStatusType.ACCOUNT_LIMIT_HIT
        }

        if (!verified) {
            this.log(`Joining ${tgLink}`)
            await this.joinAndVerifyGroup()

            const isUsersLimit = await this.isGroupMaxUsersLimit()

            if (isUsersLimit) {
                return ContactHistoryStatusType.GROUP_MAX_USERS_LIMIT
            }

            if (this.isLimitHit()) {
                this.log(`Account join limit hit, skipping account.`)
                return ContactHistoryStatusType.ACCOUNT_GROUP_JOIN_LIMIT_HIT
            }

            const pageSrc = await this.driver.getPageSource()

            if (pageSrc.toLowerCase().includes('complete the above captcha')) {
                await this.driver.executeScript(await this.getScript('SolveCaptcha'))
                await this.driver.sleep(60000)
                const goBackToChannel = await this.sendMessage(tgLink, true)
                return goBackToChannel
            }

            if (await this.isMessagesRestricted()) {
                this.log('Messages are restricted by admins')
                return ContactHistoryStatusType.MESSAGES_RESTRICTED_BY_ADMIN
            }
        }

        if (await this.inputAndSendMessage()) {
            await this.driver.sleep(20000)

            const ownMessages = await this.driver.findElements(By.className('own'))
            if (ownMessages.length > 0) {
                if (await this.isTempBanned(ownMessages)) {
                    return ContactHistoryStatusType.ACCOUNT_TEMP_BANNED
                }

                return ContactHistoryStatusType.SENT_GROUP
            } else {
                return ContactHistoryStatusType.SENT_GROUP_BUT_DELETED
            }
        } else {
            await this.leaveGroup()
            await this.driver.sleep(10000)

            return ContactHistoryStatusType.MESSAGES_NOT_ALLOWED
        }
    }

    private async isMessagesRestricted(): Promise<boolean> {
        try {
            const disabledMessagingSelector = await this.driver.findElements(By.css('.messaging-disabled-inner'))

            if (disabledMessagingSelector.length) {
                const reasonStr = await disabledMessagingSelector[0].getText()
                return 'the admins of this group have restricted your ability to send messages.' === reasonStr.toLowerCase() ||
                        reasonStr.toLowerCase().includes('only accepts messages from premium user')
            }

            return false
        } catch (e) {
            this.log(`Error 9584 ${e}`)
            return false
        }
    }

    public async sendMessage(telegramLink: string, verified: boolean = false): Promise<ContactHistoryStatusType> {
        try {
            const driver = this.driver

            const user = telegramLink.replace('http://', 'https://')
                .replace('https://t.me/https://t.me/', 'https://t.me/')
                .replace('t.me/@', 't.me/')
                .split('t.me/')[1]

            if (!user) {
                return ContactHistoryStatusType.ACCOUNT_NOT_EXISTS
            }

            await driver.get('https://web.telegram.org/z/#?tgaddr=' + encodeURIComponent(`tg://resolve?domain=${user}`))

            let sleepTimes = 0

            while (sleepTimes <= 40) {
                const pageSrc = await this.driver.getPageSource()

                if (pageSrc.includes('User does not exist')) {
                    return ContactHistoryStatusType.TELEGRAM_CACHE_BUG
                }

                await this.driver.sleep(500)

                sleepTimes++
            }

            if (!await this.isLoggedIn()) {
                return ContactHistoryStatusType.ACCOUNT_NOT_AUTHORIZED
            }

            const loaded = await this.isLoaded()

            if (!loaded) {
                return ContactHistoryStatusType.ERROR
            }

            const groupStatusSelector = await this.driver.findElements(By.className('group-status'))

            if (groupStatusSelector.length) {
                if ((await groupStatusSelector[0].getText()).includes('subscriber')) {
                    await this.driver.sleep(10000)
                    return this.checkAnnouncementChannel()
                }

                return await this.sendGroupMessage(telegramLink, verified)
            } else {
                const userStatusSelector = await this.driver.findElements(By.className('user-status'))

                if (userStatusSelector.length) {
                    if ((await userStatusSelector[0].getText()).includes('bot')) {
                        return ContactHistoryStatusType.BOT_USER
                    }

                    return await this.sendDM()
                } else {
                    try {
                        const chatInfoElement = await this.driver.findElement(By.className('ChatInfo'))
                        const fullNameElement = await chatInfoElement.findElement(By.className('fullName'))
                        const fullNameText = await fullNameElement.getText()

                        if (fullNameText.length) {
                            this.log(`Couldn't find user status but found only name ${fullNameText}, Trying to send message`)

                            return await this.sendDM()
                        }

                        return ContactHistoryStatusType.ACCOUNT_NOT_EXISTS
                    } catch (error) {
                        return ContactHistoryStatusType.ACCOUNT_NOT_EXISTS
                    }
                }
            }
        } catch (e) {
            this.log(`Error 3652 ${e}`)
            return ContactHistoryStatusType.ERROR
        }
    }

    private async disableAccount(): Promise<void> {
        this.telegramAccount.isDisabled = true
        await this.telegramService.setAccountAsDisabled(this.telegramAccount)
    }

    private async isTempBanned(ownMessages: WebElement[]): Promise<boolean> {
        for (const message of ownMessages) {
            const failedMessages = await message.findElements(By.className('icon-message-failed'))

            if (failedMessages.length > 0) {
                return true
            }
        }
        return false
    }

    private isSuccessResult(result: ContactHistoryStatusType): boolean {
        const isSuccess = (result === ContactHistoryStatusType.SENT_DM ||
            result === ContactHistoryStatusType.SENT_GROUP ||
            result === ContactHistoryStatusType.SENT_GROUP_BUT_DELETED)

        if (isSuccess) {
            this.successMessages++
            this.potentialFalsePositiveInRow = 0
            this.setNextMessageIndex()
        }

        return isSuccess
    }

    private async postSendingCheck(): Promise<void> {
        if (!this.telegramAccount.isDisabled) {
            await this.driver.sleep(this.messagesDelay * 1000)
            const contactMethod = await this.startWorker()
            return contactMethod
        }
    }

    public async destroyDriver(): Promise<void> {
        if (this.driver) {
            await this.driver.quit()
        }
    }

    public async startResponsesWorker(): Promise<void> {
        this.log(`Started getting responses`)
        this.checkedChatIds = []
        await this.getResponses()
        await this.telegramService.updateLastResponsesFetchDate(this.telegramAccount)
        this.runResponeseWorker = false
        this.log(`Finished getting responses`)
    }

    private async processOldGroups(chatList: WebElement, retries: number): Promise<void> {
        try {
            const groups = await chatList.findElements(By.className('group'))

            for (const groupChat of groups) {
                const isGroupBtnVisible = await groupChat.isDisplayed()

                if (!isGroupBtnVisible) {
                    return this.processOldGroups(chatList, retries)
                }

                let isCheckedChat = false

                try {
                    const chatLinkElement = await groupChat.findElement(By.css('a'))
                    const chatHref = await chatLinkElement.getAttribute('href')
                    const chatId = chatHref.split('#').pop()

                    if (chatId && !this.checkedChatIds.includes(chatId)) {
                        this.checkedChatIds.push(chatId)
                    } else {
                        isCheckedChat = true
                    }
                } catch (err) {
                    if (err instanceof Error) {
                        this.log(`Couldn't get chat ID, error: ${err.message}`)
                    }
                }

                if (!isCheckedChat) {
                    this.log(`Found a group to check`)

                    await this.driver.actions().click(groupChat).perform()
                    await this.driver.sleep(10000)

                    const middleColumn = await this.getMiddleColumn()

                    if (!middleColumn) {
                        return
                    }

                    const chatLink = await this.getExtraChatInfo(middleColumn, ChatType.GROUP)
                    const oldGroupMinimumDate = moment().utc().subtract(this.oldGroupMinimumAge, 'days')

                    const lastContactAttempt = await this.contactHistoryService.findLastContactAttempt(
                        chatLink,
                        this.telegramAccount.id
                    )

                    this.log(`Group: ${chatLink} | Last contact attempt date: ${lastContactAttempt?.createdAt}`)
                    const lastContactDate = moment(lastContactAttempt?.createdAt)

                    if (
                        !lastContactAttempt ||
                        !lastContactDate.isValid() ||
                        lastContactDate.isBefore(oldGroupMinimumDate)
                    ) {
                        this.log(`Leaving group ${chatLink}`)

                        await this.leaveGroup()
                        await this.driver.sleep(15000)
                    }
                }
            }
        } catch (e) {
            this.log(`Error 6582 ${e}`)

            if (retries <= 20) {
                return this.processOldGroups(chatList, ++retries)
            }
        }
    }

    private async startOldChannelsLeavingWorker(): Promise<void> {
        this.log(`Started leaving old channels`)
        const chatList = await this.getChatsList()

        if (!chatList) {
            this.log(`Chat list not found`)
            return
        }

        let lastScrollHeight = 0
        let curentRetries = 0
        let isFirstOffset = true

        // eslint-disable-next-line no-constant-condition
        while (true) {
            lastScrollHeight = +(await chatList.getAttribute('scrollHeight'))

            if (!isFirstOffset) {
                this.log(`Scrolling`)
                await this.driver.executeScript(`arguments[0].scrollTo(0, arguments[0].scrollHeight)`, chatList)
                await this.driver.sleep(5000)
            }

            isFirstOffset = false

            await this.processOldGroups(chatList, 0)

            await this.driver.sleep(2000)

            const currentScrollHeight = +(await chatList.getAttribute('scrollHeight'))

            if (currentScrollHeight === lastScrollHeight) {
                if (curentRetries >= 5) {
                    break
                } else {
                    curentRetries++
                    continue
                }
            }

            curentRetries = 0
            await this.driver.sleep(1000)
        }

        await this.telegramService.updateLastGroupsLeaverRunDate(this.telegramAccount)
        this.log(`Finished`)
    }

    private async loadMainPage(): Promise<void> {
        this.log(`Navigating to telegram web main page`)
        await this.driver.get('https://web.telegram.org/a/')
        await this.driver.sleep(20000)
    }

    public async startWorker(): Promise<void> {
        await this.driver.sleep(getRandomNumber(1, 10) * 1000)

        if (this.runResponeseWorker) {
            await this.startResponsesWorker()
            await this.loadMainPage()
        }

        if (this.runOldGroupsLeaver) {
            await this.startOldChannelsLeavingWorker()
            await this.loadMainPage()
        }

        if (!this.runContactingWorker) {
            this.log(`The contact worker limit has been exceeded, Skipping account.`)
            return
        }

        const queuedContact = await this.contactQueueService.getFirstFromQueue(ContactMethod.TELEGRAM, this.logger)

        if (queuedContact) {
            const token = await this.tokenService.findByAddress(queuedContact.address)

            if (!token) {
                await this.contactQueueService.removeFromQueue(queuedContact.address, queuedContact.blockchain)

                this.log(
                    `No token for ${queuedContact.address} :: ${queuedContact.blockchain} . Skipping`
                )

                return this.startWorker()
            }

            const isValidQueuedContact = await this.contactQueueService.preContactCheckAndCorrect(
                queuedContact,
                token,
                this.logger)

            if (!isValidQueuedContact) {
                return this.startWorker()
            }

            this.log(
                `Contacting token ${queuedContact.address} :: ${queuedContact.blockchain} (${queuedContact.channel})`
            )

            let result = await this.sendMessage(queuedContact.channel, false)

            switch (result) {
                case ContactHistoryStatusType.ACCOUNT_NOT_AUTHORIZED:
                    await this.contactQueueService.setProcessing(queuedContact, false)

                    await this.login()
                    await this.driver.sleep(30000)
                    if (!await this.isLoggedIn()) {
                        result = ContactHistoryStatusType.ACCOUNT_PERM_BANNED
                        this.log(
                            `i got banned forever, Bye  :'(`
                        )
                        return
                    } else {
                        return this.startWorker()
                    }
                case ContactHistoryStatusType.ACCOUNT_GROUP_JOIN_LIMIT_HIT:
                    await this.contactQueueService.setProcessing(queuedContact, false)

                    return
                case ContactHistoryStatusType.ACCOUNT_LIMIT_HIT:
                    await this.contactQueueService.setProcessing(queuedContact, false)
                    this.log(
                        `Account hit limit`
                    )
                    await this.telegramService.setAccountLimitHitDate(this.telegramAccount, moment().utc().add(2, 'day').toDate())
                    return
                case ContactHistoryStatusType.ACCOUNT_TEMP_BANNED:
                    await this.contactQueueService.setProcessing(queuedContact, false)

                    this.log(
                        `Account temporarily banned`
                    )
                    await this.telegramService.setAccountLimitHitDate(this.telegramAccount, moment().utc().add(5, 'day').toDate())
                    return
                case ContactHistoryStatusType.ERROR:
                case ContactHistoryStatusType.ACCOUNT_NOT_EXISTS:
                    this.potentialFalsePositiveInRow++
                    // eslint-disable-next-line no-case-declarations
                    const checkTelegramChannel = await this.contactQueueService.checkTelegramChannel(
                        queuedContact.channel,
                        this.logger
                    )

                    if (this.potentialFalsePositiveInRow >= 2 ||
                        TelegramChannelCheckResultType.ACTIVE === checkTelegramChannel
                    ) {
                        await this.contactQueueService.setProcessing(queuedContact, false)

                        this.log(`Account not loading channels properly, Skipping`)
                        return
                    }
            }

            if (ContactHistoryStatusType.ERROR == result) {
                await this.driver.get('https://web.telegram.org/a/')
                await this.driver.sleep(10000)

                this.log(
                    `Skipping to send to token ${queuedContact.address} | Result: ${result} | Attempt ${this.potentialFalsePositiveInRow}/5`
                )

                return this.startWorker()
            }

            const isSuccess = this.isSuccessResult(result)

            await this.contactQueueService.removeFromQueue(queuedContact.address, queuedContact.blockchain)

            this.log(
                `Finished attempt to send to token ${queuedContact.address} @ ${queuedContact.channel} | Result: ${result}`
            )

            await this.contactHistoryService.addRecord(
                queuedContact.address,
                queuedContact.blockchain,
                ContactMethod.TELEGRAM,
                isSuccess,
                this.accountMessages[this.messageToSendIndex].id,
                queuedContact.channel,
                result,
                this.telegramAccount.id,
            )


            await this.tokenService.postContactingActions(token, ContactMethod.TELEGRAM, isSuccess)

            if (this.maxMessagesPerCycle <= this.successMessages) {
                this.log(`Reached cycle limit hit, Skipping`)

                this.telegramService.setAccountLimitHitDate(
                    this.telegramAccount,
                    moment().utc().add(5, 'minutes').toDate())

                return
            }
        }
        await this.postSendingCheck()
    }

    private log(message: string): void {
        this.logger.info(
            `[Telegram Worker ${this.telegramAccount.id}] ` +
            message
        )
    }

    private async getExtraChatInfo(middleColumn: WebElement, chatType: ChatType): Promise<string> {
        try {
            const infoStr = (ChatType.DM === chatType) ? '\nUsername' : '\nLink'
            const rightColumn = await this.driver.findElement(By.id('RightColumn'))
            let profileDivs = await rightColumn.findElements(By.className('profile-info'))

            if (!profileDivs.length) {
                const chatTitle = await middleColumn.findElements(By.className('info'))
                if (chatTitle.length) {
                    await this.driver.actions().click(chatTitle[0]).perform()
                    await this.driver.sleep(3000)
                    profileDivs = await rightColumn.findElements(By.className('profile-info'))
                }
            }

            const chatLinksDivs = await profileDivs[0].findElements(By.className('ListItem-button'))


            for (const info of chatLinksDivs) {
                const innerHtml = await info.getAttribute('innerHTML')
                const innerText = await info.getText()

                if (innerHtml.includes('icon-link') || innerHtml.includes('icon-mention')) {
                    return innerText.replace(infoStr, '')
                }
            }

            return ''
        } catch (e) {
            this.log(`Error while getting extra cha info \n${(e as Error).message}`)
            return ''
        }
    }

    // eslint-disable-next-line complexity
    private async getChatMessages(middleColumn: WebElement, chatType: ChatType): Promise<{
        sender: string;
        message: string;
    }[]> {
        const chatMessagesObj: {
            sender: string;
            message: string;
        }[] = []

        if (middleColumn) {
            if (ChatType.DM === chatType) {
                const chatMessages = await middleColumn.findElements(By.className('message-list-item '))

                let sentMessagesCount = 0

                for (const message of chatMessages) {
                    const messageClass = await message.getAttribute('class')

                    if (messageClass.includes('ActionMessage')) {
                        continue
                    }

                    const isOwnMessage = messageClass.includes(' own')

                    if (isOwnMessage) {
                        sentMessagesCount++
                    }

                    const messageContentTxt = await message.getText()

                    if (messageContentTxt.toLowerCase().includes('do not give this code to anyone, even if they say they are from telegram')) {
                        return []
                    }

                    const messageObj = {
                        'sender': isOwnMessage ? 'Me' : 'Other party',
                        'message': messageContentTxt,
                    }

                    chatMessagesObj.push(messageObj)
                }

                if (chatMessagesObj.length && 'Other party' === chatMessagesObj[0].sender) {
                    this.log(`DM discussion not started by us, Previous auto-response sent messages: ${sentMessagesCount}, Checking if there messages to send.`)
                    const messageToSend = await this.telegramService.getAutoResponderMessage(++sentMessagesCount)

                    if (messageToSend) {
                        this.log(`Found a message, Sending auto-response`)
                        const messageSendResult = await this.inputAndSendMessage(messageToSend.message)
                        this.log(`Finished message sending attempt | Result: ${messageSendResult}`)

                        if (messageSendResult) {
                            const messageObj = {
                                'sender': 'Me',
                                'message': messageToSend.message,
                            }

                            chatMessagesObj.push(messageObj)
                        }
                    }
                }
            } else {
                let hasMoreMentions = true
                let mentionClickCounts:number = 0

                while (hasMoreMentions && mentionClickCounts < 10) {
                    const mentionBtns = await middleColumn.findElements(By.className('icon-mention'))
                    if (mentionBtns.length) {
                        const mentionCount: string = await this.driver.executeScript('return arguments[0].parentElement.parentElement.innerText.trim()', mentionBtns[0])
                        if (mentionCount.length) {
                            await this.driver.actions().click(mentionBtns[0]).perform()
                            mentionClickCounts++
                            await this.driver.sleep(10000)
                        } else {
                            this.log(`No more mentions`)
                            hasMoreMentions = false
                        }
                    } else {
                        this.log(`Chat didn't load.`)
                        break
                    }

                    const chatMessages = await middleColumn.findElements(By.className('message-list-item'))
                    for (const message of chatMessages) {
                        const messageClass = await message.getAttribute('class')
                        const wholeMessageText = await message.getText()

                        if (messageClass.includes('ActionMessage')) {
                            continue
                        }

                        const isReplyMessage = wholeMessageText.includes(this.accountFirstName) && !messageClass.includes('own')
                        const sender = await message.findElements(By.className('message-title'))
                        const messageContent = await message.findElements(By.className('text-content'))

                        if (sender.length && messageContent.length) {
                            const senderTxt = await sender[0].getText()
                            const messageContentTxt = await messageContent[0].getText()
                            const messageObj = {
                                'sender': senderTxt,
                                'message': messageContentTxt,
                            }

                            const whitelistWordsRegex = /mintme|mint me/i

                            if (whitelistWordsRegex.test(messageContentTxt.toLowerCase()) ||
                            messageContentTxt.toLowerCase().includes(this.telegramAccount.userName) ||
                            isReplyMessage ||
                            messageClass.includes(' own')
                            ) {
                                chatMessagesObj.push(messageObj)
                            }
                        }
                    }
                }
            }
        }
        return chatMessagesObj
    }

    private async processChatResponses(chatElement: WebElement, chatType: ChatType): Promise<void> {
        try {
            if (chatElement) {
                await this.driver.actions().click(chatElement).perform()

                await this.driver.sleep(10000)

                const middleColumn = await this.driver.findElement(By.id('MiddleColumn'))

                const chatMessagesObj = await this.getChatMessages(middleColumn, chatType)

                await this.driver.sleep(1000)

                const chatLink = await this.getExtraChatInfo(middleColumn, chatType)

                if (chatMessagesObj && chatMessagesObj.length) {
                    await this.telegramService.addNewResponse(
                        chatLink,
                        JSON.stringify(chatMessagesObj),
                        this.telegramAccount,
                        chatType)
                }
            }
        } catch (e) {
            this.log(`Error while processing chat ${e}`)
        }
    }

    private async findNotCheckedGroups(chatList: WebElement): Promise<void> {
        try {
            const mentionGroups = await chatList.findElements(By.className('group'))

            for (const groupChat of mentionGroups) {
                const isGroupBtnVisible = await groupChat.isDisplayed()
                if (!isGroupBtnVisible) {
                    return this.findNotCheckedGroups(chatList)
                }

                let isCheckedChat = false

                try {
                    const chatLinkElement = await groupChat.findElement(By.css('a'))
                    const chatHref = await chatLinkElement.getAttribute('href')
                    const chatId = chatHref.split('#').pop()

                    if (chatId && !this.checkedChatIds.includes(chatId)) {
                        this.checkedChatIds.push(chatId)
                    } else {
                        isCheckedChat = true
                    }
                } catch (err) {
                    if (err instanceof Error) {
                        this.log(`Couldn't get chat ID, error: ${err.message}`)
                    }
                }

                const hasUnreadMentions = (await (groupChat.findElements(By.className('icon-mention')))).length > 0

                if (hasUnreadMentions && !isCheckedChat) {
                    this.log(`Found a group with mention`)
                    await this.processChatResponses(groupChat, ChatType.GROUP)
                }
            }
        } catch (e) {
            this.log(`Error 9584 ${e}`)
            return this.findNotCheckedGroups(chatList)
        }
    }


    private async findNotCheckedDms(chatList: WebElement): Promise<void> {
        try {
            const dmChats = await chatList.findElements(By.className('private'))

            for (const dm of dmChats) {
                const isDmBtnVisible = await dm.isDisplayed()

                if (!isDmBtnVisible) {
                    return this.findNotCheckedDms(chatList)
                }

                const hasUnreadMessages = (await (dm.findElements(By.className('ChatBadge-transition')))).length > 0

                if (hasUnreadMessages) {
                    this.log(`Found a DM with unread messages`)
                    await this.processChatResponses(dm, ChatType.DM)
                }
            }
        } catch (e) {
            this.log(`Error 4851 ${e}`)
            return this.findNotCheckedDms(chatList)
        }
    }

    private async getChatsList(): Promise<WebElement|undefined> {
        try {
            const chatList = await this.driver.findElement(By.className('chat-list'))

            return chatList
        } catch (error) {
            return undefined
        }
    }

    private async getResponses(): Promise<void> {
        const chatList = await this.getChatsList()

        if (!chatList) {
            this.log(`Chat list not found`)
            return
        }

        let lastScrollHeight = 0
        let curentRetries = 0
        let isStartOfChat = true

        // eslint-disable-next-line no-constant-condition
        while (true) {
            lastScrollHeight = +(await chatList.getAttribute('scrollHeight'))

            if (!isStartOfChat) {
                this.log(`Scrolling`)

                await this.driver.executeScript(`arguments[0].scrollTo(0, arguments[0].scrollHeight)`, chatList)
                await this.driver.sleep(5000)
            }

            isStartOfChat = false

            await this.findNotCheckedGroups(chatList)

            await this.driver.sleep(2000)

            await this.findNotCheckedDms(chatList)

            const currentScrollHeight = +(await chatList.getAttribute('scrollHeight'))

            if (currentScrollHeight === lastScrollHeight) {
                if (curentRetries >= 3) {
                    return
                } else {
                    curentRetries++
                    continue
                }
            }

            curentRetries = 0
            await this.driver.sleep(1000)
        }
    }

    private async isGroupMaxUsersLimit(): Promise<boolean> {
        const pageSrc = await this.driver.getPageSource()

        return pageSrc.toLowerCase().includes('the maximum number of users has been exceeded')
    }

    private isProd(): boolean {
        return Environment.PRODUCTION === this.environment
    }
}
