import { singleton } from 'tsyringe'
import { AbstractTokenFetcherService } from './AbstractTokenFetcherService'
import { By, Key, WebDriver, WebElement, until } from 'selenium-webdriver'
import { sleep } from '../../../utils'

@singleton()
export class BSCScanService extends AbstractTokenFetcherService {
    public getAccountsPageUrl(explorerDomain: string, page: number): string {
        return `https://${explorerDomain}/accounts/${page}?ps=100`
    }

    public getTokensPageUrl(explorerDomain: string, page: number): string {
        return `https://${explorerDomain}/tokens?ps=100&p=${page}`
    }

    public getTokenTxsPageUrl(explorerDomain: string, page: number): string {
        return `https://${explorerDomain}/tokentxns?ps=100&p=${page}`
    }

    public async setSolExplorerPageSize(driver: WebDriver, pageSizeSelector: string|WebElement): Promise<boolean> {
        try {
            let selector

            if ('string' === typeof pageSizeSelector) {
                selector = await driver.wait(until.elementLocated(By.id(pageSizeSelector)), 5000)
            } else {
                selector = pageSizeSelector
            }

            await driver.executeScript(`arguments[0].scrollTo(0, arguments[0].scrollHeight)`, selector)

            await sleep(5000)
            await selector.sendKeys(Key.ARROW_UP)
            await sleep(500)
            await selector.sendKeys(Key.ARROW_UP)
            await sleep(500)
            await selector.sendKeys(Key.RETURN)

            return true
        } catch (error) {
            return false
        }
    }
}
