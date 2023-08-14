export function getHrefFromTagString(source: RegExpMatchArray): string {
    const matchedAttr = source.join(' ').match(/href="([^"]*)/)

    if (!matchedAttr) {
        return ''
    }

    return matchedAttr[1]
}

export function getHrefValuesFromTagString(source: RegExpMatchArray): string[] {
    const rawLinks = source.join(' ').match(/href="(.+?)"/g)

    if (!rawLinks) {
        return []
    }

    const links: string[] = []

    for (const rawLink of rawLinks) {
        const result = rawLink.match(/href="([^"]*)/)

        if (!result) {
            return []
        }

        links.push(result[1])
    }

    // filter empty href (#) and remove duplicates
    return [ ...new Set(links.filter((link) => '#' !== link)) ]
}
