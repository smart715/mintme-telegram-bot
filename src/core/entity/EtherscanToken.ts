import { Entity } from "typeorm"
import { BnbToken } from "./BnbToken"

@Entity("etherscanTokens")
export class EtherscanToken extends BnbToken { }
