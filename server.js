const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());

// Health check для Railway
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>✅ RYSMessenger Server</title>
      <style>
        body { font-family: Arial; padding: 40px; text-align: center; }
        .success { color: green; font-size: 24px; }
      </style>
    </head>
    <body>
      <div class="success">✅ RYSMessenger Server работает!</div>
      <p>WebSocket: wss://${req.headers.host}</p>
      <p>Для мессенджера используй этот URL</p>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    server: 'RYSMessenger',
    users: connectedUsers.size,
    timestamp: Date.now()
  });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Простейшее хранилище
const connectedUsers = new Map();

wss.on('connection', (ws, req) => {
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  console.log(`✅ Подключение: ${userId}`);
  connectedUsers.set(userId, ws);
  
  // Отправляем приветствие
  ws.send(JSON.stringify({
    type: 'welcome',
    userId: userId,
    online: connectedUsers.size
  }));
  
  // Обработка сообщений
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      
      // Пересылка сигналов WebRTC
      if (msg.type === 'signal' && msg.to && connectedUsers.has(msg.to)) {
        connectedUsers.get(msg.to).send(JSON.stringify({
          type: 'signal',
          from: userId,
          signal: msg.signal
        }));
      }
    } catch (error) {
      console.error('Ошибка:', error);
    }
  });
  
  // Очистка при отключении
  ws.on('close', () => {
    connectedUsers.delete(userId);
  });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 WebSocket: wss://localhost:${PORT}`);
});

// Логи каждые 5 минут для Railway
setInterval(() => {
  console.log(`[${new Date().toISOString()}] Активных: ${connectedUsers.size}`);
}, 300000);
