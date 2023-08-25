/* eslint-disable @typescript-eslint/naming-convention */

export interface GitHubFile {
    name: string
    type: 'file' | 'dir'
    download_url: string
}

export interface GitHubRawTokenFile {
    symbol: string
    name: string
    type: string
    address: string
    ens_address: string
    decimals: number
    website: string
    logo: {
        src: string
        width: string
        height: string
        ipfs_hash: string
    }
    support: {
        email: string
        url: string
    }
    social: GitHubRawTokenSocial
}

export interface GitHubRawTokenSocial {
    blog: string
    chat: string
    discord: string
    facebook: string
    forum: string
    github: string
    gitter: string
    instagram: string
    linkedin: string
    reddit: string
    slack: string
    telegram: string
    twitter: string
    youtube: string
}
