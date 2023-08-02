// @ts-nocheck
import 'reflect-metadata'
import dotenv from 'dotenv'
import { JSDOM } from 'jsdom'
dotenv.config()

import yargs from 'yargs'
import { CliDependency, container } from './app'
import { CommandInterface } from './command'
import { Database, logger } from './utils'

(async (): Promise<void> => {
    if (!await databaseHealthCheck()) {
        process.exit(1)
    }

    configureJSDom()

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
    try {
        await container.resolve(Database).createConnection()

        logger.info('DataBase connection established')

        return true
    } catch (err) {
        logger.info('DataBase connection failed', err)

        return false
    }
}

function configureJSDom(): void {
    const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
    const { window } = jsdom;

    function copyProps(src, target) {
        Object.defineProperties(target, {
            ...Object.getOwnPropertyDescriptors(src),
            ...Object.getOwnPropertyDescriptors(target),
        });
    }

    // noinspection JSConstantReassignment
    global.window = window;
    // noinspection JSConstantReassignment
    global.document = window.document;
    // noinspection JSConstantReassignment
    global.navigator = {
        userAgent: 'node.js',
    }
    global.requestAnimationFrame = function (callback) {
        return setTimeout(callback, 0);
    }

    global.cancelAnimationFrame = function (id) {
        clearTimeout(id);
    };
    copyProps(window, global);
}
