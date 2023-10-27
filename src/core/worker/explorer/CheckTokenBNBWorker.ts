import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { By, WebDriver, WebElement } from 'selenium-webdriver'
import { QueuedTokenAddressService, SeleniumService, TokensService } from '../../service'
import { Blockchain, explorerDomains, sleep } from '../../../utils'
import { QueuedTokenAddress } from '../../entity'
import { singleton } from 'tsyringe'
import { Logger } from 'winston'

@singleton()
export class CheckTokenBNBWorker extends AbstractTokenWorker {
    private readonly workerName = CheckTokenBNBWorker.name
    private readonly tokensBatch = 100
    private readonly sleepTime = 60 * 1000
    private readonly tokenForbiddenWordsRegexp = /(pancake|binance-peg|wrapped|-lp|swaap governance|tracker)/i

    public constructor(
        private readonly queuedTokenAddressService: QueuedTokenAddressService,
        private readonly tokensService: TokensService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(blockchain: Blockchain|null = null): Promise<void> {
        const webDriver = await SeleniumService.createDriver('', undefined, this.logger)
        this.logger.info(`[${this.workerName}] started for ${blockchain ?? 'all'} blockchain`)

        // eslint-disable-next-line
        while (true) {
            const tokensToCheck = await this.queuedTokenAddressService.getTokensToCheck(blockchain, this.tokensBatch)
            if (!tokensToCheck.length) {
                this.logger.info(`[${this.workerName}] no tokens to check for ${blockchain} blockchain, sleep`)

                await sleep(this.sleepTime)
                continue
            }

            for (const token of tokensToCheck) {
                await this.checkToken(webDriver, token)
            }
        }
    }

    private async checkToken(webDriver: WebDriver, token: QueuedTokenAddress): Promise<void> {
        await webDriver.get('https://' + explorerDomains[token.blockchain] + '/token/' + token.tokenAddress)

        if (await this.checkLiquidityProvider(webDriver)) {
            await this.processNewTokens(webDriver, token.blockchain)

            return
        }

        await this.processTokenInfo(webDriver, token)
        await this.queuedTokenAddressService.markAsChecked(token)
    }

    private async checkLiquidityProvider(webDriver: WebDriver): Promise<boolean> {
        const pageSource = await webDriver.getPageSource()

        return pageSource.includes('Liquidity Provider')
    }

    private async processNewTokens(webDriver: WebDriver, blockchain: Blockchain): Promise<void> {
        const alert = (await webDriver.findElements(By.css('role="alert"')))[0]

        if (!alert) {
            return
        }

        const tokenAddresses: string[] = []
        const tokens = await alert.findElements(By.css('a'))

        for (const token of tokens) {
            const href = await token.getAttribute('href')
            if (href.includes('token/')) {
                const splitResult = href.split('/')

                tokenAddresses.push(splitResult[splitResult.length - 1])
            }
        }

        tokenAddresses.forEach(tokenAddress => {
            if (tokenAddress.startsWith('0x')) {
                this.queuedTokenAddressService.push(tokenAddress, blockchain)
            }
        })
    }

    private async processTokenInfo(
        webDriver: WebDriver,
        queuedToken: QueuedTokenAddress,
    ): Promise<void> {
        const tokenName = await this.getTokenName(webDriver, queuedToken.blockchain)

        if (!tokenName) {
            return
        }

        const website = await this.getWebSite(webDriver, queuedToken.blockchain)
        const emails = await this.getEmails(webDriver, queuedToken.blockchain)
        const links = await this.getLinks(webDriver, queuedToken.blockchain)

        const info = tokenName + website + emails.join('') + links.join('')

        if (this.tokenForbiddenWordsRegexp.test(info)) {
            return
        }

        this.logger.info(`Adding or Updating ${queuedToken.blockchain} token ${queuedToken.tokenAddress} :: ${tokenName}`)
        await this.saveNewToken(queuedToken.blockchain, queuedToken.tokenAddress, tokenName, website, emails, links)
    }

    private async saveNewToken(
        blockchain: Blockchain,
        tokenAddress: string,
        tokenName: string,
        website: string,
        emails: string[],
        links: string[],
    ): Promise<void> {
        if (website.includes('cronos.org')) {
            return
        }

        await this.tokensService.addOrUpdateToken(
            tokenAddress.toLowerCase(),
            tokenName,
            [ website ],
            emails,
            links,
            this.workerName,
            blockchain
        )
    }

    private getBlockchainExplorerTitle(blockchain: Blockchain): string {
        switch (blockchain) {
            case Blockchain.BSC:
                return 'BscScan'
            case Blockchain.ETH:
                return 'Etherscan'
            case Blockchain.CRO:
                return 'CronoScan'
        }
    }

    private async getTokenName(webDriver: WebDriver, blockchain: Blockchain): Promise<string> {
        const title = await webDriver.getTitle()
        const blockchainWord = this.getBlockchainExplorerTitle(blockchain)

        return title.startsWith('$')
            ? title
                .split('|')[1]
                .replace(' (', '(')
                .replace('Token Tracker', '')
                .trim()
                .toLowerCase()
            : title
                .replace(' (', '(')
                .replace(`Token Tracker | ${blockchainWord}`, '')
                .trim()
                .toLowerCase()
    }

    private async getWebSite(webDriver: WebDriver, blockchain: Blockchain): Promise<string> {
        if (Blockchain.ETH === blockchain || Blockchain.BSC === blockchain) {
            const linkDropdown = (await webDriver.findElements({ id: 'ContentPlaceHolder1_divLinks' }))[0]

            if (linkDropdown) {
                const dropdownItem = (await linkDropdown.findElements(By.className('dropdown-item text-truncate')))[0]
                const dropDownItemHref = await dropdownItem?.getAttribute('href') ?? ''

                return dropDownItemHref.toLowerCase() ?? ''
            }

            return ''
        }

        const placeHolder = await webDriver.findElement(By.id('ContentPlaceHolder1_tr_officialsite_1'))

        if (placeHolder) {
            return (await placeHolder.getText()).replace('Official Site:\n', '').toLowerCase()
        }

        return ''
    }

    private async getEmails(webDriver: WebDriver, blockchain: Blockchain): Promise<string[]> {
        const emails: string[] = []
        const rawLinks = await this.getRawLinks(webDriver, blockchain)

        for (const rawLink of rawLinks) {
            if (rawLink.includes('mailto:')) {
                emails.push(rawLink.replace('mailto:', ''))
            }
        }

        return emails
    }

    private async getLinks(webDriver: WebDriver, blockchain: Blockchain): Promise<string[]> {
        const links: string[] = []
        const rawLinks = await this.getRawLinks(webDriver, blockchain)

        for (const rawLink of rawLinks) {
            if (!rawLink.includes('mailto:')) {
                links.push(rawLink)
            }
        }

        return links
    }

    private async getRawLinks(webDriver: WebDriver, blockchain: Blockchain): Promise<string[]> {
        let linkElements: WebElement[]

        if (Blockchain.ETH === blockchain || Blockchain.BSC === blockchain) {
            const placeholder = (await webDriver.findElements(By.id('ContentPlaceHolder1_divLinks')))[0]
            linkElements = await placeholder?.findElements(By.css('a')) ?? []
        } else {
            linkElements = await webDriver.findElements(By.className('link-hover-secondary'))
        }

        const rawLinks: string[] = []
        for (const linkElement of linkElements) {
            rawLinks.push((await linkElement.getAttribute('href')).toLowerCase())
        }

        return rawLinks
    }
}
