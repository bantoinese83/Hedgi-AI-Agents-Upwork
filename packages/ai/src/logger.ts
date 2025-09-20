/**
 * Enhanced logger utility for the AI package using pino with pino-pretty
 */

import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

// Log levels enum for compatibility with tests
export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
}

// Custom Logger class that wraps pino for test compatibility
export class Logger {
    private pinoLogger: pino.Logger;
    private currentLevel: LogLevel = LogLevel.INFO;
    private consoleEnabled: boolean = true;

    constructor(options?: { level?: LogLevel; enableConsole?: boolean }) {
        this.currentLevel = options?.level ?? LogLevel.INFO;
        this.consoleEnabled = options?.enableConsole ?? true;

        // Configure pino with pino-pretty for development
        this.pinoLogger = pino(
            isProduction
                ? {
                    level: this.getPinoLevel(this.currentLevel),
                    formatters: {
                        level: (label) => {
                            return { level: label };
                        },
                    },
                }
                : {
                    level: this.getPinoLevel(this.currentLevel),
                    transport: {
                        target: 'pino-pretty',
                        options: {
                            colorize: true,
                            translateTime: 'yyyy-mm-dd HH:MM:ss',
                            ignore: 'pid,hostname',
                            singleLine: false,
                            hideObject: false,
                        },
                    },
                }
        );
    }

    private getPinoLevel(level: LogLevel): string {
        switch (level) {
            case LogLevel.ERROR: return 'error';
            case LogLevel.WARN: return 'warn';
            case LogLevel.INFO: return 'info';
            case LogLevel.DEBUG: return 'debug';
            default: return 'info';
        }
    }

    private shouldLog(level: LogLevel): boolean {
        return level <= this.currentLevel && this.consoleEnabled;
    }

    info(message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.INFO)) {
            if (args.length === 0) {
                this.pinoLogger.info(message);
            } else if (args.length === 1) {
                this.pinoLogger.info(message, args[0] as any);
            } else {
                this.pinoLogger.info(message, args as any);
            }
        }
    }

    warn(message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.WARN)) {
            if (args.length === 0) {
                this.pinoLogger.warn(message);
            } else if (args.length === 1) {
                this.pinoLogger.warn(message, args[0] as any);
            } else {
                this.pinoLogger.warn(message, args as any);
            }
        }
    }

    error(message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            if (args.length === 0) {
                this.pinoLogger.error(message);
            } else if (args.length === 1) {
                this.pinoLogger.error(message, args[0] as any);
            } else {
                this.pinoLogger.error(message, args as any);
            }
        }
    }

    debug(message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            if (args.length === 0) {
                this.pinoLogger.debug(message);
            } else if (args.length === 1) {
                this.pinoLogger.debug(message, args[0] as any);
            } else {
                this.pinoLogger.debug(message, args as any);
            }
        }
    }

    setLevel(level: LogLevel): void {
        this.currentLevel = level;
        this.pinoLogger.level = this.getPinoLevel(level);
    }

    setConsoleEnabled(enabled: boolean): void {
        this.consoleEnabled = enabled;
    }
}

// Configure pino with pino-pretty for development
const logger = pino(
    isProduction
        ? {
            level: 'warn',
            formatters: {
                level: (label) => {
                    return { level: label };
                },
            },
        }
        : {
            level: 'info',
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'yyyy-mm-dd HH:MM:ss',
                    ignore: 'pid,hostname',
                    singleLine: false,
                    hideObject: false,
                },
            },
        }
);

// Create a default logger instance for backward compatibility
const defaultLogger = new Logger();

// Export both the default logger instance and the class
export { logger, defaultLogger as loggerInstance };

// Re-export pino types for convenience
export type { Logger as PinoLogger } from 'pino';

