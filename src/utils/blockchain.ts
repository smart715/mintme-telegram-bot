export function findContractAddress(source: string): string|null {
    const addresses = source.match("0x[a-z0-9]{40}")

    return addresses.length > 0
        ? addresses[0]
        : null
}
