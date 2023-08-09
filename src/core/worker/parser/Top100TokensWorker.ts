import {AbstractTokenWorker} from "../AbstractTokenWorker";
import {Blockchain, logger} from "../../../utils";
import {TokensService, Top100TokensService} from "../../service";
import {Top100TokensTopListResponse} from "../../../types";

export class Top100TokensWorker extends AbstractTokenWorker {
    private readonly workerName = 'Top100Tokens'
    private readonly prefixLog = `[${this.workerName}]`

    public constructor(
        private readonly top100TokensService: Top100TokensService,
        private readonly tokenService: TokensService,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        let page = 1
        let resultsCount = 0

        const targetBlockchain = this.getTargetBlockchain(currentBlockchain)

        do {
            logger.info(`${this.prefixLog} Page: ${page}`)

            let allTokensResponse: Top100TokensTopListResponse

            try {
                allTokensResponse = await this.top100TokensService.getTokens(page)
            } catch (ex: any) {
                logger.error(
                    `${this.prefixLog} Aborting. Failed to fetch all tokens. Page: ${page} Reason: ${ex.message}`
                )

                continue
            }

            if ('success' !== allTokensResponse.status) {
                page += 1

                continue
            }

            page += 1
        } while (resultsCount > 0)
    }

    private getTargetBlockchain(currentBlockchain: Blockchain): string {
        switch (currentBlockchain) {
            case Blockchain.ETH:
                return 'ethereum'
            case Blockchain.BSC:
                return 'binance'
            case Blockchain.CRO:
                return 'cronos'
            default:
                throw new Error('Wrong blockchain provided. Target blockchain doesn\'t exists for provided blockchain')
        }
    }
}
