"use strict";
/**
 * Enhanced logger utility for the AI package using pino with pino-pretty
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerInstance = exports.logger = exports.Logger = exports.LogLevel = void 0;
const pino_1 = __importDefault(require("pino"));
const isProduction = process.env.NODE_ENV === 'production';
// Log levels enum for compatibility with tests
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
// Custom Logger class that wraps pino for test compatibility
class Logger {
    constructor(options) {
        this.currentLevel = LogLevel.INFO;
        this.consoleEnabled = true;
        this.currentLevel = options?.level ?? LogLevel.INFO;
        this.consoleEnabled = options?.enableConsole ?? true;
        // Configure pino with pino-pretty for development
        this.pinoLogger = (0, pino_1.default)(isProduction
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
            });
    }
    getPinoLevel(level) {
        switch (level) {
            case LogLevel.ERROR: return 'error';
            case LogLevel.WARN: return 'warn';
            case LogLevel.INFO: return 'info';
            case LogLevel.DEBUG: return 'debug';
            default: return 'info';
        }
    }
    shouldLog(level) {
        return level <= this.currentLevel && this.consoleEnabled;
    }
    info(message, ...args) {
        if (this.shouldLog(LogLevel.INFO)) {
            if (args.length === 0) {
                this.pinoLogger.info(message);
            }
            else if (args.length === 1) {
                this.pinoLogger.info(message, args[0]);
            }
            else {
                this.pinoLogger.info(message, args);
            }
        }
    }
    warn(message, ...args) {
        if (this.shouldLog(LogLevel.WARN)) {
            if (args.length === 0) {
                this.pinoLogger.warn(message);
            }
            else if (args.length === 1) {
                this.pinoLogger.warn(message, args[0]);
            }
            else {
                this.pinoLogger.warn(message, args);
            }
        }
    }
    error(message, ...args) {
        if (this.shouldLog(LogLevel.ERROR)) {
            if (args.length === 0) {
                this.pinoLogger.error(message);
            }
            else if (args.length === 1) {
                this.pinoLogger.error(message, args[0]);
            }
            else {
                this.pinoLogger.error(message, args);
            }
        }
    }
    debug(message, ...args) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            if (args.length === 0) {
                this.pinoLogger.debug(message);
            }
            else if (args.length === 1) {
                this.pinoLogger.debug(message, args[0]);
            }
            else {
                this.pinoLogger.debug(message, args);
            }
        }
    }
    setLevel(level) {
        this.currentLevel = level;
        this.pinoLogger.level = this.getPinoLevel(level);
    }
    setConsoleEnabled(enabled) {
        this.consoleEnabled = enabled;
    }
}
exports.Logger = Logger;
// Configure pino with pino-pretty for development
const logger = (0, pino_1.default)(isProduction
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
    });
exports.logger = logger;
// Create a default logger instance for backward compatibility
const defaultLogger = new Logger();
exports.loggerInstance = defaultLogger;
//# sourceMappingURL=logger.js.map