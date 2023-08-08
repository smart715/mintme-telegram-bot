export interface BitQueryTransfersResponse {
    data: {
        ethereum: {
            transfers: AddressResponse[],
        },
    },
}

export interface AddressResponse {
    count: number,
    currency: {
        address: string
    } ,
}
