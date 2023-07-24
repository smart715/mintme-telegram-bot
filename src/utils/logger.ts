import chalk from 'chalk'
import log from 'loglevel'
import prefix from 'loglevel-plugin-prefix'

const colors: { [color: string]: typeof chalk.magenta } = {
    TRACE: chalk.magenta,
    DEBUG: chalk.cyan,
    INFO: chalk.blue,
    WARN: chalk.yellow,
    ERROR: chalk.red,
}

prefix.reg(log)

log.enableAll()

prefix.apply(log, {
    format(level: string, name: string | undefined, timestamp: Date) {
        const formattedTimestamp = chalk.gray(`[${timestamp}]`)
        const logLevel = colors[level.toUpperCase()](level)
        const formattedName = chalk.green(`${name}:`)

        return `${formattedTimestamp} ${logLevel} ${formattedName}`
    },
    timestampFormatter(date: Date) {
        return date
            .toISOString()
            .replace('T', ' ')
            .replace('Z', '')
    },
})

prefix.apply(log.getLogger('critical'), {
    format(level: string, name: string | undefined, timestamp: Date) {
        return chalk.red.bold(`[${timestamp}] ${level} ${name}:`)
    },
})

export default log

// eslint-disable-next-line @typescript-eslint/naming-convention
export function Loggable() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
        const original = descriptor.value

        descriptor.value = function (...args: any[]): any {
            log.info(`[${target.constructor.name}] method "${propertyKey}":`, args)

            return original.apply(this, args)
        }
    }
}
