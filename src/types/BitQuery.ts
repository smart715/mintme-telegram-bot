/* eslint-disable @typescript-eslint/naming-convention */

export interface BitQueryTransfersResponse {
    data: {
        ethereum: {
            transfers: AddressResponse[],
        },
    },
    errors: ErrorTransferResponse[]|undefined,
}

export interface AddressResponse {
    count: number,
    currency: {
        address: string
    },
}

export interface ErrorTransferResponse {
    message: string,
    locations: [],
    path: [],
    error_type: string,
    query_id: string,
}
