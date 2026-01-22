// Game Manager untuk mengatur semua game
class GameManager {
    constructor() {
        this.currentGame = null;
        this.games = {};
        this.init();
    }

    init() {
        this.setupGameFiltering();
        this.initializeGames();
        this.preventSpaceScroll();
    }

    setupGameFiltering() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const gameSections = document.querySelectorAll('.game-section');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                const filter = button.dataset.filter;
                
                // Filter game sections
                gameSections.forEach(section => {
                    if (filter === 'all' || section.dataset.category.includes(filter)) {
                        section.style.display = 'block';
                        setTimeout(() => {
                            section.style.opacity = '1';
                            section.style.transform = 'translateY(0)';
                        }, 10);
                    } else {
                        section.style.opacity = '0';
                        section.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            section.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }

    initializeGames() {
        // Initialize RPS Game
        if (document.getElementById('rps')) {
            this.games.rps = new RPSGame();
        }
        
        // Initialize Tic Tac Toe Game
        if (document.getElementById('ttt')) {
            this.games.ttt = new TicTacToeGame();
        }
        
        // Initialize Snake Game
        if (document.getElementById('snakeCanvas')) {
            this.games.snake = new SnakeGame();
        }
        
        // Initialize Memory Game
        if (document.getElementById('memoryBoard')) {
            this.games.memory = new MemoryGame();
        }
        
        // Add animation to game sections
        const gameSections = document.querySelectorAll('.game-section');
        gameSections.forEach((section, index) => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            setTimeout(() => {
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }, 100 + index * 100);
        });
    }

    preventSpaceScroll() {
        // Prevent spacebar from scrolling the page
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target === document.body) {
                e.preventDefault();
            }
        });
    }
}

// Rock Paper Scissors Game dengan Multiplayer
class RPSGame {
    constructor() {
        this.player1Score = 0;
        this.player2Score = 0;
        this.gameActive = true;
        this.currentPlayer = 1;
        this.gameMode = 'ai'; // 'ai', 'local', 'online'
        this.player1Choice = null;
        this.player2Choice = null;
        this.roomCode = null;
        this.players = {};
        this.init();
    }

    init() {
        this.choiceButtons = document.querySelectorAll('.choice-btn');
        this.player1ScoreEl = document.getElementById('playerScore');
        this.player2ScoreEl = document.getElementById('computerScore');
        this.player1ChoiceIcon = document.getElementById('playerChoiceIcon');
        this.player2ChoiceIcon = document.getElementById('computerChoiceIcon');
        this.resultMessage = document.getElementById('resultMessage');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.resetGameBtn = document.getElementById('resetGameBtn');
        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.roomCodeDisplay = document.getElementById('roomCodeDisplay');
        this.roomCodeInput = document.getElementById('roomCodeInput');
        this.joinRoomBtn = document.getElementById('joinRoomBtn');
        this.createRoomBtn = document.getElementById('createRoomBtn');
        this.roomSection = document.getElementById('roomSection');
        this.gameStatusDisplay = document.getElementById('gameStatus');
        this.player1Label = document.querySelector('.player1-label');
        this.player2Label = document.querySelector('.player2-label');

        this.setupEventListeners();
        this.updateScores();
        this.updateGameStatus();
    }

