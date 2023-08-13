export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(email)
}

export function isValidTwitterLink(link: string): boolean {
    return link.toLowerCase().includes('twitter.com/')
}

export function isValidTgLink(link: string): boolean {
    return link.toLowerCase().includes('t.me/')
}

export function removeQueryParams(link: string): string {
    return link.replace(/\?.*$/, '')
}
