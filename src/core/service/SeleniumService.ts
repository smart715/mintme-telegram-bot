import { singleton } from 'tsyringe'
import { Builder, Capabilities, ThenableWebDriver } from 'selenium-webdriver'
// eslint-disable-next-line import/no-internal-modules
import { Options } from 'selenium-webdriver/chrome'

@singleton()
export class SeleniumService {
    public static async createDriver(profile: string = ''): Promise<ThenableWebDriver> {
        const options = new Options()
            .addArguments('--headless')
            .addArguments('--no-sandbox')
            .addArguments('--window-size=1920,1080')
            .addArguments('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36')

        if (profile) {
            options.addArguments(`--user-data-dir=${profile}`)
        }

        const chromeCapabilities = Capabilities.chrome()

        return new Builder()
            .forBrowser('chrome')
            .withCapabilities(chromeCapabilities)
            .setChromeOptions(options)
            .build()
    }
}
