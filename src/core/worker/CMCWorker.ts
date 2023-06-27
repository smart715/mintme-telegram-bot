import { singleton } from "tsyringe";
import { CMCService } from "../service";
import { AbstractTokenWorker } from "./AbstractTokenWorker";

@singleton()
export class CMCWorker extends AbstractTokenWorker {

    public constructor(private readonly cmcService: CMCService) {
        super();
    }

    public async run(): Promise<any> {
        console.log(`${CMCWorker.name} started`);

        const tokens = await this.cmcService.getLastTokens(10325, 10);

        tokens.data.forEach(async token => {
            if (!token.platform?.token_address) {
                return;
            }

            const tokenInfos = await this.cmcService.getTokenInfo(token.slug);

            if (!tokenInfos.data || !tokenInfos.data[token.id]) {
                console.log(`no token info found for ${token.name} . Skipping`);

                return;
            }

            const tokenInfo = tokenInfos.data[token.id];

            const tokenAddress = token.platform.token_address;
            const tokenName = token.name;
            const website = tokenInfo.urls.website?.length ? tokenInfo.urls.website[0] : null;
            const email = "";
            const links = this.getUsefulLinks(tokenInfo.urls);
            const workerSource = "CMC";
            const blockchain = token.platform.slug;

            console.log(tokenAddress, tokenName, website, email, links, workerSource, blockchain);
        });
    }

    private getUsefulLinks(linksObj: {[type: string] : string[]}): string[] {
        const links: string[] = [];

        Object.values(linksObj).forEach((links: string[]) => {
            links.push(links.join(','));
        });

        return links;
    }
}
