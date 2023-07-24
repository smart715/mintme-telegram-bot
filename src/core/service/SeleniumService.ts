import { singleton } from 'tsyringe'
import { Builder, ThenableWebDriver } from 'selenium-webdriver'
// eslint-disable-next-line import/no-internal-modules
import { Options } from 'selenium-webdriver/chrome'

@singleton()
export class SeleniumService {
    public static async createDriver(profile: string = '', headless: boolean = false): Promise<ThenableWebDriver> {
        const options = new Options()
            .windowSize({ width: 1920, height: 1080 })
            .addArguments('--no-sandbox')
            .addArguments('--disable-blink-features=AutomationControlled')
            .addArguments('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36')

        if (headless) {
            options.addArguments('--headless')
        }

        if (profile) {
            options.addArguments(`--user-data-dir=${profile}`)
        }

        return new Builder()
            .forBrowser('chrome')
            .usingServer('http://selenium-hub:4444')
            .setChromeOptions(options)
            .build()
    }
}
