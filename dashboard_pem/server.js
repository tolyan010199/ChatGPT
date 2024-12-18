const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;

// Настройки JWT
const SECRET_KEY = 'your_secret_key';

// Подключение к базе данных SQLite
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Подключено к базе данных SQLite.');
    }
});

// Создание таблиц
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            plan INTEGER NOT NULL,
            done INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'Не начато'
        )
    `);
});

// Middleware
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

// Авторизация
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err || !user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Неверные логин или пароль' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, role: user.role });
    });
});

// Middleware для проверки токена
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Проверка токена
app.post('/api/verify', authenticateToken, (req, res) => {
    res.json({ role: req.user.role });
});

// Получение списка задач
app.get('/api/tasks', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM tasks`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Добавление задачи (администратор)
app.post('/api/tasks', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Доступ запрещён' });
    }

    const { name, plan } = req.body;
    db.run(`INSERT INTO tasks (name, plan) VALUES (?, ?)`, [name, plan], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ id: this.lastID, message: 'Задача добавлена' });
        }
    });
});

// Обновление задачи
app.post('/api/tasks/update', authenticateToken, (req, res) => {
    const { id, done, status } = req.body;

    db.run(`UPDATE tasks SET done = ?, status = ? WHERE id = ?`, [done, status, id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ message: 'Задача не найдена' });
        } else {
            res.json({ message: 'Задача обновлена' });
        }
    });
});

// Получение списка пользователей (администратор)
app.get('/api/users', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Доступ запрещён' });
    }

    db.all(`SELECT id, username, role FROM users`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Добавление нового пользователя (администратор)
app.post('/api/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Доступ запрещён' });
    }

    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, [username, hashedPassword, role], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ id: this.lastID, message: 'Пользователь добавлен' });
        }
    });
});

// Удаление пользователя (администратор)
app.delete('/api/users/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Доступ запрещён' });
    }

    const { id } = req.params;
    db.run(`DELETE FROM users WHERE id = ?`, [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ message: 'Пользователь не найден' });
        } else {
            res.json({ message: 'Пользователь удалён' });
        }
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});