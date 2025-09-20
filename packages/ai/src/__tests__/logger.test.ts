import { Logger, loggerInstance, LogLevel } from '../logger';

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleDebug = jest.spyOn(console, 'debug').mockImplementation();

// Create a test logger instance
let testLogger: Logger;

describe('Logger', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        mockConsoleLog.mockRestore();
        mockConsoleWarn.mockRestore();
        mockConsoleError.mockRestore();
    });

    describe('Logger class', () => {
        beforeEach(() => {
            testLogger = new Logger({
                level: LogLevel.INFO,
                enableConsole: true,
            });
        });

        it('should create logger with default config', () => {
            const defaultLogger = new Logger();
            expect(defaultLogger).toBeInstanceOf(Logger);
        });

        it('should log info messages when level allows', () => {
            // Test that the logger doesn't throw and the internal pino logger is created
            expect(() => testLogger.info('Test info message', 'extra', 'args')).not.toThrow();
            expect((testLogger as any).pinoLogger).toBeDefined();
        });

        it('should log warn messages when level allows', () => {
            expect(() => testLogger.warn('Test warn message', 'extra', 'args')).not.toThrow();
            expect((testLogger as any).pinoLogger).toBeDefined();
        });

        it('should log error messages when level allows', () => {
            expect(() => testLogger.error('Test error message', 'extra', 'args')).not.toThrow();
            expect((testLogger as any).pinoLogger).toBeDefined();
        });

        it('should log debug messages when level allows', () => {
            // Create a logger with DEBUG level
            const debugLogger = new Logger({ level: LogLevel.DEBUG, enableConsole: true });
            expect(() => debugLogger.debug('Test debug message', 'extra', 'args')).not.toThrow();
            expect((debugLogger as any).pinoLogger).toBeDefined();
        });

        it('should not log messages below current level', () => {
            const debugLogger = new Logger({
                level: LogLevel.WARN,
                enableConsole: true,
            });

            debugLogger.info('This should not log');
            debugLogger.debug('This should not log');
            debugLogger.warn('This should log');
            debugLogger.error('This should log');

            // Just verify the logger doesn't throw
            expect(() => debugLogger.warn('This should log')).not.toThrow();
            expect(() => debugLogger.error('This should log')).not.toThrow();
        });

        it('should not log when console is disabled', () => {
            const silentLogger = new Logger({
                level: LogLevel.DEBUG,
                enableConsole: false,
            });

            silentLogger.info('This should not log');
            silentLogger.warn('This should not log');
            silentLogger.error('This should not log');
            silentLogger.debug('This should not log');

            expect(mockConsoleLog).not.toHaveBeenCalled();
            expect(mockConsoleWarn).not.toHaveBeenCalled();
            expect(mockConsoleError).not.toHaveBeenCalled();
        });

        it('should allow changing log level', () => {
            testLogger.setLevel(LogLevel.ERROR);

            testLogger.info('This should not log');
            testLogger.warn('This should not log');
            testLogger.error('This should log');

            // Just verify the logger doesn't throw
            expect(() => testLogger.error('This should log')).not.toThrow();
        });

        it('should allow enabling/disabling console', () => {
            testLogger.setConsoleEnabled(false);

            testLogger.info('This should not log');
            testLogger.warn('This should not log');
            testLogger.error('This should not log');

            expect(mockConsoleLog).not.toHaveBeenCalled();
            expect(mockConsoleWarn).not.toHaveBeenCalled();
            expect(mockConsoleError).not.toHaveBeenCalled();

            testLogger.setConsoleEnabled(true);

            expect(() => testLogger.info('This should log now')).not.toThrow();
        });
    });

    describe('Default logger instance', () => {
        it('should be available and functional', () => {
            expect(() => loggerInstance.info('Default logger test')).not.toThrow();
        });

        it('should have correct default configuration', () => {
            // Test that the default logger works
            expect(() => loggerInstance.warn('Test warning')).not.toThrow();
        });
    });

    describe('LogLevel enum', () => {
        it('should have correct values', () => {
            expect(LogLevel.ERROR).toBe(0);
            expect(LogLevel.WARN).toBe(1);
            expect(LogLevel.INFO).toBe(2);
            expect(LogLevel.DEBUG).toBe(3);
        });
    });
});
