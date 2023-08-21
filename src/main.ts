import 'reflect-metadata'
import { Application, container } from './app'
import { Database, logger } from './utils'

(async (): Promise<void> => {
    if (!await databaseHealthCheck()) {
        process.exit(1)
    }

    const app = container.resolve(Application)

    app.run()
})()

async function databaseHealthCheck(): Promise<boolean> {
    try {
        await container.resolve(Database).createConnection()

        logger.info('DataBase connection established')

        return true
    } catch (err) {
        logger.info('DataBase connection failed', err)

        return false
    }
}
