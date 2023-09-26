import axios from 'axios'
import { singleton } from 'tsyringe'
import { GitHubFile, GitHubRawTokenFile } from '../../types'

@singleton()
export class MyEtherListsService {
    public async getTokensList(blockchain: string): Promise<GitHubFile[]> {
        const owner = 'MyEtherWallet'
        const repo = 'ethereum-lists'
        const folderPath = `src/tokens/${blockchain.toLowerCase()}`
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${folderPath}`

        const response = await axios.get(apiUrl)

        return response.data.filter((item: GitHubFile) => 'file' === item.type)
    }

    public async getRawToken(link: string): Promise<GitHubRawTokenFile> {
        const response = await axios.get(link)

        return response.data
    }
}
