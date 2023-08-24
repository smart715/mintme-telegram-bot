import winston, { Logger } from 'winston'
import moment from 'moment'
import chalk from 'chalk'

const colors: { [color: string]: typeof chalk.magenta } = {
    TRACE: chalk.magenta,
    DEBUG: chalk.cyan,
    INFO: chalk.blue,
    WARN: chalk.yellow,
    ERROR: chalk.red,
}

export function createLogger(filename: string = 'default'): Logger {
    const logFormatConsole = winston.format.printf((info) => {
        const metaLog = getMetaLog(info)

        const formattedTimestamp = chalk.grey('[' +
            moment(info.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')
        + ']')

        const level = colors[info.level.toUpperCase()](info.level.toUpperCase())

        return `${formattedTimestamp} ${level}: ${info.message} ${metaLog}`
    })

    const logFormatFile = winston.format.printf((info) => {
        const metaLog = getMetaLog(info, false)

        const formattedTimestamp = '[' +
            moment(info.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')
            + ']'

        const level = info.level.toUpperCase()

        return `${formattedTimestamp} ${level}: ${info.message} ${metaLog}`
    })

    // Create separate transports for console and file
    const consoleTransport = new winston.transports.Console({
        format: winston.format.combine(logFormatConsole),
    })
    const fileTransport = new winston.transports.File({
        filename: `log/${filename}.log`,
        format: winston.format.combine(logFormatFile),
    })

    // Create a logger instance
    const winstonLogger = winston.createLogger({
        level: 'info', // Set your desired log level
        transports: [ consoleTransport, fileTransport ],
    })

    return winstonLogger
}

function getMetaLog(info: { [key: string|number]: string|object }, colorize = true): string {
    const keys = Object.keys(info)

    let meta = ''

    for (const key of keys) {
        if (isNaN(key as any)) {
            continue
        }

        const metaParam = info[key]
        const stillEmpty = '' === meta

        const paramStr = 'string' === typeof metaParam
            ? metaParam
            : parseObjectToStr(metaParam, colorize)

        meta += stillEmpty
            ? paramStr
            : ' ' + paramStr
    }

    return meta
}

function parseObjectToStr(metaParam: object, colorize: boolean): string {
    if (!metaParam) {
        return String(metaParam)
    }

    const params: string[] = Object.values(metaParam)

    let str: string = '[ '

    for (const paramKey in params) {
        const lastKey = Number(paramKey) === params.length - 1

        str += colorize
            ? chalk.green(params[paramKey])
            : params[paramKey]

        if (!lastKey) {
            str += ', '
        }
    }

    str += ' ]'

    return str
}
