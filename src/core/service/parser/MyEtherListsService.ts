import axios from 'axios'
import { singleton } from 'tsyringe'
import { GitHubFile } from '../../../types'

@singleton()
export class MyEtherListsService {
    public async getTokensList(blockchain: string): Promise<GitHubFile[]> {
        const owner = 'MyEtherWallet';
        const repo = 'ethereum-lists';
        const folderPath = `src/tokens/${blockchain.toLowerCase()}`;

        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${folderPath}`;

        const response = await axios.get(apiUrl);

        return response.data.filter(item => 'file' === item.type)
    }
}
