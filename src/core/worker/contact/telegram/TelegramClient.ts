import config from 'config'
import { ContactMessage, QueuedContact, TelegramAccount, Token } from '../../../entity'
import {
    ContactHistoryService,
    SeleniumService,
    TokensService,
    ContactMessageService,
    ContactQueueService,
    TelegramService,
} from '../../../service'
import { By, Key, WebDriver } from 'selenium-webdriver'
import * as fs from 'fs'
import { logger } from '../../../../utils'
import { ContactHistoryStatusType, ContactMethod, TokenContactStatusType } from '../../../types'
import moment from 'moment'
import { log } from 'loglevel'

export class TelegramClient {
    private readonly maxMessagesPerDay: number = config.get('telegram_account_max_day_messages')
    private readonly messagesDelay: number = config.get('telegram_messages_delay_in_seconds')
    private sentMessages: number
    public telegramAccount: TelegramAccount
    private driver: WebDriver
    public accountMessages: ContactMessage[]
    private messageToSendIndex: number = 0
    public isInitialized: boolean = false

    public constructor(
        private readonly contactHistoryService: ContactHistoryService,
        private readonly contactMessageService: ContactMessageService,
        private readonly contactQueueService: ContactQueueService,
        private readonly tokenService: TokensService,
        private readonly telegramService: TelegramService,
        telegramAccount: TelegramAccount
    ) {
        this.telegramAccount = telegramAccount
    }

    public async initialize(): Promise<void> {
        const currentDate = moment()
        const limitHitDate = moment(this.telegramAccount.limitHitResetDate)

        if (limitHitDate.isAfter(currentDate)) {
            const diffMs = limitHitDate.diff(currentDate, 'milliseconds')
            const msInDay = 86400000
            this.log(
                `Waiting ${diffMs / msInDay} days to initialize, Last limit hit: ${limitHitDate.format()}`
            )
            setTimeout(async () => {
                await this.initialize()
                await this.startContacting()
            }, diffMs)
            return
        }

        this.driver = await SeleniumService.createDriver()
        const isLoggedIn = await this.login()
        if (isLoggedIn) {
            await this.updateSentMessages()
            await this.getAccountMessages()
            this.isInitialized = true
            this.log(`
                Logged in | 24h Sent messages: ${this.sentMessages} | Account Messages: ${this.accountMessages.length}`)
        }
    }


    private async getAccountMessages(): Promise<void> {
        this.accountMessages = await this.contactMessageService.getAccountMessages(true, this.telegramAccount.id)
    }

    private async updateSentMessages(): Promise<void> {
        const amounts = await this.contactHistoryService.getAmountOfSentMessagesPerAccount(this.telegramAccount.id)

        this.sentMessages = amounts.dm + amounts.group
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
            const driver = this.driver
            await driver.get('https://web.telegram.org/a/')
            await driver.sleep(10000)
            const localStorage = JSON.parse(this.telegramAccount.localStorageJson)
            Object.keys(localStorage).forEach(async function (key) {
                await driver.executeScript('localStorage.setItem(arguments[0], arguments[1])', key, localStorage[key])
            })
            await driver.sleep(10000)
            await driver.navigate().refresh()
            await driver.sleep(30000)
            if (await this.isLoggedIn()) {
                return true
            } else {
                if (retries < 3) {
                    logger.info(`Retrying to login, Attempt #${retries}`)
                    return await this.login(retries + 1)
                } else {
                    logger.warn(`Account is banned, Err: USER_DEACTIVATED_BAN`)
                    await this.disableAccount()
                    return false
                }
            }
        } catch (e) {
            logger.error(e)
            return false
        }
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
        if (this.isLimitHit()) {
            return ContactHistoryStatusType.ACCOUNT_LIMIT_HIT
        }

        if (await this.inputAndSendMessage()) {
            await this.driver.sleep(20000)
            if (await this.isTempBanned()) {
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

    private async inputAndSendMessage(): Promise<boolean> {
        try {
            this.log(
                `[Telegram Worker ${this.telegramAccount.id}] ` +
                `Checking if group messaging enabled`
            )

            const messageInput = await this.driver.findElement(By.id('editable-message-text'))

            if (messageInput) {
                await messageInput.sendKeys(this.getMessageTemplate())
                await this.driver.sleep(5000)
                await messageInput.sendKeys(Key.RETURN)
                this.sentMessages++
                return true
            }
            return false
        } catch (error) {
            return false
        }
    }

    private async joinAndVerifyGroup(): Promise<void> {
        await this.driver.executeScript(await this.getScript('JoinGroup'))
        await this.driver.sleep(15000)

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

                await this.driver.sleep(15000)

                break
            }
        }
    }

