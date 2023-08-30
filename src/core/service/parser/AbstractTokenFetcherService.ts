import axios from 'axios'

export abstract class AbstractTokenFetcherService {
    protected async loadPageContent(url: string): Promise<string> {
        const response = await axios.get(url)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }
}
