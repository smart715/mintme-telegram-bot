/* eslint-disable @typescript-eslint/naming-convention */

export interface GitHubFile {
    name: string;
    type: 'file' | 'dir';
    download_url: string;
}
