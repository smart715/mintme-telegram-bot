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

const journaldLogLevels: { [color: string]: string } = {
    CRIT: '<2>',
    ERROR: '<3>',
    WARN: '<4>',
    TRACE: '', // such journald logLevel prefix wouldn't work for TRACE console output
    INFO: '<6>',
    DEBUG: '<7>',
}

function getJournaldLogLevel(level: string): string {
    return ''
    //return journaldLogLevels[level]
}

prefix.reg(log)

log.enableAll()

prefix.apply(log, {
    format(level: string, name: string | undefined, timestamp: Date) {
        const journaldLogLevel = getJournaldLogLevel(level.toUpperCase())
        const formattedTimestamp = chalk.gray(`[${timestamp}]`)
        const logLevel = colors[level.toUpperCase()](level)
        const formattedName = chalk.green(`${name}:`)

        return `${journaldLogLevel}${formattedTimestamp} ${logLevel} ${formattedName}`
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
        const journaldLogLevel = getJournaldLogLevel('CRIT')

        return chalk.red.bold(`${journaldLogLevel}[${timestamp}] ${level} ${name}:`)
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
