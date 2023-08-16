import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { singleton } from 'tsyringe'
import {Blockchain, logger} from "../../../utils";
import {MyEtherListsService, TokensService} from "../../service";
import {GitHubFile} from "../../../types";

@singleton()
export class MyEtherListsWorker extends AbstractTokenWorker{
    private readonly workerName = 'MyEtherLists'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly unsupportedBlockchains: Blockchain[] = [ Blockchain.CRO ]

    constructor(
        private readonly myEtherListsService: MyEtherListsService,
        private readonly tokensService: TokensService,
    ) {
        super();
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

        for (const file of files) {
            logger.info(file.name, file.name, file.download_url,)
        }
    }
}
