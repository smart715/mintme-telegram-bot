import { singleton } from 'tsyringe'
import { Builder, Capabilities, ThenableWebDriver, WebDriver } from 'selenium-webdriver'
// eslint-disable-next-line import/no-internal-modules
import { Options } from 'selenium-webdriver/chrome'
import { ProxyServer } from '../entity'
import { logger } from '../../utils'

@singleton()
export class SeleniumService {
    public static async createDriver(profile: string = '', proxyServer: ProxyServer|undefined = undefined): Promise<ThenableWebDriver> {
        const options = new Options()
            .addArguments('--headless=new')
            .addArguments('--no-sandbox')
            .addArguments('--window-size=1920,1080')
            .addArguments('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36')

        if (profile) {
            options.addArguments(`--user-data-dir=${profile}`)
        }

        if (proxyServer) {
            options.addArguments(`--proxy-server=${proxyServer.proxy}`)
            options.addExtensions('src/core/driver/Extensions/Proxy-Auto-Auth.crx')
        }


        const chromeCapabilities = Capabilities.chrome()

        const driver = new Builder()
            .forBrowser('chrome')
            .withCapabilities(chromeCapabilities)
            .setChromeOptions(options)
            .build()

        if (proxyServer) {
            await driver.get(`chrome://extensions/`)

            const getExtensionIdScript = `
            let extensions = [...document.querySelector('body > extensions-manager').shadowRoot.querySelector('cr-view-manager > extensions-item-list').shadowRoot.querySelectorAll('extensions-item')].map(item => item.getAttribute('id'));
            if(extensions[0]){
              return extensions[0];
            } else { 
            return '';
            }`

            logger.info(`Getting exntesion ID`)

            const extensionID = await driver.executeScript(getExtensionIdScript)
            if (extensionID) {
                logger.info(`Exntesion ID: ${extensionID}`)

                await driver.get(`chrome-extension://${extensionID}/options.html`)
                await driver.sleep(2000)
                const authInfo = proxyServer.authInfo.split(':')
                await driver.executeScript(`localStorage["proxy_login"] = '${authInfo[0]}'`)
                await driver.executeScript(`localStorage["proxy_password"] = '${authInfo[1]}';`)
                await driver.sleep(2000)
            } else {
                throw new Error('Failed to load proxy auth extension')
            }
        }

        return driver
    }

    public static async isInternetWorking(driver: WebDriver): Promise<boolean> {
        await driver.get(`https://google.com`)

        const title = await driver.getTitle()
        if ('Google' !== title) {
            return false
        }
        return true
    }
}
