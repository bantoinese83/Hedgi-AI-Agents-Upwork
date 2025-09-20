/**
 * Enhanced logger utility for the AI package using pino with Next.js compatibility
 */
import pino from 'pino';
export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
export declare class Logger {
    private pinoLogger;
    private currentLevel;
    private consoleEnabled;
    constructor(options?: {
        level?: LogLevel;
        enableConsole?: boolean;
    });
    private getPinoConfig;
    private getPinoLevel;
    private shouldLog;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
    debug(message: string, ...args: unknown[]): void;
    setLevel(level: LogLevel): void;
    setConsoleEnabled(enabled: boolean): void;
}
declare const logger: pino.Logger<never, boolean>;
declare const defaultLogger: Logger;
export { logger, defaultLogger as loggerInstance };
export type { Logger as PinoLogger } from 'pino';
//# sourceMappingURL=logger.d.ts.map