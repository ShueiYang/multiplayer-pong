
let readyPlayerCount = 0;

function listen(io) {
    //create namespace for pong
    const pongNamespace = io.of('/pong');
    pongNamespace.on('connection', (socket) => {
        console.log('A User connected', socket.id);
        let room;

        //listen when user is ready
        socket.on('ready', () => {
            //join room by pair
            room = 'room' + Math.floor(readyPlayerCount / 2);
            socket.join(room);
            console.log('Player ready', socket.id, room);
        
            readyPlayerCount++;
            //check if 2 players are ready
            if (readyPlayerCount % 2 === 0) {
                //broadcast('startGame');
                pongNamespace.in(room).emit('startGame', socket.id);
            }
        });
        //listen for restart a new game
        socket.on('newGameRestart', () => {
            pongNamespace.in(room).emit('startGame', socket.id);
        });
        //listen for game over Dom Element
        socket.on('gameOver', (domElement) => {
            socket.to(room).emit('gameOver', domElement);
        });
        //listen for new game request
        socket.on('newGameRequest', () => {
            socket.to(room).emit('newGameRequest');
        });
        //listen for decline new game request
        socket.on('newGameDecline', () => {
            socket.leave(room);
            console.log(`Client ${socket.id} leave room: ${room}`);
        });
        //listen for paddle move
        socket.on('paddleMove', (paddleData) => {
            socket.to(room).emit('paddleMove', paddleData);
        });
        //listen for ball move
        socket.on('ballMove', (ballData) => {
            socket.to(room).emit('ballMove', ballData);
        });
        //listen for disconnect
        socket.on('disconnect', (reason) => {
            console.log(`Client ${socket.id} disconnected: ${reason}`);
            socket.leave(room);
        });
    }); 
};

module.exports = {
    listen,
};