    setupEventListeners() {
        // Choice buttons
        this.choiceButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                if (!this.gameActive) return;
                
                const choice = e.currentTarget.dataset.choice;
                this.makeChoice(choice);
            });
        });

        // Game control buttons
        this.playAgainBtn.addEventListener('click', () => {
            this.resetRound();
        });

        this.resetGameBtn.addEventListener('click', () => {
            this.resetGame();
        });

        // Mode selection buttons
        this.modeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.changeMode(e.currentTarget.dataset.mode);
            });
        });

        // Room management buttons
        if (this.createRoomBtn) {
            this.createRoomBtn.addEventListener('click', () => {
                this.createRoom();
            });
        }

        if (this.joinRoomBtn) {
            this.joinRoomBtn.addEventListener('click', () => {
                this.joinRoom();
            });
        }
    }

    changeMode(mode) {
        this.gameMode = mode;
        this.resetGame();
        
        // Update UI based on mode
        this.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Show/hide room section for online mode
        if (this.roomSection) {
            this.roomSection.style.display = mode === 'online' ? 'block' : 'none';
        }

        // Update score labels based on mode
        if (mode === 'ai') {
            this.player1Label.textContent = 'Player';
            this.player2Label.textContent = 'Computer';
        } else {
            this.player1Label.textContent = 'Player 1';
            this.player2Label.textContent = 'Player 2';
        }

        this.updateGameStatus();
    }

    createRoom() {
        // Generate random room code
        this.roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Update URL with room code
        const newUrl = window.location.origin + window.location.pathname + '?room=' + this.roomCode;
        window.history.pushState({}, '', newUrl);
        
        // Display room code
        if (this.roomCodeDisplay) {
            this.roomCodeDisplay.textContent = `Room Code: ${this.roomCode}`;
            this.roomCodeDisplay.style.display = 'block';
        }

        // Initialize room with player 1
        this.players = {
            player1: { id: 'player1', name: 'Player 1', choice: null },
            player2: null
        };

        this.gameMode = 'online';
        this.updateGameStatus();
        this.showNotification('Room created! Waiting for Player 2...');
        
        // Simulate player 2 joining (for demo)
        setTimeout(() => {
            this.simulatePlayer2Join();
        }, 2000);
    }

    simulatePlayer2Join() {
        if (this.roomCode && !this.players.player2) {
            this.players.player2 = { id: 'player2', name: 'Player 2', choice: null };
            this.updateGameStatus();
            this.showNotification('Player 2 has joined the room!');
        }
    }

    joinRoom(code = null) {
        const roomCode = code || this.roomCodeInput.value;
        if (!roomCode) {
            this.showNotification('Please enter a room code!');
            return;
        }

        this.roomCode = roomCode.toUpperCase();
        
        // Update URL with room code
        const newUrl = window.location.origin + window.location.pathname + '?room=' + this.roomCode;
        window.history.pushState({}, '', newUrl);
        
        // Display room code
        if (this.roomCodeDisplay) {
            this.roomCodeDisplay.textContent = `Room Code: ${this.roomCode}`;
            this.roomCodeDisplay.style.display = 'block';
        }

        // Join as player 2
        this.players = {
            player1: { id: 'player1', name: 'Player 1', choice: null },
            player2: { id: 'player2', name: 'Player 2', choice: null }
        };

        this.gameMode = 'online';
        this.updateGameStatus();
        this.showNotification('Joined room as Player 2!');
    }

    makeChoice(choice) {
        if (!this.gameActive) return;

        if (this.gameMode === 'ai') {
            this.playAgainstAI(choice);
        } else if (this.gameMode === 'local') {
            this.playLocalMultiplayer(choice);
        } else if (this.gameMode === 'online') {
            this.playOnlineMultiplayer(choice);
        }
    }

    playAgainstAI(playerChoice) {
        // Computer's random choice
        const choices = ['rock', 'paper', 'scissors'];
        const computerChoice = choices[Math.floor(Math.random() * 3)];
        
        // Update UI
        this.updateChoiceIcons(playerChoice, computerChoice);
        
        // Determine winner
        const result = this.getRoundResult(playerChoice, computerChoice);
        
        // Update scores
        this.updateScores(result, 'ai');
        
        // Display result
        this.displayResult(result, playerChoice, computerChoice);
        
        // Check for game winner
        this.checkGameEnd();
    }

    playLocalMultiplayer(choice) {
        if (this.currentPlayer === 1) {
            this.player1Choice = choice;
            this.currentPlayer = 2;
            this.updateChoiceIcons(choice, null);
            this.updateGameStatus();
            this.disableChoices();
            
            // Re-enable choices for player 2 after a delay
            setTimeout(() => {
                this.enableChoices();
                this.showNotification('Player 2\'s turn!');
            }, 500);
        } else {
            this.player2Choice = choice;
            const result = this.getRoundResult(this.player1Choice, choice);
            this.updateScores(result, 'local');
            this.updateChoiceIcons(this.player1Choice, choice);
            this.displayResult(result, this.player1Choice, choice);
            this.checkGameEnd();
            
            // Reset for next round
            this.currentPlayer = 1;
            this.player1Choice = null;
            this.player2Choice = null;
            this.updateGameStatus();
        }
    }

    playOnlineMultiplayer(choice) {
        const playerId = this.isPlayer1() ? 'player1' : 'player2';
        this.players[playerId].choice = choice;
        
        // Update UI
        if (playerId === 'player1') {
            this.player1ChoiceIcon.innerHTML = this.getChoiceIcon(choice);
        } else {
            this.player2ChoiceIcon.innerHTML = this.getChoiceIcon(choice);
        }

        this.updateGameStatus();
        
        // Check if both players have chosen
        if (this.players.player1.choice && this.players.player2.choice) {
            setTimeout(() => {
                this.resolveOnlineRound();
            }, 1000);
        } else {
            // Disable choices while waiting
            this.disableChoices();
            setTimeout(() => {
                if (this.gameActive) {
                    this.enableChoices();
                }
            }, 1000);
        }
    }

    resolveOnlineRound() {
        const result = this.getRoundResult(
            this.players.player1.choice,
            this.players.player2.choice
        );
        
        this.updateScores(result, 'online');
        this.displayResult(
            result,
            this.players.player1.choice,
            this.players.player2.choice
        );
        
        this.checkGameEnd();
        
        // Reset choices for next round
        this.players.player1.choice = null;
        this.players.player2.choice = null;
        this.updateGameStatus();
        this.enableChoices();
    }

    getRoundResult(choice1, choice2) {
        if (choice1 === choice2) return 'draw';
        
        const winConditions = {
            'rock': 'scissors',
            'paper': 'rock',
            'scissors': 'paper'
        };
        
        return winConditions[choice1] === choice2 ? 'player1' : 'player2';
    }

    updateChoiceIcons(choice1, choice2) {
        this.player1ChoiceIcon.innerHTML = this.getChoiceIcon(choice1);
        this.player2ChoiceIcon.innerHTML = this.getChoiceIcon(choice2);
    }

    getChoiceIcon(choice) {
        if (!choice) return '<i class="fas fa-question"></i>';
        
        const iconMap = {
            'rock': 'fa-hand-rock',
            'paper': 'fa-hand-paper',
            'scissors': 'fa-hand-scissors'
        };
        
        return `<i class="fas ${iconMap[choice]}"></i>`;
    }

    updateScores(result, mode) {
        if (result === 'player1') {
            this.player1Score++;
        } else if (result === 'player2') {
            this.player2Score++;
        }
        
        this.player1ScoreEl.textContent = this.player1Score;
        this.player2ScoreEl.textContent = this.player2Score;
    }

    displayResult(result, choice1, choice2) {
        let message = '';
        
        if (this.gameMode === 'ai') {
            if (result === 'player1') {
                message = `You win! ${this.capitalize(choice1)} beats ${choice2}`;
            } else if (result === 'player2') {
                message = `You lose! ${this.capitalize(choice2)} beats ${choice1}`;
            } else {
                message = `It's a draw! Both chose ${choice1}`;
            }
        } else {
            if (result === 'player1') {
                message = `Player 1 wins! ${this.capitalize(choice1)} beats ${choice2}`;
            } else if (result === 'player2') {
                message = `Player 2 wins! ${this.capitalize(choice2)} beats ${choice1}`;
            } else {
                message = `It's a draw! Both chose ${choice1}`;
            }
        }
        
        this.resultMessage.innerHTML = `<p>${message}</p>`;
        
        // Add color based on result
        this.resultMessage.style.color = result === 'player1' ? 'var(--success-color)' :
                                        result === 'player2' ? 'var(--danger-color)' :
                                        'var(--warning-color)';
    }

    checkGameEnd() {
        if (this.player1Score >= 5 || this.player2Score >= 5) {
            this.gameActive = false;
            const winner = this.player1Score > this.player2Score ? 
                         (this.gameMode === 'ai' ? 'You' : 'Player 1') : 
                         (this.gameMode === 'ai' ? 'Computer' : 'Player 2');
            
            this.resultMessage.innerHTML = `<p><strong>${winner} wins the match!</strong></p>`;
            this.playAgainBtn.style.display = 'inline-flex';
            
            this.disableChoices();
        }
    }

    resetRound() {
        this.gameActive = true;
        this.currentPlayer = 1;
        this.player1Choice = null;
        this.player2Choice = null;
        if (this.players.player1) this.players.player1.choice = null;
        if (this.players.player2) this.players.player2.choice = null;
        
        this.player1ChoiceIcon.innerHTML = '<i class="fas fa-question"></i>';
        this.player2ChoiceIcon.innerHTML = '<i class="fas fa-question"></i>';
        this.resultMessage.innerHTML = '<p>Make your move to start the game!</p>';
        this.resultMessage.style.color = 'var(--text-color)';
        this.playAgainBtn.style.display = 'none';
        
        this.enableChoices();
        this.updateGameStatus();
    }

    resetGame() {
        this.player1Score = 0;
        this.player2Score = 0;
        this.gameActive = true;
        this.currentPlayer = 1;
        this.player1Choice = null;
        this.player2Choice = null;
        this.roomCode = null;
        
        if (this.roomCodeDisplay) {
            this.roomCodeDisplay.style.display = 'none';
        }
        
        this.updateScores();
        this.resetRound();
    }

    updateGameStatus() {
        if (!this.gameStatusDisplay) return;
        
        let status = '';
        
        if (this.gameMode === 'ai') {
            status = 'Playing against Computer - Your turn!';
        } else if (this.gameMode === 'local') {
            status = `Player ${this.currentPlayer}'s turn`;
        } else if (this.gameMode === 'online') {
            if (!this.players.player2) {
                status = 'Waiting for Player 2 to join...';
            } else if (this.players.player1.choice && this.players.player2.choice) {
                status = 'Both players chosen - determining winner...';
            } else if (this.players.player1.choice) {
                status = 'Player 1 has chosen, waiting for Player 2...';
            } else if (this.players.player2.choice) {
                status = 'Player 2 has chosen, waiting for Player 1...';
            } else {
                status = this.isPlayer1() ? 'Online - Your turn!' : 'Online - Waiting for Player 1...';
            }
        }
        
        this.gameStatusDisplay.textContent = status;
    }

    disableChoices() {
        this.choiceButtons.forEach(button => {
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
        });
    }

    enableChoices() {
        this.choiceButtons.forEach(button => {
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
        });
    }

    isPlayer1() {
        // In a real implementation, this would check server-side info
        // For demo, we'll assume the creator is player 1
        return !this.players.player2 || this.players.player1;
    }

    showNotification(message) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: var(--gradient);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Tic Tac Toe Game yang berfungsi
