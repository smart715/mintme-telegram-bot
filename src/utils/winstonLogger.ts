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
    const logFormat = winston.format.printf((info) => {
        const metaLog = getMetaLog(info)

        const formattedTimestamp = chalk.grey('[' +
            moment(info.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')
        + ']')

        return `${formattedTimestamp} ${colors[info.level.toUpperCase()](info.level)}: ${info.message} ${metaLog}`
    })

    // Create separate transports for console and file
    const consoleTransport = new winston.transports.Console()
    const fileTransport = new winston.transports.File({ filename: `var/log/${filename}.log` }) // Default filename

    // Create a logger instance
    const winstonLogger = winston.createLogger({
        level: 'info', // Set your desired log level
        format: winston.format.combine(
            winston.format.json(),
            winston.format.timestamp(),
            logFormat,
        ),
        transports: [ consoleTransport, fileTransport ],
    })

    return winstonLogger
}

function getMetaLog(info: { [key: string|number]: string|object }): string {
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
            : parseObjectToStr(metaParam)

        meta += stillEmpty
            ? paramStr
            : ' ' + paramStr
    }

    return meta
}

function parseObjectToStr(metaParam: object): string {
    const params: string[] = Object.values(metaParam)

    let str: string = '[ '

    for (const paramKey in params) {
        const lastKey = Number(paramKey) === params.length - 1

        str += chalk.green(params[paramKey])

        if (!lastKey) {
            str += ', '
        }
    }

    str += ' ]'

    return str
}
