import { Logger, logger, LogLevel } from '../logger';

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleDebug = jest.spyOn(console, 'debug').mockImplementation();

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
        let testLogger: Logger;

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
            testLogger.info('Test info message', 'extra', 'args');
            expect(mockConsoleLog).toHaveBeenCalledWith('[INFO] Test info message', 'extra', 'args');
        });

        it('should log warn messages when level allows', () => {
            testLogger.warn('Test warn message', 'extra', 'args');
            expect(mockConsoleWarn).toHaveBeenCalledWith('[WARN] Test warn message', 'extra', 'args');
        });

        it('should log error messages when level allows', () => {
            testLogger.error('Test error message', 'extra', 'args');
            expect(mockConsoleError).toHaveBeenCalledWith('[ERROR] Test error message', 'extra', 'args');
        });

        it('should log debug messages when level allows', () => {
            // Create a logger with DEBUG level
            const debugLogger = new Logger({ level: LogLevel.DEBUG, enableConsole: true });
            debugLogger.debug('Test debug message', 'extra', 'args');
            // The logger uses console.debug internally
            expect(mockConsoleLog).toHaveBeenCalledWith('[DEBUG] Test debug message', 'extra', 'args');
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

            expect(mockConsoleLog).not.toHaveBeenCalledWith('[INFO] This should not log');
            expect(mockConsoleLog).not.toHaveBeenCalledWith('[DEBUG] This should not log');
            expect(mockConsoleWarn).toHaveBeenCalledWith('[WARN] This should log');
            expect(mockConsoleError).toHaveBeenCalledWith('[ERROR] This should log');
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

            expect(mockConsoleLog).not.toHaveBeenCalledWith('[INFO] This should not log');
            expect(mockConsoleWarn).not.toHaveBeenCalledWith('[WARN] This should not log');
            expect(mockConsoleError).toHaveBeenCalledWith('[ERROR] This should log');
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

            testLogger.info('This should log now');
            expect(mockConsoleLog).toHaveBeenCalledWith('[INFO] This should log now');
        });
    });

    describe('Default logger instance', () => {
        it('should be available and functional', () => {
            logger.info('Default logger test');
            expect(mockConsoleLog).toHaveBeenCalledWith('[INFO] Default logger test');
        });

        it('should have correct default configuration', () => {
            // Test that the default logger works
            logger.warn('Test warning');
            expect(mockConsoleWarn).toHaveBeenCalledWith('[WARN] Test warning');
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
