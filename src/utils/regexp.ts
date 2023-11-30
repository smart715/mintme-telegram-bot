export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(email)
}

export function getEmailRegex(): RegExp {
    return /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
}

export function getContactMethodRegex(method: string): RegExp|undefined {
    switch (method) {
        case 'TWITTER':
            return /twitter\.com\/[a-zA-Z0-9_]{4,15}/
        case 'TELEGRAM':
            return /t\.me\/[a-zA-Z0-9_]{5,32}/
    }
    return undefined
}
export function getValidLinks(links: string[], method: string): string[] {
    const blacklistLinks = [
        'twitter.com/status',
        'twitter.com/search',
        'twitter.com/messages',
        'twitter.com/explore',
        'twitter.com/notifications',
        'twitter.com/settings',
    ]

    const regex = getContactMethodRegex(method)

    if (!regex) {
        return []
    }

    const validLinks = []

    for (const link of links) {
        const regexResults = regex.exec(link.replace('/@', '/'))

        if (regexResults) {
            for (const validLink of regexResults) {
                if (!blacklistLinks.includes(validLink)) {
                    validLinks.push(`https://${validLink}`)
                }
            }
        }
    }

    return validLinks
}

export function removeQueryParams(link: string): string {
    return link.replace(/\?.*$/, '')
}

export function removeHttpsProtocol(link: string): string {
    return link.replace('https://', '')
}
