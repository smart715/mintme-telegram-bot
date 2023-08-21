// @ts-nocheck
import { createLogger, transports, format } from 'winston'
const { combine, timestamp, label, prettyPrint } = format;

// import chalk from 'chalk'
//
// const colors: { [color: string]: typeof chalk.magenta } = {
//     TRACE: chalk.magenta,
//     DEBUG: chalk.cyan,
//     INFO: chalk.blue,
//     WARN: chalk.yellow,
//     ERROR: chalk.red,
// }

function loggerInit() {
    return createLogger({
        level: 'info',
        format: combine(
            format.splat(),
        ),
        transports: [new transports.Console()]
    });
}

const logger = loggerInit();

export default logger;
