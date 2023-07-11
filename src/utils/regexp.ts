export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(email)
}

export function isValidTwitterLink(link: string): boolean {
    return /http(?:s)?:\/\/(?:www\.)?twitter\.com\/([a-zA-Z0-9_]+)/.test(link)
}

export function isValidTgLink(link: string): boolean {
    return /http(?:s)?:\/\/(?:www\.)?(telegram|t)\.me\/([a-zA-Z0-9_]+)/.test(link)
}

export function removeQueryParams(link: string): string {
    return link.replace(/\?.*$/, '')
}
