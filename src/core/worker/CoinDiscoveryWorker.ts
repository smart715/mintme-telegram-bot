import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from './AbstractTokenWorker'
import { TokensService, CoinDiscoveryService } from '../service'
import { Blockchain, getHrefValuesFromTagString } from '../../utils'

@singleton()
export class CoinDiscoveryWorker extends AbstractTokenWorker {
    public constructor(
        private readonly coinDiscoveryService: CoinDiscoveryService,
        private readonly tokenService: TokensService,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<any> {
        try {
            console.log(`${CoinDiscoveryWorker.name} started`)

            const unsupportedBlockchains: Blockchain[] = [Blockchain.CRO]

            if (unsupportedBlockchains.includes(currentBlockchain)) {
                console.log(`[CoinDiscoveryWorker] Unsupported blockchain ${currentBlockchain}`)

                return
            }


            // @todo get rid of chainId
            const chainId = Blockchain.BSC === currentBlockchain
                ? 1
                : "Ethereum"

            let count: number
            let start: number = 0

            do {
                console.log(`[CoinDiscoveryWorker] cursor ${start}`)

                const coins = await this.coinDiscoveryService.getTokens(start)

                count = Object.keys(coins).length

                for (const coin of coins) {
                    const name = coin.name + "(" + coin.symbol + ")"
                    const id = coin.name_slug
                    const tokenAddress: string = coin.contract
                    const blockchain = coin.chain === "1"
                        ? "bnbTokens"
                        : chain === "2"
                            ? "etherscanTokens"
                            : ""

                    if ("" === blockchain) {
                        continue
                    }

                    if (await this.tokenService.findByAddress(tokenAddress, currentBlockchain)) {
                        continue
                    }

                    const tokenInfo = await this.coinDiscoveryService.getInfo(id)

                    let website = ""

                    const links = getHrefValuesFromTagString(
                        tokenInfo.match(/<div class=""chain-action d-flex"">(.+?)<table class=""table"/).join(' ')
                    )

                    if (links.length > 0) {
                        if (tokenInfo.includes("class\"link\"")) {
                            website = links[0]
                        }
                    }

                    await this.tokenService.add(
                        tokenAddress,
                        name,
                        [website],
                        [""],
                        links,
                        "CoinDiscovery",
                        currentBlockchain
                    )

                    start += 500
                }
            } while (count > 0)
            console.log(`${CoinDiscoveryWorker.name} finished`)
        } catch (error: any) {
            console.log(`${CoinDiscoveryWorker.name} something went wrong. Reason: ${error.message}`)
        }
    }
}
