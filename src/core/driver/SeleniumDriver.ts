
import { singleton } from "tsyringe"
import { Builder, ThenableWebDriver } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome";

@singleton()
export class SeleniumDriver {
    driver: ThenableWebDriver;

    public constructor(profile: string = '', headless: boolean = false) {

        let options = new Options()
            .windowSize({ width: 1920, height: 1080 })
            .addArguments('--no-sandbox')
            .addArguments('--disable-blink-features=AutomationControlled')
            .addArguments('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36        ');

        if (headless) {
            options.addArguments('--headless');
        }

        if (profile && profile !== '') {
            options.addArguments(`--user-data-dir=${profile}`);
        }

        this.driver = new Builder().forBrowser('chrome').setChromeOptions(options).build();
        this.clearCookies();
    }

    public async clearCookies() {
        await this.driver.manage().deleteAllCookies();
    }
    public getDriver(): ThenableWebDriver {
        return this.driver;
    }

    public async setLocalStorage(key: string, value: string) {
        await this.driver.executeScript("localStorage.setItem(arguments[0], arguments[1])", key, value);
    }

}