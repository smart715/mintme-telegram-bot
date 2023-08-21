import { singleton } from 'tsyringe'
import ormconfig from '../../config/ormconfig'
import { Connection, createConnection, getConnection } from 'typeorm'
import { logger } from '.'

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

    public async retryConnection(): Promise<void> {
        if (this.getConnection().isConnected) {
            await this.getConnection().close()
        }

        try {
            await this.getConnection().connect()

            logger.info('Connection to database reestablished successfully')
        } catch (err) {
            logger.error(err)

            logger.info('Error while retrying connection. Retrying in 5 seconds...')

            await new Promise(resolve => setTimeout(resolve, 5000))

            await this.retryConnection()
        }
    }

    public isFailedConnectionError(err: any): boolean {
        return err && err.code && [ 'PROTOCOL_CONNECTION_LOST', 'ECONNRESET', 'ECONNREFUSED' ].includes(err.code)
    }
}