    private async sendGroupMessage(tgLink: string, verified: boolean = false): Promise<ContactHistoryStatusType> {
        if (this.isLimitHit()) {
            return ContactHistoryStatusType.ACCOUNT_LIMIT_HIT
        }
        if (!verified) {
            this.log(`Joining ${tgLink}`)
            await this.joinAndVerifyGroup()

            const pageSrc = await this.driver.getPageSource()

            if (pageSrc.toLowerCase().includes('complete the above captcha')) {
                await this.driver.executeScript(await this.getScript('SolveCaptcha'))
                await this.driver.sleep(60000)
                const goBackToChannel = await this.sendMessage(tgLink, true)
                return goBackToChannel
            }
        }

        if (await this.inputAndSendMessage()) {
            await this.driver.sleep(20000)

            const ownMessages = await this.driver.findElements(By.className('own'))
            if (ownMessages.length > 0) {
                if (await this.isTempBanned()) {
                    return ContactHistoryStatusType.ACCOUNT_TEMP_BANNED
                }
                return ContactHistoryStatusType.SENT_GROUP
            } else {
                return ContactHistoryStatusType.SENT_GROUP_BUT_DELETED
            }
        } else {
            await this.driver.executeScript(await this.getScript('LeaveGroup'))
            await this.driver.sleep(10000)
            return ContactHistoryStatusType.MESSAGES_NOT_ALLOWED
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

            if (user.startsWith('+')) {
                return ContactHistoryStatusType.ANNOUNCEMENTS_CHANNEL
            }

            await driver.get('https://web.telegram.org/z/#?tgaddr=' + encodeURIComponent(`tg://resolve?domain=${user}`))
            await driver.sleep(30000)

            if (!await this.isLoggedIn()) {
                return ContactHistoryStatusType.ACCOUNT_NOT_AUTHORIZED
            }

            const userStatusSelector = await this.driver.findElements(By.className('user-status'))

            if (userStatusSelector.length > 0) {
                return await this.sendDM()
            } else {
                const groupStatusSelector = await this.driver.findElements(By.className('group-status'))
                if (0 == groupStatusSelector.length) {
                    return ContactHistoryStatusType.ACCOUNT_NOT_EXISTS
                }

                if ((await groupStatusSelector[0].getText()).includes('subscriber')) {
                    return ContactHistoryStatusType.ANNOUNCEMENTS_CHANNEL
                }

                return await this.sendGroupMessage(telegramLink, verified)
            }
        } catch (e) {
            logger.error(e)
            return ContactHistoryStatusType.UNKNOWN
        }
    }

    private async disableAccount(): Promise<void> {
        this.telegramAccount.isDisabled = true
        await this.telegramService.setAccountAsDisabled(this.telegramAccount)
    }

    private async isTempBanned(): Promise<boolean> {
        const failedMessages = await this.driver.findElements(By.className('icon-message-failed'))
        if (failedMessages.length > 0) {
            return true
        }
        return false
    }

    private async checkQueuedContact(queuedContact: QueuedContact, token: Token): Promise<void> {
        if (queuedContact) {
            await this.driver.sleep(this.messagesDelay * 1000)

            if (token.contactStatus === TokenContactStatusType.RESPONDED) {
                await this.contactQueueService.removeFromQueue(queuedContact.address, queuedContact.blockchain)

                this.log(
                    `token ${queuedContact.address} :: ${queuedContact.blockchain} was marked as responded . Skipping`
                )

                return this.startContacting()
            }
        }
    }


    private isSuccessResult(result: ContactHistoryStatusType): boolean {
        const isSuccess = (result === ContactHistoryStatusType.SENT_DM ||
            result === ContactHistoryStatusType.SENT_GROUP ||
            result === ContactHistoryStatusType.SENT_GROUP_BUT_DELETED)

        if (isSuccess) {
            this.setNextMessageIndex()
        }
        return isSuccess
    }

    private async postSendingCheck(): Promise<void> {
        if (!this.telegramAccount.isDisabled) {
            const contactMethod = await this.startContacting()
            return contactMethod
        }
    }

    public async startContacting(): Promise<void> {
        const queuedContact = await this.contactQueueService.getFirstFromQueue(ContactMethod.TELEGRAM)

        if (queuedContact) {
            const token = await this.tokenService.findByAddress(queuedContact.address, queuedContact.blockchain)

            if (!token) {
                await this.contactQueueService.removeFromQueue(queuedContact.address, queuedContact.blockchain)

                log(
                    `No token for ${queuedContact.address} :: ${queuedContact.blockchain} . Skipping`
                )

                return this.startContacting()
            }

            await this.checkQueuedContact(queuedContact, token)

            this.log(
                `Contacting token ${queuedContact.address} :: ${queuedContact.blockchain}`
            )

            let result = await this.sendMessage(queuedContact.channel, false)


            switch (result) {
                case ContactHistoryStatusType.ACCOUNT_NOT_AUTHORIZED:
                    await this.login()
                    await this.driver.sleep(60000)
                    if (!await this.isLoggedIn()) {
                        result = ContactHistoryStatusType.ACCOUNT_PERM_BANNED
                        this.log(
                            `i got banned forever, Bye  :'(`
                        )
                        return
                    } else {
                        return this.startContacting()
                    }
                case ContactHistoryStatusType.ACCOUNT_LIMIT_HIT:
                    this.log(
                        `Account hit limit`
                    )
                    await this.telegramService.setAccountLimitHitDate(this.telegramAccount, moment().add(2, 'day').toDate())
                    return
                case ContactHistoryStatusType.ACCOUNT_TEMP_BANNED:
                    this.log(
                        `Account temporarily banned`
                    )
                    await this.telegramService.setAccountLimitHitDate(this.telegramAccount, moment().add(5, 'day').toDate())
                    return
            }

            const isSuccess = this.isSuccessResult(result)

            await this.contactQueueService.removeFromQueue(queuedContact.address, queuedContact.blockchain)

            this.log(
                `Finished attempt to send to token ${queuedContact.address} | Result: ${result}`
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

            token.lastContactMethod = ContactMethod.TELEGRAM
            token.telegramAttempts++
            token.lastContactAttempt = new Date()

            await this.tokenService.saveTokenContactInfo(token)
        }

        await this.driver.sleep(30000)
        await this.postSendingCheck()
    }

    private log(message: string): void {
        logger.info(
            `[Telegram Worker ${this.telegramAccount.id}] ` +
            message
        )
    }
}
