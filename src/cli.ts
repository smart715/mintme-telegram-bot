import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()

import yargs from 'yargs'
import { CliDependency, container, CommandInterface } from './app'
import { createLogger, Database } from './utils'

(async (): Promise<void> => {
    if (!await databaseHealthCheck()) {
        process.exit(1)
    }

    yargs
        .scriptName('')
        .usage('$0 <command> [arguments]')
        .help()
        .strict()

    const commands = container.resolveAll(CliDependency.COMMAND) as CommandInterface[]

    for (const command of commands) {
        yargs.command(
            command.command,
            command.description,
            command.builder.bind(command),
            command.handler.bind(command),
            command.middlewares,
            command.deprecated
        )
    }

    yargs.argv
})()

async function databaseHealthCheck(): Promise<boolean> {
    const logger = createLogger()

    try {
        await container.resolve(Database).createConnection()

        logger.info('DataBase connection established')

        return true
    } catch (err) {
        logger.info('DataBase connection failed', err)

        return false
    }
}
