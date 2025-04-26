// server.js - WebSocket ������ ��� ������������� "�����" � Discord
const WebSocket = require('ws');

// ������� WebSocket ������ �� ����� 8080
const wss = new WebSocket.Server({ port: 8080 });

// ������ ������������ ��������
const clients = new Map();

// ��������� �����������
wss.on('connection', (ws) => {
    console.log('����� ����������� �����������');

    let userId = null;
    let serverId = null;

    // ��������� ��������� �� �������
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            // ��������� ���� ���������
            switch (data.type) {
                case 'connect':
                    // ��������� ���������� � ������������
                    userId = data.userId;
                    clients.set(userId, {
                        ws,
                        username: data.username,
                        avatarUrl: data.avatarUrl,
                        serverId: null
                    });
                    console.log(`������������ ${data.username} (${userId}) �����������`);
                    break;

                case 'serverChange':
                    // ��������� ���������� � ������� ������� ������������
                    serverId = data.serverId;
                    const client = clients.get(userId);
                    if (client) {
                        client.serverId = serverId;
                    }
                    console.log(`������������ ${userId} ������� �� ������ ${serverId}`);
                    break;

                case 'tip':
                    // ���������� ���������� � "����" ���� �������� �� ��� �� �������
                    console.log(`������������ ${data.fromUsername} �������� ${data.toUsername} �� ������� ${data.serverId}`);

                    // ���������� ���� �������������, ����������� �� ��� �� �������
                    clients.forEach((client, clientId) => {
                        // �� ���������� ��������� ������� �����������
                        if (clientId !== userId && client.serverId === data.serverId && client.ws.readyState === WebSocket.OPEN) {
                            client.ws.send(JSON.stringify(data));
                        }
                    });
                    break;

                default:
                    console.log(`�������� ����������� ��������� ���� ${data.type}`);
            }
        } catch (err) {
            console.error("������ ��� ��������� ���������:", err);
        }
    });

    // ��������� �������� ����������
    ws.on('close', () => {
        console.log(`���������� � ������������� ${userId} �������`);
        if (userId) {
            clients.delete(userId);
        }
    });

    // ��������� ������
    ws.on('error', (error) => {
        console.error(`������ ���������� ��� ������������ ${userId}:`, error);
        if (userId) {
            clients.delete(userId);
        }
    });
});

console.log('WebSocket ������ ������� �� ����� 8080');