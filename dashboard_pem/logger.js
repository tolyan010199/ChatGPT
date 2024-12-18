const winston = require('winston');
const path = require('path');

// Создание директории для логов, если её нет
const logDir = path.join(__dirname, 'logs');
const fs = require('fs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Настройка логера
const logger = winston.createLogger({
    level: 'info', // Уровень логирования
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'server.log'),  // Лог для сервера
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
            ),
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'auth.log'),    // Лог для авторизации
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
            ),
        }),
    ],
});

// Экспортируем логгер, чтобы использовать его в других файлах
module.exports = logger;
