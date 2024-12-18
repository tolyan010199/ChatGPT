document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    const isDashboard = window.location.pathname.includes("dashboard");
    const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
    });

    if (response.ok) {
        const { role } = await response.json();

        if (isDashboard && role !== "admin") {
            alert("У вас нет доступа к этой странице");
            window.location.href = "/login.html";
        } else if (!isDashboard && role !== "worker") {
            alert("У вас нет доступа к этой странице");
            window.location.href = "/login.html";
        }

        if (isDashboard) {
            setupAdminPage(token);
        } else {
            loadTasks(token);
        }
    } else {
        localStorage.removeItem("authToken");
        window.location.href = "/login.html";
    }
});

// Настройка страницы администратора
function setupAdminPage(token) {
    const addTaskForm = document.getElementById("add-task-form");

    if (addTaskForm) {
        addTaskForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = document.getElementById("task-name").value;
            const plan = document.getElementById("task-plan").value;

            if (!name || !plan) {
                alert("Пожалуйста, заполните все поля.");
                return;
            }

            try {
                const response = await fetch("/api/tasks", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({ name, plan }),
                });

                if (response.ok) {
                    alert("Задача добавлена успешно");
                    addTaskForm.reset();
                    loadTasks(token);
                } else {
                    const error = await response.json();
                    alert(`Ошибка: ${error.message}`);
                }
            } catch (err) {
                console.error("Ошибка при добавлении задачи:", err);
                alert("Не удалось добавить задачу. Попробуйте позже.");
            }
        });
    }

    loadTasks(token);
}

// Загрузка задач для всех
async function loadTasks(token) {
    try {
        const response = await fetch("/api/tasks", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const tasks = await response.json();
            renderTasks(tasks);
        } else {
            alert("Не удалось загрузить задачи.");
        }
    } catch (err) {
        console.error("Ошибка при загрузке задач:", err);
        alert("Произошла ошибка при загрузке задач.");
    }
}

// Отображение задач в таблице
function renderTasks(tasks) {
    const tasksTable = document.getElementById("tasks-table");
    tasksTable.innerHTML = ""; // Очистить таблицу перед обновлением

    if (tasks.length === 0) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="6">Нет задач для отображения</td>`;
        tasksTable.appendChild(row);
        return;
    }

    tasks.forEach((task) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${task.id}</td>
            <td>${task.name}</td>
            <td>${task.plan}</td>
            <td>${task.done}</td>
            <td>${task.plan - task.done}</td>
            <td>${task.status}</td>
        `;

        tasksTable.appendChild(row);
    });
}
