export interface BitQueryTransfersResponse {
    data: {
        ethereum: {
            transfers: [
                {
                    count: number,
                    currency: {
                        address: string
                    } ,
                },
            ],
        },
    },
}
