/**
 * Simple logger utility for the AI package
 */

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
}

export interface LoggerConfig {
    level: LogLevel;
    enableConsole: boolean;
}

class Logger {
    private config: LoggerConfig;

    constructor(
        config: LoggerConfig = { level: LogLevel.INFO, enableConsole: true }
    ) {
        this.config = config;
    }

    private shouldLog(level: LogLevel): boolean {
        return this.config.enableConsole && level <= this.config.level;
    }

    error(message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(`[ERROR] ${message}`, ...args);
        }
    }

    warn(message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }

    info(message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.INFO)) {
            console.log(`[INFO] ${message}`, ...args);
        }
    }

    debug(message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    }

    setLevel(level: LogLevel): void {
        this.config.level = level;
    }

    setConsoleEnabled(enabled: boolean): void {
        this.config.enableConsole = enabled;
    }
}

// Default logger instance
export const logger = new Logger({
    level: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.INFO,
    enableConsole: true,
});

// Export the Logger class for custom instances
export { Logger };
