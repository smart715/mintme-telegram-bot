import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, logger } from '../../../utils'
import { MyEtherListsService, TokensService } from '../../service'
import { GitHubFile, GitHubRawTokenSocial } from '../../../types'

@singleton()
export class MyEtherListsWorker extends AbstractTokenWorker {
    private readonly workerName = 'MyEtherLists'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly unsupportedBlockchains: Blockchain[] = [ Blockchain.CRO ]

    public constructor(
        private readonly myEtherListsService: MyEtherListsService,
        private readonly tokensService: TokensService,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        logger.info(`${this.prefixLog} Worker started`)

        if (this.unsupportedBlockchains.includes(currentBlockchain)) {
            logger.error(`${this.prefixLog} Unsupported blockchain ${currentBlockchain}. Aborting`)

            return
        }

        let files: GitHubFile[]

        try {
            files = await this.myEtherListsService.getTokensList(currentBlockchain)
        } catch (ex: any) {
            logger.error(
                `${this.prefixLog} Aborting. Failed to fetch all files for given blockchain. Reason: ${ex.message}`
            )

            return
        }

        let i = 0

        for (const file of files) {
            ++i

            const rawToken = await this.myEtherListsService.getRawToken(file.download_url)
            const tokenName = rawToken.name + '(' + rawToken.symbol + ')'

            logger.info(`${this.prefixLog} Check ${tokenName} ${i}/${files.length}`)

            const tokenInDb = await this.tokensService.findByAddress(rawToken.address, currentBlockchain)

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

            await this.tokensService.add(
                tokenAddress,
                tokenName,
                [ website ],
                [ email ],
                links,
                this.workerName,
                currentBlockchain
            )

            logger.info(
                `${this.prefixLog} Added to DB:`,
                tokenAddress,
                tokenName,
                website,
                links,
                this.workerName,
                currentBlockchain
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
