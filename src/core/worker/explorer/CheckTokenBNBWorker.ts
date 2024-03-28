import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { By, WebDriver, WebElement } from 'selenium-webdriver'
import { FirewallService, QueuedTokenAddressService, SeleniumService, TokensService } from '../../service'
import { Blockchain, destroyDriver, explorerDomains, sleep } from '../../../utils'
import { QueuedTokenAddress } from '../../entity'
import { singleton } from 'tsyringe'
import { Logger } from 'winston'

@singleton()
export class CheckTokenBNBWorker extends AbstractTokenWorker {
    private readonly workerName = CheckTokenBNBWorker.name
    private readonly tokensBatch = 50
    private readonly sleepTime = 60 * 1000
    private readonly newStyleBlockchainExplorers = [ Blockchain.ETH, Blockchain.BSC, Blockchain.MATIC ]
    private webDriver: WebDriver

    private readonly supportedBlockchains = [
        Blockchain.ETH,
        Blockchain.BSC,
        Blockchain.CRO,
        Blockchain.MATIC,
        Blockchain.SOL,
    ]

    public constructor(
        private readonly queuedTokenAddressService: QueuedTokenAddressService,
        private readonly tokensService: TokensService,
        private readonly firewallService: FirewallService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(blockchain: Blockchain): Promise<void> {
        this.webDriver = await SeleniumService.createCloudFlareByPassedDriver(`https://${explorerDomains[blockchain]}/leaderboard`,
            this.firewallService,
            this.logger)
        await sleep(10000)


        this.logger.info(`[${this.workerName}] started for ${blockchain ?? this.supportedBlockchains.join('|')} blockchain`)

        // eslint-disable-next-line
        while (true) {
            const tokensToCheck = await this.queuedTokenAddressService.getTokensToCheck(
                blockchain ? [ blockchain ] : this.supportedBlockchains,
                this.tokensBatch
            )

            if (!tokensToCheck.length) {
                this.logger.info(`[${this.workerName}] no tokens to check for ${blockchain} blockchain, sleep`)

                await sleep(this.sleepTime)
                continue
            }

            this.logger.info(`Found ${tokensToCheck.length} Addresses to check`)

            try {
                for (const token of tokensToCheck) {
                    await this.checkToken(token)
                    await sleep(2000)
                }
            } catch (error) {
                await destroyDriver(this.webDriver)
                throw error
            }
        }
    }

    private async checkToken(token: QueuedTokenAddress): Promise<void> {
        this.logger.info(`Checking ${token.tokenAddress} :: ${token.blockchain}`)

        const params = (Blockchain.AVAX === token.blockchain) ? '?chainId=43114' : ''

        await this.loadPage('https://' + explorerDomains[token.blockchain] + '/token/' + token.tokenAddress + params)
        await sleep(10000)

        if (Blockchain.SOL === token.blockchain) {
            await this.processTokenSol(token)
        } else if (Blockchain.AVAX === token.blockchain) {
            await this.processTokenInfoAvax(token)
        } else {
            if (await this.checkLiquidityProvider()) {
                await this.processNewTokens(token.blockchain)

                return
            }
            await this.processTokenInfo(token)
        }

        await this.queuedTokenAddressService.markAsChecked(token)
    }

    private async checkLiquidityProvider(): Promise<boolean> {
        const pageSource = await this.webDriver.getPageSource()

        return pageSource.includes('Liquidity Provider')
    }

    private async processNewTokens(blockchain: Blockchain): Promise<void> {
        const alert = (await this.webDriver.findElements(By.css('[role="alert"]')))[0]

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
            if (Blockchain.SOL === blockchain || tokenAddress.startsWith('0x')) {
                this.queuedTokenAddressService.push(tokenAddress, blockchain)
            }
        })
    }

    private async processTokenInfo(
        queuedToken: QueuedTokenAddress,
    ): Promise<void> {
        const tokenName = await this.getTokenName(queuedToken.blockchain)

        if (!tokenName) {
            return
        }

        const website = await this.getWebSite(queuedToken.blockchain)

        const rawLinks = await this.getRawLinks(queuedToken.blockchain)
        const emails = await this.getEmails(rawLinks)
        const links = await this.getLinks(rawLinks)

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
            blockchain,
            this.logger
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
            case Blockchain.MATIC:
                return 'PolygonScan'
            case Blockchain.SOL:
                return 'Solscan'
            case Blockchain.AVAX:
                return 'Snowtrace'
            case Blockchain.ARB:
                return 'Arbiscan'
        }
    }

    private async getTokenName(blockchain: Blockchain): Promise<string> {
        const title = await this.webDriver.getTitle()
        const blockchainWord = this.getBlockchainExplorerTitle(blockchain)

        return title.startsWith('$')
            ? title
                .split('|')[1]
                .replace(' (', '(')
                .replace('Token Tracker', '')
                .trim()
            : title
                .replace(' (', '(')
                .replace(`Token Tracker | ${blockchainWord}`, '')
                .trim()
    }

    private async getWebSite(blockchain: Blockchain): Promise<string> {
        if (this.newStyleBlockchainExplorers.includes(blockchain)) {
            const linkDropdown = (await this.webDriver.findElements({ id: 'ContentPlaceHolder1_divLinks' }))[0]

            if (linkDropdown) {
                const dropdownItem = (await linkDropdown.findElements(By.className('dropdown-item text-truncate')))[0]
                const dropDownItemHref = await dropdownItem?.getAttribute('href') ?? ''

                return dropDownItemHref.toLowerCase() ?? ''
            }

            return ''
        }

        const placeHolderSelector = await this.webDriver.findElements(By.id('ContentPlaceHolder1_tr_officialsite_1'))

        if (placeHolderSelector.length) {
            return (await placeHolderSelector[0].getText()).replace('Official Site:\n', '').toLowerCase()
        }

        return ''
    }

    private async getEmails(rawLinks: string[]): Promise<string[]> {
        const emails: string[] = []

        for (const rawLink of rawLinks) {
            if (rawLink.includes('mailto:')) {
                emails.push(rawLink.replace('mailto:', ''))
            }
        }

        return emails
    }

    private async getLinks(rawLinks: string[]): Promise<string[]> {
        const links: string[] = []

        for (const rawLink of rawLinks) {
            if (!rawLink.includes('mailto:')) {
                links.push(rawLink)
            }
        }

        return links
    }

    private async getRawLinks(blockchain: Blockchain): Promise<string[]> {
        let linkElements: WebElement[]

        if (this.newStyleBlockchainExplorers.includes(blockchain)) {
            const placeholder = (await this.webDriver.findElements(By.id('ContentPlaceHolder1_divLinks')))[0]
            linkElements = await placeholder?.findElements(By.css('a')) ?? []
        } else if (Blockchain.AVAX === blockchain) {
            const placeholder = (await this.webDriver.findElements(By.className('popover-body')))[0]
            linkElements = await placeholder?.findElements(By.css('a')) ?? []
        } else {
            linkElements = await this.webDriver.findElements(By.className('link-hover-secondary'))
        }

        const rawLinks: string[] = []
        for (const linkElement of linkElements) {
            rawLinks.push((await linkElement.getAttribute('href')).toLowerCase())
        }

        return rawLinks
    }

    public async loadPage(url: string): Promise<void> {
        const { isNewDriver, newDriver } = await SeleniumService.loadPotentialCfPage(this.webDriver,
            url,
            this.firewallService,
            this.logger,
        )

        if (isNewDriver) {
            this.webDriver = newDriver
        }
    }

    private async processTokenSol(
        queuedToken: QueuedTokenAddress,
    ): Promise<void> {
        try {
            const pageTitle = await this.webDriver.getTitle()
            const tokenName = pageTitle.split('|')[0]
            const overReviewCard = await this.webDriver.findElement(By.className('box-overview'))
            const hrefLinks = await overReviewCard.findElements(By.css('a'))
            const links = []

            for (const href of hrefLinks) {
                const link = await href.getAttribute('href')

                if (link) {
                    links.push(link)
                }
            }

            const overReviewCardContent = await overReviewCard.getText()
            let website = ''

            if (overReviewCardContent.includes('Website')) {
                website = links[0]
                links.shift()
            }

            await this.saveNewToken(
                Blockchain.SOL,
                queuedToken.tokenAddress,
                tokenName,
                website,
                [],
                links
            )
        } catch (error) {
            this.logger.error(`Couldn't get token info of token ${queuedToken.blockchain}::${queuedToken.tokenAddress}, Error: ${error}`)
        }
    }

    private async processTokenInfoAvax(queuedToken: QueuedTokenAddress): Promise<void> {
        try {
            const webPageSrc = await this.webDriver.getPageSource()

            if (webPageSrc.includes('invalid Token hash has been entered')) {
                this.logger.warn('Incorrect token hash')
                return
            }

            const breadcrumb = this.webDriver.findElement(By.className('breadcrumb-up'))
            const tokenNameElement = await breadcrumb.findElement(By.className('ml-1'))
            const tokenName = await tokenNameElement.getText()

            const linksBtn = breadcrumb.findElement(By.css('button'))
            await linksBtn.click()

            await sleep(1000)

            const rawLinks = await this.getRawLinks(queuedToken.blockchain)
            const emails = await this.getEmails(rawLinks)
            const links = await this.getLinks(rawLinks)
            const website = links.length ? links[0] : ''

            this.logger.info(`Adding or Updating ${queuedToken.blockchain} token ${queuedToken.tokenAddress} :: ${tokenName}`)
            await this.saveNewToken(queuedToken.blockchain, queuedToken.tokenAddress, tokenName, website, emails, links)
        } catch (error) {
            this.logger.error(`Couldn't get token info of token ${queuedToken.blockchain}::${queuedToken.tokenAddress}, Error: ${error}`)
        }
    }
}
