// Canvas Related 
const { body } = document;
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
const socket = io('/pong');
let isReferee = false;
let paddleIndex = 0;

let width = 500;
let height = 700;

const gameOverEl = document.createElement('div');

// Paddle
let paddleHeight = 10;
let paddleWidth = 75;
let paddleDiff = 25;
let paddleX = [ 225, 225 ];
let trajectoryX = [ 0, 0 ];
let playerMoved = false;

// Ball
let ballX = 250;
let ballY = 350;
let ballRadius = 5;
let ballDirection = 1;

// Speed
let speedY = 2;
let speedX = 0;

// Score for Both Players
let score = [ 0, 0 ];
const winningScore = 10;
let isGameOver = false;

// Create Canvas Element
function createCanvas() {
  canvas.id = 'canvas';
  canvas.width = width;
  canvas.height = height;
  document.body.appendChild(canvas);
  renderCanvas();
}

// Wait for Opponents
function renderIntro() {
  // Canvas Background
  context.fillStyle = 'black';
  context.fillRect(0, 0, width, height);

  // Intro Text
  context.fillStyle = 'white';
  context.font = "32px Courier New";
  context.fillText("Waiting for opponent...", 20, (canvas.height / 2) - 30);
}

// Render Everything on Canvas
function renderCanvas() {
  // Canvas Background
  context.fillStyle = 'black';
  context.fillRect(0, 0, width, height);

  // Paddle Color
  context.fillStyle = 'white';

  // Bottom Paddle
  context.fillRect(paddleX[0], height - 20, paddleWidth, paddleHeight);

  // Top Paddle
  context.fillRect(paddleX[1], 10, paddleWidth, paddleHeight);

  // Dashed Center Line
  context.beginPath();
  context.setLineDash([4]);
  context.moveTo(0, 350);
  context.lineTo(500, 350);
  context.strokeStyle = 'grey';
  context.stroke();

  // Ball
  context.beginPath();
  context.arc(ballX, ballY, ballRadius, 2 * Math.PI, false);
  context.fillStyle = 'white';
  context.fill();

  // Score
  context.font = "32px Courier New";
  context.fillText(score[0], 20, (canvas.height / 2) + 50);
  context.fillText(score[1], 20, (canvas.height / 2) - 30);
}

// Reset Ball to Center
function ballReset() {
  ballX = width / 2;
  ballY = height / 2;
  speedY = 2;
  speedX = 0;
  //updateBallPosition to send ball position to other player
  socket.emit('ballMove', {
    ballX,
    ballY,
    score, 
 });
}

// Adjust Ball Movement
function ballMove() {
  // Vertical Speed
  ballY += speedY * ballDirection;
  // Horizontal Speed
  if (playerMoved) {
    ballX += speedX;
  }
  //updateBallPosition to send ball position to other player
  socket.emit('ballMove', {
     ballX,
     ballY,
     score, 
  });
}

// Determine What Ball Bounces Off, Score Points, Reset Ball
function ballBoundaries() {
  // Bounce off Left Wall
  if (ballX < 0 && speedX < 0) {
    speedX = -speedX;
  }
  // Bounce off Right Wall
  if (ballX > width && speedX > 0) {
    speedX = -speedX;
  }
  // Bounce off player1 paddle (bottom)
  if (ballY > height - paddleDiff) {
    if (ballX >= paddleX[0] && ballX <= paddleX[0] + paddleWidth) {
      // Add Speed on Hit
      if (playerMoved) {
        speedY += 1;
        // Max Speed
        if (speedY > 5) {
          speedY = 5;
        }
      }
      ballDirection = -ballDirection;
      trajectoryX[0] = ballX - (paddleX[0] + paddleDiff);
      speedX = trajectoryX[0] * 0.3;
    } else {
      // Reset Ball, add to Player1 Score
      ballReset();
      score[1]++;
    }
  }
  // Bounce off player2 paddle (top)
  if (ballY < paddleDiff) {
    if (ballX >= paddleX[1] && ballX <= paddleX[1] + paddleWidth) {
      // Add Speed on Hit
      if (playerMoved) {
        speedY += 1;
        // Max Speed
        if (speedY > 5) {
          speedY = 5;
        }
      }
      ballDirection = -ballDirection;
      trajectoryX[1] = ballX - (paddleX[1] + paddleDiff);
      speedX = trajectoryX[1] * 0.3;
    } else {
      // Reset Ball, add to Player2 Score
      ballReset();
      score[0]++;
    }
  }
}

