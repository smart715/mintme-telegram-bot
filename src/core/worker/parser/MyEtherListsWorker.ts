import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { Blockchain } from '../../../utils'
import { MyEtherListsService, TokensService } from '../../service'
import { GitHubFile, GitHubRawTokenSocial } from '../../types'
import { AbstractParserWorker } from './AbstractParserWorker'

/**
 * @deprecated Not any more needed.
 */
@singleton()
export class MyEtherListsWorker extends AbstractParserWorker {
    private readonly workerName = 'MyEtherLists'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly supportedBlockchains: Blockchain[] = [ Blockchain.ETH, Blockchain.BSC ]

    public constructor(
        private readonly myEtherListsService: MyEtherListsService,
        private readonly tokensService: TokensService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        this.logger.info(`${this.prefixLog} Worker started`)

        for (const blockchain of this.supportedBlockchains) {
            await this.runByBlockchain(blockchain)
        }

        this.logger.info(`${this.prefixLog} Worker finished`)
    }

    public async runByBlockchain(currentBlockchain: Blockchain): Promise<void> {
        this.logger.info(`${this.prefixLog} checking ${currentBlockchain} blockchain`)

        let files: GitHubFile[]

        try {
            files = await this.myEtherListsService.getTokensList(currentBlockchain)
        } catch (ex: any) {
            this.logger.error(
                `${this.prefixLog} Aborting. Failed to fetch all files for given blockchain. Reason: ${ex.message}`
            )

            return
        }

        let i = 0

        for (const file of files) {
            ++i

            const rawToken = await this.myEtherListsService.getRawToken(file.download_url)
            const tokenName = rawToken.name + '(' + rawToken.symbol + ')'

            this.logger.info(`${this.prefixLog} Check ${tokenName} ${i}/${files.length}`)

            const tokenInDb = await this.tokensService.findByAddress(rawToken.address)

            if (tokenInDb) {
                continue
            }

            const tokenAddress = rawToken.address
            const website = rawToken.website
            const email = rawToken.support.email
            const links = this.getLinks(rawToken.social)

            if (0 === email.length && 0 === links.length) {
                continue
            }

            await this.tokensService.addOrUpdateToken(
                tokenAddress,
                tokenName,
                [ website ],
                [ email ],
                links,
                this.workerName,
                currentBlockchain,
                this.logger
            )

            this.logger.info(
                `${this.prefixLog} Added to DB:`,
                [
                    tokenAddress,
                    tokenName,
                    website,
                    links,
                    this.workerName,
                    currentBlockchain,
                ]
            )
        }
    }

    private getLinks(social: GitHubRawTokenSocial): string[] {
        const links = []

        for (const socialKey in social) {
            const prop: string = social[socialKey as keyof GitHubRawTokenSocial]

            if (prop) {
                links.push(prop)
            }
        }

        return links
    }
}
