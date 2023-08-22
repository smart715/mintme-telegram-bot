import winston from 'winston';
import moment from 'moment';

export function createLogger(filename: string = 'default') {
    const logFormat = winston.format.printf(({ timestamp, level, message }) => {
        const formattedTimestamp = moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
        return `[${formattedTimestamp}] ${level}: ${message}`;
    });

    // Function to colorize log levels
    const colorizeFormat = winston.format.colorize();

    // Create separate transports for console and file
    const consoleTransport = new winston.transports.Console();
    const fileTransport = new winston.transports.File({ filename: `var/log/${filename}.log` }); // Default filename

    // Create a logger instance
    const winstonLogger = winston.createLogger({
        level: 'info', // Set your desired log level
        format: winston.format.combine(
            winston.format.timestamp(),
            colorizeFormat,
            logFormat
        ),
        transports: [consoleTransport, fileTransport],
    });

    return winstonLogger
}
