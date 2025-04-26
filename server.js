// server.js - WebSocket сервер для синхронизации "типов" в Discord
const WebSocket = require('ws');

// Создаем WebSocket сервер на порту 8080
const wss = new WebSocket.Server({ port: 8080 });

// Храним подключенных клиентов
const clients = new Map();

// Обработка подключений
wss.on('connection', (ws) => {
    console.log('Новое подключение установлено');

    let userId = null;
    let serverId = null;

    // Обработка сообщений от клиента
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            // Обработка типа сообщения
            switch (data.type) {
                case 'connect':
                    // Сохраняем информацию о пользователе
                    userId = data.userId;
                    clients.set(userId, {
                        ws,
                        username: data.username,
                        avatarUrl: data.avatarUrl,
                        serverId: null
                    });
                    console.log(`Пользователь ${data.username} (${userId}) подключился`);
                    break;

                case 'serverChange':
                    // Обновляем информацию о текущем сервере пользователя
                    serverId = data.serverId;
                    const client = clients.get(userId);
                    if (client) {
                        client.serverId = serverId;
                    }
                    console.log(`Пользователь ${userId} перешел на сервер ${serverId}`);
                    break;

                case 'tip':
                    // Пересылаем информацию о "типе" всем клиентам на том же сервере
                    console.log(`Пользователь ${data.fromUsername} похвалил ${data.toUsername} на сервере ${data.serverId}`);

                    // Отправляем всем пользователям, находящимся на том же сервере
                    clients.forEach((client, clientId) => {
                        // Не отправляем сообщение обратно отправителю
                        if (clientId !== userId && client.serverId === data.serverId && client.ws.readyState === WebSocket.OPEN) {
                            client.ws.send(JSON.stringify(data));
                        }
                    });
                    break;

                default:
                    console.log(`Получено неизвестное сообщение типа ${data.type}`);
            }
        } catch (err) {
            console.error("Ошибка при обработке сообщения:", err);
        }
    });

    // Обработка закрытия соединения
    ws.on('close', () => {
        console.log(`Соединение с пользователем ${userId} закрыто`);
        if (userId) {
            clients.delete(userId);
        }
    });

    // Обработка ошибок
    ws.on('error', (error) => {
        console.error(`Ошибка соединения для пользователя ${userId}:`, error);
        if (userId) {
            clients.delete(userId);
        }
    });
});

console.log('WebSocket сервер запущен на порту 8080');