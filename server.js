const http = require('http');
const io = require('socket.io');

const apiServer = require('./api');

const httpServer = http.createServer(apiServer);
const socketServer = io(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const sockets = require('./socket');
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

// Listen for socket connections
sockets.listen(socketServer);