class TicTacToeGame {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.gameMode = 'ai'; // 'ai' or '2player'
        this.scores = { X: 0, O: 0, draws: 0 };
        this.init();
    }

    init() {
        this.boardElement = document.getElementById('tttBoard');
        this.currentPlayerEl = document.getElementById('currentPlayer');
        this.gameStatusEl = document.getElementById('tttStatus');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.switchModeBtn = document.getElementById('switchModeBtn');
        this.playerXScore = document.getElementById('playerXScore');
        this.playerOScore = document.getElementById('playerOScore');
        this.drawsScore = document.getElementById('drawsScore');

        this.setupEventListeners();
        this.createBoard();
        this.updateDisplay();
        this.updateScores();
    }

    setupEventListeners() {
        this.newGameBtn.addEventListener('click', () => {
            this.resetGame();
        });

        this.switchModeBtn.addEventListener('click', () => {
            this.toggleGameMode();
        });

        // Prevent spacebar from scrolling
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });
    }

    createBoard() {
        this.boardElement.innerHTML = '';
        
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'ttt-cell';
            cell.dataset.index = i;
            cell.addEventListener('click', () => this.makeMove(i));
            this.boardElement.appendChild(cell);
        }
    }

    makeMove(index) {
        if (!this.gameActive || this.board[index] !== '') return;
        
        // Human player's move
        this.board[index] = this.currentPlayer;
        this.updateBoard();
        
        // Check for win or draw
        if (this.checkWin()) {
            this.scores[this.currentPlayer]++;
            this.endGame(`${this.currentPlayer} wins!`);
            this.updateScores();
            return;
        }
        
        if (this.checkDraw()) {
            this.scores.draws++;
            this.endGame("It's a draw!");
            this.updateScores();
            return;
        }
        
        // Switch player
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updateDisplay();
        
        // AI's move if in AI mode
        if (this.gameMode === 'ai' && this.currentPlayer === 'O' && this.gameActive) {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    makeAIMove() {
        // Simple AI logic
        const availableMoves = this.board
            .map((cell, index) => cell === '' ? index : null)
            .filter(index => index !== null);
        
        if (availableMoves.length === 0) return;
        
        // Try to win if possible
        let moveIndex = this.findWinningMove('O');
        
        // Block player's winning move
        if (moveIndex === -1) {
            moveIndex = this.findWinningMove('X');
        }
        
        // Take center if available
        if (moveIndex === -1 && this.board[4] === '') {
            moveIndex = 4;
        }
        
        // Take corners
        if (moveIndex === -1) {
            const corners = [0, 2, 6, 8];
            const availableCorners = corners.filter(index => this.board[index] === '');
            if (availableCorners.length > 0) {
                moveIndex = availableCorners[Math.floor(Math.random() * availableCorners.length)];
            }
        }
        
        // Take any available move
        if (moveIndex === -1) {
            moveIndex = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }
        
        this.board[moveIndex] = 'O';
        this.updateBoard();
        
        if (this.checkWin()) {
            this.scores.O++;
            this.endGame("Computer wins!");
            this.updateScores();
            return;
        }
        
        if (this.checkDraw()) {
            this.scores.draws++;
            this.endGame("It's a draw!");
            this.updateScores();
            return;
        }
        
        this.currentPlayer = 'X';
        this.updateDisplay();
    }

    findWinningMove(player) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            const cells = [this.board[a], this.board[b], this.board[c]];
            
            // Count empty cells and player marks
            const emptyCount = cells.filter(cell => cell === '').length;
            const playerCount = cells.filter(cell => cell === player).length;
            
            // If there's one empty cell and two player marks, this is a winning move
            if (emptyCount === 1 && playerCount === 2) {
                // Return the index of the empty cell
                if (this.board[a] === '') return a;
                if (this.board[b] === '') return b;
                if (this.board[c] === '') return c;
            }
        }
        
        return -1;
    }

    updateBoard() {
        const cells = document.querySelectorAll('.ttt-cell');
        cells.forEach((cell, index) => {
            cell.textContent = this.board[index];
            cell.className = `ttt-cell ${this.board[index].toLowerCase()}`;
            cell.style.cursor = this.board[index] === '' && this.gameActive ? 'pointer' : 'default';
        });
    }

    updateDisplay() {
        this.currentPlayerEl.textContent = this.currentPlayer;
        this.currentPlayerEl.style.background = this.currentPlayer === 'X' 
            ? 'var(--primary-color)' 
            : 'var(--accent-color)';
    }

    updateScores() {
        this.playerXScore.textContent = this.scores.X;
        this.playerOScore.textContent = this.scores.O;
        this.drawsScore.textContent = this.scores.draws;
    }

    checkWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        return winPatterns.some(pattern => {
            const [a, b, c] = pattern;
            return this.board[a] && 
                   this.board[a] === this.board[b] && 
                   this.board[a] === this.board[c];
        });
    }

    checkDraw() {
        return this.board.every(cell => cell !== '');
    }

    endGame(message) {
        this.gameActive = false;
        this.gameStatusEl.textContent = message;
        this.gameStatusEl.style.color = message.includes('wins') 
            ? (message.includes('X') ? 'var(--primary-color)' : 'var(--accent-color)')
            : 'var(--warning-color)';
            
        // Highlight winning cells
        this.highlightWinningCells();
    }

    highlightWinningCells() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        const winningPattern = winPatterns.find(pattern => {
            const [a, b, c] = pattern;
            return this.board[a] && 
                   this.board[a] === this.board[b] && 
                   this.board[a] === this.board[c];
        });

        if (winningPattern) {
            winningPattern.forEach(index => {
                const cell = this.boardElement.children[index];
                cell.classList.add('winner');
            });
        }
    }

    resetGame() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.gameStatusEl.textContent = 'Game in progress';
        this.gameStatusEl.style.color = 'var(--primary-color)';
        this.updateBoard();
        this.updateDisplay();
        
        // Reset cell classes
        const cells = document.querySelectorAll('.ttt-cell');
        cells.forEach(cell => {
            cell.classList.remove('winner');
        });
    }

    toggleGameMode() {
        this.gameMode = this.gameMode === 'ai' ? '2player' : 'ai';
        this.switchModeBtn.innerHTML = this.gameMode === 'ai' 
            ? '<i class="fas fa-robot"></i> Switch to 2 Player'
            : '<i class="fas fa-user-friends"></i> Switch to vs AI';
        this.resetGame();
    }
}

