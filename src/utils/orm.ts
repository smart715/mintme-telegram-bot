import { singleton } from "tsyringe"
import ormconfig from "../../config/ormconfig"
import { Connection, createConnection, getConnection } from "typeorm"

@singleton()
export class Database {
    private static connection: Connection

    public async createConnection(): Promise<Connection> {
        if (Database.connection) {
            return Database.connection
        }

        Database.connection = await createConnection(ormconfig)

        return Database.connection
    }

    public getConnection(): Connection {
        return getConnection()
    }
}
