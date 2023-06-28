import { singleton } from "tsyringe";
import { DataSource } from "typeorm";
import ormconfig from "../../config/ormconfig";

@singleton()
export class Database {
    private static connection: DataSource;

    public async createConnection(): Promise<DataSource> {
        if (Database.connection) {
            return Database.connection
        }

        Database.connection = new DataSource(ormconfig)

        await Database.connection.initialize()

        return Database.connection
    }

    public getConnection(): DataSource {
        return Database.connection
    }
}
