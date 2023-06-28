import { Entity } from "typeorm"
import { BnbToken } from "./BnbToken"

@Entity("croTokens")
export class CroToken extends BnbToken { }
