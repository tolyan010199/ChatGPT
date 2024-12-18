const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('./database.db');

// Создание пользователя "admin" с паролем "password"
const createAdmin = async () => {
    try {
        const hashedPassword = await bcrypt.hash('password', 10);
        db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, ['admin', hashedPassword, 'admin'], function (err) {
            if (err) {
                console.error('Ошибка при создании пользователя:', err.message);
            } else {
                console.log('Пользователь "admin" успешно добавлен.');
            }
        });
    } catch (err) {
        console.error('Ошибка при хэшировании пароля:', err.message);
    }
};

// Вызов функции
createAdmin();