// Snake Game dengan scroll prevention
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('snakeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('snakeScore');
        this.highScoreElement = document.getElementById('snakeHighScore');
        this.startBtn = document.getElementById('snakeStartBtn');
        this.pauseBtn = document.getElementById('snakePauseBtn');
        this.resetBtn = document.getElementById('snakeResetBtn');
        this.controlButtons = document.querySelectorAll('.snake-btn');
        
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        this.snake = [];
        this.food = {};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameRunning = false;
        this.gameLoop = null;
        
        this.init();
    }

    init() {
        // Initialize game state
        this.resetGame();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update high score display
        this.highScoreElement.textContent = this.highScore;
        
        // Draw initial state
        this.draw();
    }

    setupEventListeners() {
        // Control buttons
        this.startBtn.addEventListener('click', () => this.toggleGame());
        this.pauseBtn.addEventListener('click', () => this.pauseGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        
        // Control buttons for mobile
        this.controlButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                if (!this.gameRunning) return;
                
                const direction = e.currentTarget.dataset.direction;
                this.handleDirectionChange(direction);
            });
        });
        
        // Keyboard controls with scroll prevention
        document.addEventListener('keydown', (e) => {
            // Prevent default behavior for arrow keys and space
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' '].includes(e.key)) {
                e.preventDefault();
            }
            
            if (!this.gameRunning) return;
            
            this.handleKeyPress(e.key);
        });
    }

    handleKeyPress(key) {
        switch(key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (this.dy !== 1) {
                    this.dx = 0;
                    this.dy = -1;
                }
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (this.dy !== -1) {
                    this.dx = 0;
                    this.dy = 1;
                }
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (this.dx !== 1) {
                    this.dx = -1;
                    this.dy = 0;
                }
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (this.dx !== -1) {
                    this.dx = 1;
                    this.dy = 0;
                }
                break;
            case ' ':
            case 'Space':
                this.pauseGame();
                break;
        }
    }

    handleDirectionChange(direction) {
        if (!this.gameRunning) return;
        
        switch(direction) {
            case 'up':
                if (this.dy !== 1) {
                    this.dx = 0;
                    this.dy = -1;
                }
                break;
            case 'down':
                if (this.dy !== -1) {
                    this.dx = 0;
                    this.dy = 1;
                }
                break;
            case 'left':
                if (this.dx !== 1) {
                    this.dx = -1;
                    this.dy = 0;
                }
                break;
            case 'right':
                if (this.dx !== -1) {
                    this.dx = 1;
                    this.dy = 0;
                }
                break;
        }
    }

    resetGame() {
        // Stop current game loop
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        
        // Reset snake
        this.snake = [
            { x: 10, y: 10 }
        ];
        
        // Generate first food
        this.generateFood();
        
        // Reset direction
        this.dx = 0;
        this.dy = 0;
        
        // Reset score
        this.score = 0;
        this.scoreElement.textContent = this.score;
        
        // Update button states
        this.startBtn.innerHTML = '<i class="fas fa-play"></i> Start Game';
        this.pauseBtn.disabled = true;
        this.gameRunning = false;
        
        // Draw initial state
        this.draw();
    }

    toggleGame() {
        if (this.gameRunning) {
            this.pauseGame();
        } else {
            this.startGame();
        }
    }

    startGame() {
        if (this.gameRunning) return;
        
        // Start the game if not already moving
        if (this.dx === 0 && this.dy === 0) {
            this.dx = 1; // Start moving right
        }
        
        this.gameRunning = true;
        this.startBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        this.pauseBtn.disabled = false;
        
        // Start game loop
        this.gameLoop = setInterval(() => this.update(), 150);
    }

    pauseGame() {
        if (!this.gameRunning) return;
        
        this.gameRunning = false;
        clearInterval(this.gameLoop);
        this.gameLoop = null;
        
        this.startBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
    }

    update() {
        if (!this.gameRunning) return;
        
        // Move snake
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || 
            head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // Check self collision
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }
        
        // Add new head
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            // Increase score
            this.score += 10;
            this.scoreElement.textContent = this.score;
            
            // Update high score
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.highScoreElement.textContent = this.highScore;
                localStorage.setItem('snakeHighScore', this.highScore);
            }
            
            // Generate new food
            this.generateFood();
        } else {
            // Remove tail if no food eaten
            this.snake.pop();
        }
        
        // Draw updated game state
        this.draw();
    }

    generateFood() {
        let foodOnSnake;
        do {
            foodOnSnake = false;
            this.food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
            
            // Check if food is on snake
            for (let segment of this.snake) {
                if (this.food.x === segment.x && this.food.y === segment.y) {
                    foodOnSnake = true;
                    break;
                }
            }
        } while (foodOnSnake);
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = '#16213e';
        this.ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Draw snake
        this.snake.forEach((segment, index) => {
            // Gradient for snake (head is brighter)
            const gradient = this.ctx.createLinearGradient(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                (segment.x + 1) * this.gridSize,
                (segment.y + 1) * this.gridSize
            );
            
            if (index === 0) {
                // Head
                gradient.addColorStop(0, '#00b894');
                gradient.addColorStop(1, '#00a085');
            } else {
                // Body
                gradient.addColorStop(0, '#00a085');
                gradient.addColorStop(1, '#008b74');
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 1,
                this.gridSize - 1
            );
            
            // Snake eyes on head
            if (index === 0) {
                this.ctx.fillStyle = 'white';
                const eyeSize = this.gridSize / 5;
                
                // Draw eyes based on direction
                if (this.dx === 1) { // Right
                    this.ctx.fillRect(
                        segment.x * this.gridSize + this.gridSize - eyeSize * 2,
                        segment.y * this.gridSize + eyeSize * 1.5,
                        eyeSize, eyeSize
                    );
                    this.ctx.fillRect(
                        segment.x * this.gridSize + this.gridSize - eyeSize * 2,
                        segment.y * this.gridSize + this.gridSize - eyeSize * 2.5,
                        eyeSize, eyeSize
                    );
                } else if (this.dx === -1) { // Left
                    this.ctx.fillRect(
                        segment.x * this.gridSize + eyeSize,
                        segment.y * this.gridSize + eyeSize * 1.5,
                        eyeSize, eyeSize
                    );
                    this.ctx.fillRect(
                        segment.x * this.gridSize + eyeSize,
                        segment.y * this.gridSize + this.gridSize - eyeSize * 2.5,
                        eyeSize, eyeSize
                    );
                } else if (this.dy === 1) { // Down
                    this.ctx.fillRect(
                        segment.x * this.gridSize + eyeSize * 1.5,
                        segment.y * this.gridSize + this.gridSize - eyeSize * 2,
                        eyeSize, eyeSize
                    );
                    this.ctx.fillRect(
                        segment.x * this.gridSize + this.gridSize - eyeSize * 2.5,
                        segment.y * this.gridSize + this.gridSize - eyeSize * 2,
                        eyeSize, eyeSize
                    );
                } else if (this.dy === -1) { // Up
                    this.ctx.fillRect(
                        segment.x * this.gridSize + eyeSize * 1.5,
                        segment.y * this.gridSize + eyeSize,
                        eyeSize, eyeSize
                    );
                    this.ctx.fillRect(
                        segment.x * this.gridSize + this.gridSize - eyeSize * 2.5,
                        segment.y * this.gridSize + eyeSize,
                        eyeSize, eyeSize
                    );
                }
            }
        });
        
        // Draw food
        this.ctx.fillStyle = '#fd79a8';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw food shine
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 3,
            this.food.y * this.gridSize + this.gridSize / 3,
            this.gridSize / 8,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    gameOver() {
        this.gameRunning = false;
        clearInterval(this.gameLoop);
        this.gameLoop = null;
        
        this.startBtn.innerHTML = '<i class="fas fa-play"></i> Start Game';
        this.pauseBtn.disabled = true;
        
        // Show game over message
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 30px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        this.ctx.font = '20px Poppins';
        this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
}

// Memory Game
class MemoryGame {
    constructor() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedCards = [];
        this.gameActive = false;
        this.moves = 0;
        this.time = 0;
        this.timer = null;
        
        this.init();
    }

    init() {
        this.boardElement = document.getElementById('memoryBoard');
        this.movesElement = document.getElementById('memoryMoves');
        this.timeElement = document.getElementById('memoryTime');
        this.startBtn = document.getElementById('memoryStartBtn');
        this.resetBtn = document.getElementById('memoryResetBtn');
        
        this.setupEventListeners();
        this.createCards();
        this.renderBoard();
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
    }

    createCards() {
        const symbols = ['🍎', '🍌', '🍒', '🍇', '🍊', '🍓', '🍉', '🥭'];
        this.cards = [...symbols, ...symbols]
            .map((symbol, index) => ({
                id: index,
                symbol: symbol,
                flipped: false,
                matched: false
            }))
            .sort(() => Math.random() - 0.5);
    }

    renderBoard() {
        this.boardElement.innerHTML = '';
        
        this.cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'memory-card';
            cardElement.dataset.id = card.id;
            
            if (card.flipped || card.matched) {
                cardElement.classList.add('flipped');
                cardElement.textContent = card.symbol;
            }
            
            if (card.matched) {
                cardElement.classList.add('matched');
            }
            
            cardElement.addEventListener('click', () => this.flipCard(card.id));
            this.boardElement.appendChild(cardElement);
        });
    }

    startGame() {
        if (this.gameActive) return;
        
        this.gameActive = true;
        this.moves = 0;
        this.time = 0;
        this.flippedCards = [];
        this.matchedCards = [];
        
        // Reset all cards
        this.cards.forEach(card => {
            card.flipped = false;
            card.matched = false;
        });
        
        this.updateDisplay();
        this.renderBoard();
        
        // Start timer
        this.timer = setInterval(() => {
            this.time++;
            this.updateDisplay();
        }, 1000);
        
        this.startBtn.disabled = true;
    }

    resetGame() {
        this.gameActive = false;
        clearInterval(this.timer);
        
        this.createCards();
        this.renderBoard();
        this.updateDisplay();
        
        this.startBtn.disabled = false;
    }

    flipCard(cardId) {
        if (!this.gameActive) return;
        
        const card = this.cards.find(c => c.id === cardId);
        
        // Don't flip if card is already flipped or matched
        if (card.flipped || card.matched || this.flippedCards.length >= 2) {
            return;
        }
        
        // Flip the card
        card.flipped = true;
        this.flippedCards.push(card);
        
        this.renderBoard();
        this.moves++;
        this.updateDisplay();
        
        // Check for match if two cards are flipped
        if (this.flippedCards.length === 2) {
            setTimeout(() => this.checkMatch(), 500);
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        
        if (card1.symbol === card2.symbol) {
            // Match found
            card1.matched = true;
            card2.matched = true;
            this.matchedCards.push(card1, card2);
            
            // Check for game completion
            if (this.matchedCards.length === this.cards.length) {
                this.endGame();
            }
        } else {
            // No match, flip cards back
            card1.flipped = false;
            card2.flipped = false;
        }
        
        this.flippedCards = [];
        this.renderBoard();
    }

    updateDisplay() {
        this.movesElement.textContent = this.moves;
        
        const minutes = Math.floor(this.time / 60);
        const seconds = this.time % 60;
        this.timeElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    endGame() {
        this.gameActive = false;
        clearInterval(this.timer);
        
        // Show congratulations
        setTimeout(() => {
            alert(`Congratulations! You completed the game in ${this.moves} moves and ${this.time} seconds!`);
        }, 500);
        
        this.startBtn.disabled = false;
    }
}

// Initialize all games when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const gameManager = new GameManager();
    
    console.log('🎮 All games initialized successfully!');
});