// show game over element
function showGameOverEl(winner) {
  // Hide Canvas
  canvas.hidden = true;
  // Container
  gameOverEl.textContent = '';
  gameOverEl.classList.add('game-over-container');
  // Title
  const title = document.createElement('h1');
  title.textContent = `${winner} Wins!`;
  // Button
  const playAgainBtn = document.createElement('button');
  playAgainBtn.setAttribute('onclick', 'newGameRequest()');
  playAgainBtn.textContent = 'Play Again';
  // Append
  gameOverEl.append(title, playAgainBtn);
  body.appendChild(gameOverEl);
  //emit to other player the gameOverEl element
  socket.emit('gameOver', gameOverEl.outerHTML); 
}

//show newGame request element
function showNewGameRequestEl() {
  // Container
  gameOverEl.textContent = '';
  gameOverEl.classList.add('game-over-container');
  // Title
  const title = document.createElement('h1');
  title.textContent = 'Your opponent wants to play again !';
  // Button
  const playAgainBtn = document.createElement('button');
  playAgainBtn.setAttribute('onclick', 'acceptNewGame()');
  playAgainBtn.textContent = 'Accept';

  const declineBtn = document.createElement('button');
  declineBtn.setAttribute('onclick', 'declineNewGame()');
  declineBtn.textContent = 'Decline';
  // Append
  gameOverEl.append(title, playAgainBtn, declineBtn);
  body.appendChild(gameOverEl);
}

//show waiting element
function waitingElement() {
  // Container
  gameOverEl.textContent = '';
  gameOverEl.classList.add('game-over-container');
  // Title
  const title = document.createElement('h1');
  title.textContent = 'Waiting for opponent...';
  // Append
  gameOverEl.append(title);
  body.appendChild(gameOverEl);
}

// Check If One Player Has Winning Score, If They Do, End Game
function gameOver() {
  if (score[1] === winningScore || score[0] === winningScore) {
    isGameOver = true;
    // Set Winner
    const winner = score[1] === winningScore ? 'Player 1' : 'Player 2';
    showGameOverEl(winner);
  }
}

//emit to other player to request a new game
function newGameRequest() {
  waitingElement();
  socket.emit('newGameRequest');
}

//emit to other player to accept the new game request
function acceptNewGame() {
  body.removeChild(gameOverEl);
  canvas.hidden = false;
  isGameOver = false;
  score = [0, 0];
//emit to other player to restart the game
  socket.emit('newGameRestart');
}

//emit to other player to decline the new game request
function declineNewGame() {
  body.removeChild(gameOverEl);
  isGameOver = false;
  score = [0, 0];
  socket.emit('newGameDecline');
}

// Called Every Frame
function animate() {
  if(isReferee) {
    ballMove();
    ballBoundaries();
  }
  renderCanvas();
  gameOver();
  if(!isGameOver) {
   window.requestAnimationFrame(animate); 
  }
}

// Load Game, Reset Everything
function loadGame() {
  createCanvas();
  renderIntro();
  socket.emit('ready');
}

function startGame() {
  paddleIndex = isReferee ? 0 : 1;
  ballReset();
  window.requestAnimationFrame(animate);
  canvas.addEventListener('mousemove', (e) => {
    playerMoved = true;
    paddleX[paddleIndex] = e.offsetX;
    if (paddleX[paddleIndex] < 0) {
      paddleX[paddleIndex] = 0;
    }
    if (paddleX[paddleIndex] > (width - paddleWidth)) {
      paddleX[paddleIndex] = width - paddleWidth;
    }
    // Send Paddle Position to Server
    socket.emit('paddleMove', {
      xPosition: paddleX[paddleIndex],
    });
    // Hide Cursor
    canvas.style.cursor = 'none';
  });
}

// On Load
loadGame();

socket.on('connect', () => {
  console.log('Connected as ...', socket.id);
});

socket.on('startGame', (refereeId)=> {
  console.log('Referee is', refereeId);
  if(canvas.hidden) {
    body.removeChild(gameOverEl);
    canvas.hidden = false;
    isGameOver = false;
    score = [0, 0];
  }
  isReferee = socket.id === refereeId;
  // start Game
  startGame();
});

// Listen for Game Over Dom Element
socket.on('gameOver', (domElement) => {
  canvas.hidden = true;
  gameOverEl.innerHTML = domElement;
  body.appendChild(gameOverEl);
});

// Listen for New Game Request
socket.on('newGameRequest', () => {
  showNewGameRequestEl();
});

// Listen for Paddle Movement
socket.on('paddleMove', (paddleData) => {
  // toggle 1 into 0 and 0 into 1
  const opponentPaddleIndex = 1 - paddleIndex;
  paddleX[opponentPaddleIndex] = paddleData.xPosition;
});

// Listen for Ball Movement
socket.on('ballMove', (ballData) => {
  ({ballX, ballY, score} = ballData);
});
