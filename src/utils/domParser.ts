export function getHrefFromTagString(source: string): string {
    const matchedAttr = source.match(/href="([^"]*)/);

    if (!matchedAttr) {
        return ''
    }

    return matchedAttr[1];
}

export function getHrefValuesFromTagString(source: string): string[] {
    const rawLinks = source.match((/href=\"(.+?)\"/g))

    if (!rawLinks) {
        return []
    }

    let links: string[] = [];

    rawLinks.forEach((rawLink: string) => {
        const result = rawLink.match(/href="([^"]*)/)

        if (!result) {
            return
        }

        links.push(result[1])
    })

    return links
}
