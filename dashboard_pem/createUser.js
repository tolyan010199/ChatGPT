const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('./database.db');

// Создание пользователя "user" с паролем "password"
const createAdmin = async () => {
    try {
        const hashedPassword = await bcrypt.hash('password', 10);
        db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, ['user1', hashedPassword, 'worker'], function (err) {
            if (err) {
                console.error('Ошибка при создании пользователя:', err.message);
            } else {
                console.log('Пользователь "user1" успешно добавлен.');
            }
        });
    } catch (err) {
        console.error('Ошибка при хэшировании пароля:', err.message);
    }
};

// Вызов функции
createAdmin();