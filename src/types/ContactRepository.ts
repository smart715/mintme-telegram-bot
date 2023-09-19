/* eslint-disable @typescript-eslint/naming-convention */
import { Blockchain } from '../utils'
import { ContactMethod } from '../core'

export interface GroupedContactsCount {
    tokens: string,
    blockchain: Blockchain,
    contact_method: ContactMethod,
    is_success: number
}
