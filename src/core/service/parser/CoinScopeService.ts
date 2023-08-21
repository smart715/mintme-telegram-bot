import axios from 'axios'
import { WebDriver } from 'selenium-webdriver'
import { singleton } from 'tsyringe'
import { Blockchain } from '../../../utils'

@singleton()
export class CoinScopeService {
    public async getReactBuildFolderName(driver: WebDriver): Promise<string> {
        await driver.get('https://www.coinscope.co/')

        return driver.executeScript(`
            const scripts = document.getElementsByTagName('script')
            let buildFolder = ''
            for (let i = 0; i < scripts.length; i++) {
                if (!scripts[i].src.includes('_buildManifest')) {
                    continue
                }

                buildFolder = scripts[i].src.split('/')[scripts[i].src.split('/').length - 2]
                break
            }
            return buildFolder
        `)
    }

    public async getTokensData(buildFolder: string, page: number, blockchain: Blockchain): Promise<any> {
        const response = await axios.get(`https://www.coinscope.co/_next/data/${buildFolder}/alltime.json`, {
            params: {
                network: blockchain.toString(),
                page,
            },
        })

        return response.data
    }

    public async scrapeTokenData(tokenId: string, driver: WebDriver): Promise<any> {
        await driver.get(`https://www.coinscope.co/coin/${tokenId.toLowerCase()}`)
        await new Promise(r => setTimeout(r, 2000))

        return driver.executeScript(`
            const tokenAddress = document
                .querySelector('.StyledBox-sc-13pk1d4-0.fSCGoT .StyledText-sc-1sadyjn-0.kvWNBW')?.innerText
            const tokenName = document.title.split('| ')[1]
            const links = document.getElementsByClassName('StyledBox-sc-13pk1d4-0 gxWSzQ')[0]?.getElementsByTagName('a') || []
            let website = ''
            let otherLinks = []

            for (let i = 0; i < links.length; i++) {
                if (links[i].attributes['title'].value == 'Website link') {
                    website = links[i].href
                }

                otherLinks.push(links[i].href)
            }

            return {
                tokenAddress,
                tokenName,
                website,
                links: otherLinks,
            }
        `)
    }
}
