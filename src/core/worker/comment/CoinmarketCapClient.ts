import { Logger } from 'winston'
import { WebDriver } from 'selenium-webdriver'
import { CoinMarketCapAccount } from '../../entity'
import {
    CMCService,
    SeleniumService,
} from '../../service'
import { destroyDriver } from '../../../utils'

export class CoinMarketCapClient {
    private readonly cmcAccount: CoinMarketCapAccount
    private driver: WebDriver
    private maxCommentsPerDay: number = 30
    private submittedCommentsPerDay: number = 0

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
            await this.driver.sleep(10000)

            const cookies: object = JSON.parse(this.cmcAccount.cookiesJSON)

            for (const [ key, value ] of Object.entries(cookies)) {
                await this.driver.executeScript(
                    'document.cookie = `${arguments[0]}=${arguments[1]};path=/`', key, value
                )
            }

            await this.driver.sleep(10000)
            await this.driver.navigate().refresh()
            await this.driver.sleep(30000)

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
        return
    }

    public async destroyDriver(): Promise<void> {
        await destroyDriver(this.driver)
    }
}
