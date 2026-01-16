// ========== GLOBAL VARIABLES & INITIALIZATION ==========
let currentTheme = 'light';
let totalWins = parseInt(localStorage.getItem('totalWins')) || 0;
let totalGames = parseInt(localStorage.getItem('totalGames')) || 0;
let currentRoom = null;
let isHost = false;
let socket = null;

// ========== THEME MANAGEMENT ==========
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        currentTheme = savedTheme;
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateThemeIcon();
    }
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// ========== NAVIGATION & TABS ==========
function initNavigation() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // Game tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const gameSections = document.querySelectorAll('.game-section');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const gameId = btn.dataset.game;
            
            // Update active tab
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show corresponding game section
            gameSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === gameId) {
                    section.classList.add('active');
                }
            });
            
            // Reset current game if needed
            resetCurrentGame();
            
            // Show/hide multiplayer options based on game
            updateMultiplayerUI(gameId);
        });
    });
    
    // Tutorial tabs
    const tutorialTabs = document.querySelectorAll('.tutorial-tab');
    const tutorialSections = document.querySelectorAll('.tutorial-section');
    
    tutorialTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tutorialId = tab.dataset.tutorial;
            
            // Update active tab
            tutorialTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding tutorial section
            tutorialSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `${tutorialId}-tutorial`) {
                    section.classList.add('active');
                }
            });
        });
    });
}

function updateMultiplayerUI(gameId) {
    const multiplayerSection = document.getElementById('multiplayerSection');
    const rpsMultiplayerOptions = document.getElementById('rpsMultiplayerOptions');
    const tttMultiplayerOptions = document.getElementById('tttMultiplayerOptions');
    
    if (!multiplayerSection) return;
    
    // Reset all options
    if (rpsMultiplayerOptions) rpsMultiplayerOptions.classList.add('hidden');
    if (tttMultiplayerOptions) tttMultiplayerOptions.classList.add('hidden');
    
    // Show relevant multiplayer options
    switch(gameId) {
        case 'rps':
            if (rpsMultiplayerOptions) rpsMultiplayerOptions.classList.remove('hidden');
            break;
        case 'ttt':
            if (tttMultiplayerOptions) tttMultiplayerOptions.classList.remove('hidden');
            break;
        default:
            // Hide multiplayer section for non-multiplayer games
            multiplayerSection.classList.add('hidden');
            return;
    }
    
    // Show multiplayer section for multiplayer games
    multiplayerSection.classList.remove('hidden');
}

// ========== DASHBOARD STATS ==========
function updateDashboardStats() {
    const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
    
    const totalWinsEl = document.getElementById('totalWins');
    const totalGamesEl = document.getElementById('totalGames');
    const winRateEl = document.getElementById('winRate');
    
    if (totalWinsEl) totalWinsEl.textContent = totalWins;
    if (totalGamesEl) totalGamesEl.textContent = totalGames;
    if (winRateEl) winRateEl.textContent = `${winRate}%`;
}

function saveGameResult(isWin) {
    totalGames++;
    if (isWin) totalWins++;
    
    localStorage.setItem('totalWins', totalWins.toString());
    localStorage.setItem('totalGames', totalGames.toString());
    updateDashboardStats();
}

// ========== MULTIPLAYER SYSTEM ==========
function initMultiplayer() {
    const createRoomBtn = document.getElementById('createRoomBtn');
    const joinRoomBtn = document.getElementById('joinRoomBtn');
    const joinRoomInput = document.getElementById('joinRoomInput');
    
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', createRoom);
    }
    
    if (joinRoomBtn && joinRoomInput) {
        joinRoomBtn.addEventListener('click', () => {
            const roomCode = joinRoomInput.value.trim();
            if (roomCode) joinRoom(roomCode);
        });
        
        // Allow pressing Enter to join room
        joinRoomInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const roomCode = joinRoomInput.value.trim();
                if (roomCode) joinRoom(roomCode);
            }
        });
    }
    
    // Initialize mock WebSocket (for demo purposes)
    initMockWebSocket();
}

function initMockWebSocket() {
    // Mock WebSocket for demo
    socket = {
        send: function(data) {
            console.log('Mock WebSocket send:', data);
            // Simulate receiving data
            setTimeout(() => {
                handleMockMessage(data);
            }, 100);
        },
        close: function() {
            console.log('Mock WebSocket closed');
        }
    };
}

function handleMockMessage(data) {
    try {
        const message = typeof data === 'string' ? JSON.parse(data) : data;
        
        switch(message.type) {
            case 'room_created':
                handleRoomCreated(message.roomCode);
                break;
            case 'room_joined':
                handleRoomJoined(message);
                break;
            case 'player_joined':
                updateRoomPlayers(message.players);
                break;
            case 'rps_choice':
                handleRPSOpponentChoice(message.choice);
                break;
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
}

function createRoom() {
    // Generate random room code
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    currentRoom = roomCode;
    isHost = true;
    
    // Update UI
    showRoomInfo(roomCode, 'Room created! Waiting for player...', 'waiting');
    updateRoomPlayers(['You (Host)']);
    
    // Mock WebSocket response
    socket.send(JSON.stringify({
        type: 'room_created',
        roomCode: roomCode,
        playerName: 'Player 1'
    }));
}

function joinRoom(roomCode) {
    if (!roomCode || roomCode.length !== 6) {
        alert('Please enter a valid 6-character room code');
        return;
    }
    
    currentRoom = roomCode;
    isHost = false;
    
    // Update UI
    showRoomInfo(roomCode, 'Connected! Waiting for host...', 'connected');
    updateRoomPlayers(['Host', 'You (Player 2)']);
    
    // Mock WebSocket response
    socket.send(JSON.stringify({
        type: 'room_joined',
        roomCode: roomCode,
        playerName: 'Player 2'
    }));
}

function showRoomInfo(roomCode, statusText, statusClass) {
    const roomInfo = document.getElementById('roomInfo');
    const roomCodeDisplay = document.getElementById('roomCodeDisplay');
    const roomStatus = document.getElementById('roomStatus');
    
    if (roomInfo) roomInfo.classList.remove('hidden');
    if (roomCodeDisplay) roomCodeDisplay.textContent = roomCode;
    if (roomStatus) {
        roomStatus.textContent = statusText;
        roomStatus.className = `room-status ${statusClass}`;
    }
}

function updateRoomPlayers(players) {
    const roomPlayers = document.getElementById('roomPlayers');
    if (!roomPlayers) return;
    
    roomPlayers.innerHTML = '';
    players.forEach((player, index) => {
        const playerElement = document.createElement('div');
        playerElement.className = 'player-item';
        playerElement.innerHTML = `
            <i class="fas fa-user"></i>
            <span>${player}</span>
            ${index === 0 ? '<span class="host-badge">Host</span>' : ''}
        `;
        roomPlayers.appendChild(playerElement);
    });
}

// ========== ROCK PAPER SCISSORS GAME ==========
let rpsPlayerScore = 0;
let rpsAIScore = 0;
let rpsRound = 1;
const maxRounds = 5;
let rpsHistory = [];
let isMultiplayer = false;
let rpsWaitingForOpponent = false;
let rpsPlayerChoice = null;

function initRPSGame() {
    const choiceBtns = document.querySelectorAll('.choice-btn[data-choice]');
    const resetBtn = document.getElementById('rpsReset');
    const modeBtn = document.getElementById('rpsMode');
    const helpBtn = document.getElementById('rpsHelp');
    
    // Initialize scores
    updateRPSScores();
    updateOpponentLabel();
    
    // Choice buttons
    choiceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (rpsWaitingForOpponent) return;
            
            const playerChoice = btn.dataset.choice;
            rpsPlayerChoice = playerChoice;
            
            // Update UI to show selection
            choiceBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            // If multiplayer and connected, send choice
            if (isMultiplayer && currentRoom) {
                sendRPSChoice(playerChoice);
                rpsWaitingForOpponent = true;
                updateRPSMessage('Waiting for opponent...');
            } else {
                // Play against AI
                playRPSRound(playerChoice);
            }
        });
    });
    
    // Reset button
    if (resetBtn) {
        resetBtn.addEventListener('click', resetRPSGame);
    }
    
    // Mode toggle
    if (modeBtn) {
        modeBtn.addEventListener('click', () => {
            if (!currentRoom) {
                isMultiplayer = !isMultiplayer;
                modeBtn.innerHTML = isMultiplayer ? 
                    '<i class="fas fa-user-friends"></i> Multiplayer' : 
                    '<i class="fas fa-robot"></i> vs AI';
                updateOpponentLabel();
                resetRPSGame();
            } else {
                alert('Cannot change mode while in multiplayer room! Leave room first.');
            }
        });
    }
    
    // Help button
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            alert('🎮 Rock Paper Scissors Rules:\n\n• Rock beats Scissors\n• Paper beats Rock\n• Scissors beats Paper\n\nFirst to win 3 rounds wins the game!');
        });
    }
    
    // Initialize history table
    updateRPSHistoryDisplay();
}

function sendRPSChoice(choice) {
    if (!socket || !currentRoom) return;
    
    socket.send(JSON.stringify({
        type: 'rps_choice',
        roomCode: currentRoom,
        choice: choice,
        isHost: isHost
    }));
}

function handleRPSOpponentChoice(opponentChoice) {
    if (!rpsPlayerChoice) return;
    
    playRPSRound(rpsPlayerChoice, opponentChoice);
    rpsWaitingForOpponent = false;
}

function playRPSRound(playerChoice, opponentChoice = null) {
    if (rpsRound > maxRounds) return;
    
    // Get opponent choice
    if (!opponentChoice) {
        opponentChoice = getAIChoice();
    }
    
    // Determine winner
    const winner = determineRPSWinner(playerChoice, opponentChoice);
    
    // Update scores
    if (winner === 'player') {
        rpsPlayerScore++;
    } else if (winner === 'opponent') {
        rpsAIScore++;
    }
    
    // Update UI
    updateRPSScores();
    
    // Display choices
    const playerChoiceDisplay = document.getElementById('playerChoiceDisplay');
    const aiChoiceDisplay = document.getElementById('aiChoiceDisplay');
    const rpsMessageEl = document.getElementById('rpsMessage');
    const choiceLabel = document.getElementById('choiceLabel');
    
    if (playerChoiceDisplay) {
        playerChoiceDisplay.textContent = getEmoji(playerChoice);
    }
    if (aiChoiceDisplay) {
        aiChoiceDisplay.textContent = getEmoji(opponentChoice);
    }
    if (choiceLabel) {
        choiceLabel.textContent = isMultiplayer ? 'Player 2 Choice' : 'AI Choice';
    }
    if (rpsMessageEl) {
        const messages = {
            'player': '🎉 You win this round!',
            'opponent': isMultiplayer ? '😞 Player 2 wins this round!' : '😞 AI wins this round!',
            'tie': '🤝 This round is a tie!'
        };
        rpsMessageEl.textContent = messages[winner];
    }
    
    // Add to history
    addToRPSHistory(playerChoice, opponentChoice, winner);
    
    // Increment round
    rpsRound++;
    
    // Check if game is over
    if (rpsRound > maxRounds) {
        endRPSGame();
    } else {
        // Reset choice for next round
        rpsPlayerChoice = null;
        const choiceBtns = document.querySelectorAll('.choice-btn[data-choice]');
        choiceBtns.forEach(btn => btn.classList.remove('selected'));
    }
}

function updateRPSScores() {
    const playerScoreEl = document.getElementById('playerScore');
    const aiScoreEl = document.getElementById('aiScore');
    const roundCountEl = document.getElementById('roundCount');
    const rpsMessageEl = document.getElementById('rpsMessage');
    
    if (playerScoreEl) playerScoreEl.textContent = rpsPlayerScore;
    if (aiScoreEl) aiScoreEl.textContent = rpsAIScore;
    if (roundCountEl) roundCountEl.textContent = rpsRound;
    
    // Update message based on game state
    if (rpsRound > maxRounds) {
        if (rpsMessageEl) {
            if (rpsPlayerScore > rpsAIScore) {
                rpsMessageEl.textContent = '🎉 You won the game!';
                saveGameResult(true);
                triggerConfetti();
            } else if (rpsAIScore > rpsPlayerScore) {
                rpsMessageEl.textContent = isMultiplayer ? '😞 Player 2 won the game!' : '😞 AI won the game!';
                saveGameResult(false);
            } else {
                rpsMessageEl.textContent = '🤝 The game is a tie!';
            }
        }
    }
}

function updateRPSMessage(message) {
    const rpsMessageEl = document.getElementById('rpsMessage');
    if (rpsMessageEl) {
        rpsMessageEl.textContent = message;
    }
}

function updateOpponentLabel() {
    const opponentLabel = document.getElementById('opponentLabel');
    if (opponentLabel) {
        opponentLabel.textContent = isMultiplayer ? 'Player 2' : 'AI';
    }
}

function getAIChoice() {
    const choices = ['rock', 'paper', 'scissors'];
    return choices[Math.floor(Math.random() * choices.length)];
}

function determineRPSWinner(playerChoice, opponentChoice) {
    if (playerChoice === opponentChoice) return 'tie';
    
    if (
        (playerChoice === 'rock' && opponentChoice === 'scissors') ||
        (playerChoice === 'paper' && opponentChoice === 'rock') ||
        (playerChoice === 'scissors' && opponentChoice === 'paper')
    ) {
        return 'player';
    }
    
    return 'opponent';
}

function getEmoji(choice) {
    const emojis = {
        'rock': '✊',
        'paper': '✋',
        'scissors': '✌️'
    };
    return emojis[choice] || '❓';
}

function addToRPSHistory(playerChoice, opponentChoice, winner) {
    const roundData = {
        round: rpsHistory.length + 1,
        playerChoice,
        opponentChoice,
        winner,
        playerScore: rpsPlayerScore,
        opponentScore: rpsAIScore
    };
    
    rpsHistory.push(roundData);
    updateRPSHistoryDisplay();
}

function updateRPSHistoryDisplay() {
    const historyBody = document.getElementById('rpsHistoryBody');
    if (!historyBody) return;
    
    // Clear current history
    historyBody.innerHTML = '';
    
    // Add recent rounds (max 10)
    const recentHistory = rpsHistory.slice(-10).reverse();
    
    recentHistory.forEach(round => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${round.round}</td>
            <td>${getEmoji(round.playerChoice)}</td>
            <td>${getEmoji(round.opponentChoice)}</td>
            <td>${getWinnerText(round.winner)}</td>
            <td>${round.playerScore}-${round.opponentScore}</td>
        `;
        
        historyBody.appendChild(row);
    });
}

function getWinnerText(winner) {
    const winnerTexts = {
        'player': '🏆 You',
        'opponent': isMultiplayer ? '👤 Player 2' : '🤖 AI',
        'tie': '🤝 Tie'
    };
    return winnerTexts[winner] || 'N/A';
}

function endRPSGame() {
    const choiceBtns = document.querySelectorAll('.choice-btn[data-choice]');
    choiceBtns.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
    });
}

function triggerConfetti() {
    // Simple confetti effect
    const confettiCount = 100;
    const confettiContainer = document.querySelector('.game-container') || document.body;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.cssText = `
            position: absolute;
            width: 10px;
            height: 10px;
            background: ${getRandomColor()};
            border-radius: 50%;
            top: -20px;
            left: ${Math.random() * 100}%;
            animation: fall ${Math.random() * 2 + 2}s linear forwards;
            z-index: 1000;
        `;
        confettiContainer.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

function getRandomColor() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#fab1a0'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function resetRPSGame() {
    rpsPlayerScore = 0;
    rpsAIScore = 0;
    rpsRound = 1;
    rpsHistory = [];
    rpsWaitingForOpponent = false;
    rpsPlayerChoice = null;
    
    updateRPSScores();
    updateRPSHistoryDisplay();
    
    // Reset UI elements
    const playerChoiceDisplay = document.getElementById('playerChoiceDisplay');
    const aiChoiceDisplay = document.getElementById('aiChoiceDisplay');
    const rpsMessageEl = document.getElementById('rpsMessage');
    const choiceLabel = document.getElementById('choiceLabel');
    
    if (playerChoiceDisplay) playerChoiceDisplay.textContent = '❓';
    if (aiChoiceDisplay) aiChoiceDisplay.textContent = '❓';
    if (choiceLabel) choiceLabel.textContent = isMultiplayer ? 'Player 2 Choice' : 'AI Choice';
    if (rpsMessageEl) rpsMessageEl.textContent = 'Make your first move!';
    
    // Re-enable buttons
    const choiceBtns = document.querySelectorAll('.choice-btn[data-choice]');
    choiceBtns.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.classList.remove('selected');
    });
}

// ========== MEMORY CARD GAME ==========
let memoryCards = [];
let flippedCards = [];
let matchedPairs = 0;
let memoryScore = 0;
let memoryTimer = null;
let timeElapsed = 0;
let isMemoryGameActive = false;
const totalPairs = 8;
const memoryGameTime = 60;

function initMemoryGame() {
    const startBtn = document.getElementById('memoryStart');
    const resetBtn = document.getElementById('memoryReset');
    const helpBtn = document.getElementById('memoryHelp');
    
    if (startBtn) {
        startBtn.addEventListener('click', startMemoryGame);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetMemoryGame);
    }
    
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            alert('🎮 Memory Game Rules:\n\n• Click Start Game to begin\n• Click cards to flip them\n• Match pairs of identical cards\n• Complete all pairs before time runs out\n• Score 10 points for each matched pair');
        });
    }
    
    // Initialize card grid
    createMemoryCards();
}

function createMemoryCards() {
    const symbols = ['🎮', '🎯', '🎲', '🎨', '🧩', '🎪', '🎭', '🎸'];
    const cardGrid = document.getElementById('memoryGrid');
    
    if (!cardGrid) return;
    
    // Clear existing cards
    cardGrid.innerHTML = '';
    
    // Create pairs
    const cardValues = [...symbols, ...symbols];
    
    // Shuffle cards
    for (let i = cardValues.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardValues[i], cardValues[j]] = [cardValues[j], cardValues[i]];
    }
    
    // Create card elements
    memoryCards = [];
    cardValues.forEach((symbol, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.index = index;
        card.dataset.symbol = symbol;
        
        card.innerHTML = `
            <div class="card-front">?</div>
            <div class="card-back">${symbol}</div>
        `;
        
        card.addEventListener('click', () => flipMemoryCard(card));
        
        cardGrid.appendChild(card);
        memoryCards.push(card);
    });
}

function startMemoryGame() {
    if (isMemoryGameActive) return;
    
    resetMemoryGame();
    isMemoryGameActive = true;
    
    // Start timer
    timeElapsed = 0;
    updateMemoryTimer();
    memoryTimer = setInterval(() => {
        timeElapsed++;
        updateMemoryTimer();
        
        if (timeElapsed >= memoryGameTime) {
            endMemoryGame(false);
        }
    }, 1000);
    
    // Update UI
    const startBtn = document.getElementById('memoryStart');
    const messageEl = document.getElementById('memoryMessage');
    
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.style.opacity = '0.5';
    }
    
    if (messageEl) {
        messageEl.textContent = 'Game started! Find all matches!';
    }
}

function updateMemoryTimer() {
    const timerEl = document.getElementById('memoryTime');
    const timeLeft = memoryGameTime - timeElapsed;
    
    if (timerEl) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Color coding for time
        if (timeLeft < 10) {
            timerEl.style.color = '#ff6b6b';
        } else if (timeLeft < 30) {
            timerEl.style.color = '#feca57';
        } else {
            timerEl.style.color = '#1dd1a1';
        }
    }
}

function flipMemoryCard(card) {
    if (!isMemoryGameActive || card.classList.contains('flipped') || card.classList.contains('matched')) {
        return;
    }
    
    // Don't allow flipping more than 2 cards
    if (flippedCards.length >= 2) return;
    
    // Show card
    card.classList.add('flipped');
    flippedCards.push(card);
    
    // Update moves
    const movesEl = document.getElementById('memoryMoves');
    if (movesEl) {
        movesEl.textContent = parseInt(movesEl.textContent) + 1;
    }
    
    if (flippedCards.length === 2) {
        checkMemoryMatch();
    }
}

function checkMemoryMatch() {
    const [card1, card2] = flippedCards;
    
    if (card1.dataset.symbol === card2.dataset.symbol) {
        // Match found
        setTimeout(() => {
            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedPairs++;
            memoryScore += 10;
            
            updateMemoryScore();
            
            // Check if game is complete
            if (matchedPairs === totalPairs) {
                endMemoryGame(true);
            }
            
            // Clear flipped cards
            flippedCards = [];
        }, 500);
    } else {
        // No match - flip back after delay
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
        }, 1000);
    }
}

function updateMemoryScore() {
    const scoreEl = document.getElementById('memoryMatches');
    if (scoreEl) {
        scoreEl.textContent = matchedPairs;
    }
}

function endMemoryGame(isWin) {
    isMemoryGameActive = false;
    
    if (memoryTimer) {
        clearInterval(memoryTimer);
        memoryTimer = null;
    }
    
    // Enable start button
    const startBtn = document.getElementById('memoryStart');
    if (startBtn) {
        startBtn.disabled = false;
        startBtn.style.opacity = '1';
    }
    
    // Show result
    const messageEl = document.getElementById('memoryMessage');
    if (messageEl) {
        if (isWin) {
            messageEl.textContent = `🎉 You won! Time: ${timeElapsed}s Matches: ${matchedPairs}`;
            saveGameResult(true);
            
            // Trigger confetti for win
            triggerConfetti();
        } else {
            messageEl.textContent = '⏰ Time\'s up! Try again.';
            saveGameResult(false);
        }
    }
    
    // Disable further card clicks
    memoryCards.forEach(card => {
        card.style.pointerEvents = 'none';
    });
}

function resetMemoryGame() {
    // Clear timer
    if (memoryTimer) {
        clearInterval(memoryTimer);
        memoryTimer = null;
    }
    
    // Reset variables
    flippedCards = [];
    matchedPairs = 0;
    memoryScore = 0;
    timeElapsed = 0;
    isMemoryGameActive = false;
    
    // Update UI
    updateMemoryScore();
    updateMemoryTimer();
    
    const movesEl = document.getElementById('memoryMoves');
    const messageEl = document.getElementById('memoryMessage');
    
    if (movesEl) movesEl.textContent = '0';
    if (messageEl) messageEl.textContent = 'Click Start to begin!';
    
    const startBtn = document.getElementById('memoryStart');
    if (startBtn) {
        startBtn.disabled = false;
        startBtn.style.opacity = '1';
    }
    
    // Recreate cards
    createMemoryCards();
}

// ========== TIC-TAC-TOE GAME ==========
let tttBoard = ['', '', '', '', '', '', '', '', ''];
let tttCurrentPlayer = 'X';
let tttGameActive = true;
let tttScores = { 'X': 0, 'O': 0, 'ties': 0 };
let tttMode = 'ai';

function initTTTGame() {
    const cells = document.querySelectorAll('.ttt-cell');
    const resetBtn = document.getElementById('tttReset');
    const modeBtn = document.getElementById('tttMode');
    const helpBtn = document.getElementById('tttHelp');
    
    // Initialize cells
    cells.forEach((cell, index) => {
        cell.addEventListener('click', () => makeTTTMove(index));
    });
    
    // Reset button
    if (resetBtn) {
        resetBtn.addEventListener('click', resetTTTGame);
    }
    
    // Mode toggle
    if (modeBtn) {
        modeBtn.addEventListener('click', () => {
            if (!currentRoom) {
                tttMode = tttMode === 'ai' ? 'player' : 'ai';
                modeBtn.textContent = tttMode === 'ai' ? '🤖 vs AI' : '👥 2 Players';
                resetTTTGame();
            } else {
                alert('Cannot change mode while in multiplayer room!');
            }
        });
    }
    
    // Help button
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            alert('🎮 Tic Tac Toe Rules:\n\n• Players take turns placing X and O\n• First to get 3 in a row wins\n• Row can be horizontal, vertical, or diagonal\n• If all squares are filled, it\'s a tie');
        });
    }
    
    // Initialize scores display
    updateTTTScores();
    updateTTTStatus();
}

function makeTTTMove(index) {
    if (!tttGameActive || tttBoard[index] !== '') return;
    
    // Human player move
    tttBoard[index] = tttCurrentPlayer;
    updateTTTBoard();
    
    if (checkTTTWin()) {
        endTTTGame(`${tttCurrentPlayer} wins!`);
        updateTTTScores();
        return;
    }
    
    if (checkTTTTie()) {
        endTTTGame("It's a tie!");
        updateTTTScores();
        return;
    }
    
    // Switch player
    tttCurrentPlayer = tttCurrentPlayer === 'X' ? 'O' : 'X';
    updateTTTStatus();
    
    // AI move if in AI mode and it's AI's turn
    if (tttMode === 'ai' && tttCurrentPlayer === 'O' && tttGameActive) {
        setTimeout(makeAIITMove, 500);
    }
}

function makeAIITMove() {
    if (!tttGameActive) return;
    
    // Simple AI: find empty cell
    const emptyCells = tttBoard.map((cell, index) => cell === '' ? index : -1).filter(index => index !== -1);
    
    if (emptyCells.length > 0) {
        const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        tttBoard[randomIndex] = 'O';
        updateTTTBoard();
        
        if (checkTTTWin()) {
            endTTTGame('O wins!');
            updateTTTScores();
            return;
        }
        
        if (checkTTTTie()) {
            endTTTGame("It's a tie!");
            updateTTTScores();
            return;
        }
        
        tttCurrentPlayer = 'X';
        updateTTTStatus();
    }
}

function updateTTTBoard() {
    const cells = document.querySelectorAll('.ttt-cell');
    cells.forEach((cell, index) => {
        cell.textContent = tttBoard[index];
        cell.classList.remove('x', 'o', 'winning');
        if (tttBoard[index] === 'X') cell.classList.add('x');
        if (tttBoard[index] === 'O') cell.classList.add('o');
    });
}

function updateTTTStatus() {
    const statusEl = document.getElementById('tttStatus');
    const currentPlayerEl = document.getElementById('currentPlayer');
    
    if (statusEl) {
        const playerNames = {
            'X': tttMode === 'ai' ? 'Player' : 'Player 1',
            'O': tttMode === 'ai' ? 'AI' : 'Player 2'
        };
        statusEl.textContent = `${playerNames[tttCurrentPlayer]}'s turn (${tttCurrentPlayer})`;
    }
    
    if (currentPlayerEl) {
        currentPlayerEl.textContent = tttCurrentPlayer;
    }
}

function checkTTTWin() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];
    
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (tttBoard[a] && tttBoard[a] === tttBoard[b] && tttBoard[a] === tttBoard[c]) {
            return true;
        }
    }
    return false;
}

function checkTTTTie() {
    return tttBoard.every(cell => cell !== '');
}

function updateTTTScores() {
    // Update score display
    const xScoreEl = document.getElementById('scoreX');
    const oScoreEl = document.getElementById('scoreO');
    const tiesEl = document.getElementById('scoreDraw');
    
    if (xScoreEl) xScoreEl.textContent = tttScores['X'];
    if (oScoreEl) oScoreEl.textContent = tttScores['O'];
    if (tiesEl) tiesEl.textContent = tttScores['ties'];
}

function endTTTGame(message) {
    tttGameActive = false;
    
    const statusEl = document.getElementById('tttStatus');
    if (statusEl) {
        statusEl.textContent = message;
    }
    
    // Save game result if player won
    if (message.includes('X wins') && tttMode === 'ai') {
        tttScores['X']++;
        saveGameResult(true);
        triggerConfetti();
    } else if (message.includes('O wins') && tttMode === 'ai') {
        tttScores['O']++;
        saveGameResult(false);
    } else if (message.includes('tie')) {
        tttScores['ties']++;
    }
    
    // Update scores display
    updateTTTScores();
    
    // Highlight winning cells
    highlightWinningCells();
}

function highlightWinningCells() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (tttBoard[a] && tttBoard[a] === tttBoard[b] && tttBoard[a] === tttBoard[c]) {
            const cells = document.querySelectorAll('.ttt-cell');
            cells[a].classList.add('winning');
            cells[b].classList.add('winning');
            cells[c].classList.add('winning');
            break;
        }
    }
}

function resetTTTGame() {
    tttBoard = ['', '', '', '', '', '', '', '', ''];
    tttCurrentPlayer = 'X';
    tttGameActive = true;
    
    // Clear board
    const cells = document.querySelectorAll('.ttt-cell');
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'winning');
    });
    
    updateTTTStatus();
}

// ========== SNAKE GAME ==========
let snakeGameActive = false;
let snakeGamePaused = false;
let snakeDirection = 'right';
let nextDirection = 'right';
let snake = [{x: 5, y: 5}];
let food = {x: 10, y: 10};
let snakeScore = 0;
let snakeHighScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
let snakeSpeed = 150;
let snakeGameLoop = null;
const gridSize = 20;
const boardSize = 15;

function initSnakeGame() {
    const resetBtn = document.getElementById('snakeReset');
    const pauseBtn = document.getElementById('snakePause');
    const helpBtn = document.getElementById('snakeHelp');
    const dirBtns = document.querySelectorAll('.dir-btn[data-dir]');
    
    // Initialize display
    updateSnakeScore();
    updateSnakeHighScore();
    
    // Reset button
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSnakeGame);
    }
    
    // Pause button
    if (pauseBtn) {
        pauseBtn.addEventListener('click', toggleSnakePause);
    }
    
    // Help button
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            alert('🎮 Snake Game Controls:\n\n• Arrow Keys or WASD to move\n• Space to pause/resume\n• R to restart\n• Eat food (🍎) to grow\n• Avoid walls and yourself!');
        });
    }
    
    // Direction buttons (mobile)
    dirBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const dir = btn.dataset.dir;
            changeSnakeDirection(dir);
        });
    });
    
    // Keyboard controls
    document.addEventListener('keydown', handleSnakeKeyDown);
    
    // Draw initial board
    drawSnakeBoard();
}

function drawSnakeBoard() {
    const board = document.getElementById('snakeBoard');
    if (!board) return;
    
    board.innerHTML = '';
    
    // Create cells
    for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
            const cell = document.createElement('div');
            cell.className = 'snake-cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            board.appendChild(cell);
        }
    }
    
    // Draw initial snake and food
    drawSnake();
    drawFood();
}

function drawSnake() {
    const cells = document.querySelectorAll('.snake-cell');
    
    // Clear previous snake
    cells.forEach(cell => {
        cell.classList.remove('snake-head', 'snake-body');
    });
    
    // Draw snake body
    snake.forEach((segment, index) => {
        const cell = document.querySelector(`.snake-cell[data-x="${segment.x}"][data-y="${segment.y}"]`);
        if (cell) {
            if (index === 0) {
                cell.classList.add('snake-head');
            } else {
                cell.classList.add('snake-body');
            }
        }
    });
}

function drawFood() {
    const cells = document.querySelectorAll('.snake-cell');
    
    cells.forEach(cell => cell.classList.remove('snake-food'));
    
    const foodCell = document.querySelector(`.snake-cell[data-x="${food.x}"][data-y="${food.y}"]`);
    if (foodCell) {
        foodCell.classList.add('snake-food');
    }
}

function updateSnakeScore() {
    const scoreEl = document.getElementById('snakeScore');
    if (scoreEl) {
        scoreEl.textContent = snakeScore;
    }
    
    // Update level based on score
    const levelEl = document.getElementById('snakeLevel');
    if (levelEl) {
        const level = Math.floor(snakeScore / 5) + 1;
        levelEl.textContent = level;
        snakeSpeed = Math.max(50, 150 - (level * 10));
    }
}

function updateSnakeHighScore() {
    const highScoreEl = document.getElementById('snakeHighScore');
    if (highScoreEl) {
        highScoreEl.textContent = snakeHighScore;
    }
}

function startSnakeGame() {
    if (snakeGameActive) return;
    
    snakeGameActive = true;
    snakeGamePaused = false;
    
    const messageEl = document.getElementById('snakeMessage');
    if (messageEl) {
        messageEl.textContent = 'Game Started!';
    }
    
    const pauseBtn = document.getElementById('snakePause');
    if (pauseBtn) {
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    }
    
    // Start game loop
    snakeGameLoop = setInterval(gameLoop, snakeSpeed);
}

function gameLoop() {
    if (snakeGamePaused || !snakeGameActive) return;
    
    // Update direction
    snakeDirection = nextDirection;
    
    // Move snake
    const head = {...snake[0]};
    
    switch(snakeDirection) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    // Check collision with walls
    if (head.x < 0 || head.x >= boardSize || head.y < 0 || head.y >= boardSize) {
        gameOver();
        return;
    }
    
    // Check collision with self
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check if food eaten
    if (head.x === food.x && head.y === food.y) {
        snakeScore += 10;
        updateSnakeScore();
        generateFood();
        
        // Update high score
        if (snakeScore > snakeHighScore) {
            snakeHighScore = snakeScore;
            localStorage.setItem('snakeHighScore', snakeHighScore);
            updateSnakeHighScore();
        }
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }
    
    // Redraw
    drawSnake();
    drawFood();
}

function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * boardSize),
            y: Math.floor(Math.random() * boardSize)
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    
    food = newFood;
}

function changeSnakeDirection(newDirection) {
    // Prevent 180-degree turns
    if (
        (newDirection === 'up' && snakeDirection !== 'down') ||
        (newDirection === 'down' && snakeDirection !== 'up') ||
        (newDirection === 'left' && snakeDirection !== 'right') ||
        (newDirection === 'right' && snakeDirection !== 'left')
    ) {
        nextDirection = newDirection;
    }
}

function handleSnakeKeyDown(event) {
    if (!snakeGameActive && event.code === 'Space') {
        startSnakeGame();
        return;
    }
    
    if (event.code === 'Space') {
        toggleSnakePause();
        return;
    }
    
    if (event.code === 'KeyR') {
        resetSnakeGame();
        return;
    }
    
    switch(event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            event.preventDefault();
            changeSnakeDirection('up');
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            event.preventDefault();
            changeSnakeDirection('down');
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            event.preventDefault();
            changeSnakeDirection('left');
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            event.preventDefault();
            changeSnakeDirection('right');
            break;
    }
}

function toggleSnakePause() {
    if (!snakeGameActive) {
        startSnakeGame();
        return;
    }
    
    snakeGamePaused = !snakeGamePaused;
    
    const pauseBtn = document.getElementById('snakePause');
    const messageEl = document.getElementById('snakeMessage');
    
    if (pauseBtn) {
        pauseBtn.innerHTML = snakeGamePaused ? 
            '<i class="fas fa-play"></i> Resume' : 
            '<i class="fas fa-pause"></i> Pause';
    }
    
    if (messageEl) {
        messageEl.textContent = snakeGamePaused ? 'Game Paused' : 'Game Started!';
    }
}

function gameOver() {
    snakeGameActive = false;
    
    if (snakeGameLoop) {
        clearInterval(snakeGameLoop);
        snakeGameLoop = null;
    }
    
    const messageEl = document.getElementById('snakeMessage');
    if (messageEl) {
        messageEl.textContent = `Game Over! Score: ${snakeScore}`;
    }
    
    saveGameResult(false);
}

function resetSnakeGame() {
    snakeGameActive = false;
    snakeGamePaused = false;
    snakeDirection = 'right';
    nextDirection = 'right';
    snake = [{x: 5, y: 5}];
    food = {x: 10, y: 10};
    snakeScore = 0;
    snakeSpeed = 150;
    
    if (snakeGameLoop) {
        clearInterval(snakeGameLoop);
        snakeGameLoop = null;
    }
    
    // Update UI
    updateSnakeScore();
    
    const pauseBtn = document.getElementById('snakePause');
    const messageEl = document.getElementById('snakeMessage');
    
    if (pauseBtn) {
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    }
    
    if (messageEl) {
        messageEl.textContent = 'Press Space to Start';
    }
    
    // Redraw
    drawSnakeBoard();
}

// ========== TUTORIAL FUNCTIONS ==========
function initTutorial() {
    // Practice buttons for RPS tutorial
    const practiceBtns = document.querySelectorAll('.practice-btn[data-choice]');
    practiceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const choice = btn.dataset.choice;
            const aiChoice = getAIChoice();
            const winner = determineRPSWinner(choice, aiChoice);
            
            const resultEl = document.getElementById('practiceResult');
            if (resultEl) {
                const messages = {
                    'player': `🎉 You win! ${getEmoji(choice)} beats ${getEmoji(aiChoice)}`,
                    'opponent': `😞 AI wins! ${getEmoji(aiChoice)} beats ${getEmoji(choice)}`,
                    'tie': `🤝 It's a tie! Both chose ${getEmoji(choice)}`
                };
                resultEl.textContent = messages[winner];
            }
        });
    });
    
    // Tic Tac Toe practice board
    const miniCells = document.querySelectorAll('.mini-cell');
    let tttPracticeBoard = ['', '', '', '', '', '', '', '', ''];
    let tttPracticePlayer = 'X';
    
    miniCells.forEach(cell => {
        cell.addEventListener('click', () => {
            const index = parseInt(cell.dataset.cell);
            if (tttPracticeBoard[index] !== '') return;
            
            tttPracticeBoard[index] = tttPracticePlayer;
            cell.textContent = tttPracticePlayer;
            cell.classList.add(tttPracticePlayer.toLowerCase());
            
            // Switch player
            tttPracticePlayer = tttPracticePlayer === 'X' ? 'O' : 'X';
            
            const statusEl = document.getElementById('practiceStatus');
            if (statusEl) {
                statusEl.textContent = `Player ${tttPracticePlayer}'s turn`;
            }
        });
    });
    
    // Reset practice button
    const resetPracticeBtn = document.getElementById('resetPractice');
    if (resetPracticeBtn) {
        resetPracticeBtn.addEventListener('click', () => {
            tttPracticeBoard = ['', '', '', '', '', '', '', '', ''];
            tttPracticePlayer = 'X';
            
            miniCells.forEach(cell => {
                cell.textContent = '';
                cell.classList.remove('x', 'o');
            });
            
            const statusEl = document.getElementById('practiceStatus');
            if (statusEl) {
                statusEl.textContent = 'Player X\'s turn';
            }
        });
    }
}

// ========== GAME RESET FUNCTION ==========
function resetCurrentGame() {
    const activeGame = document.querySelector('.game-section.active');
    
    if (activeGame) {
        const gameId = activeGame.id;
        
        switch(gameId) {
            case 'rps':
                resetRPSGame();
                break;
            case 'memory':
                resetMemoryGame();
                break;
            case 'ttt':
                resetTTTGame();
                break;
            case 'snake':
                resetSnakeGame();
                break;
        }
    }
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    initTheme();
    initNavigation();
    updateDashboardStats();
    initMultiplayer();
    
    // Initialize games if on games page
    if (document.querySelector('.games-dashboard')) {
        initRPSGame();
        initMemoryGame();
        initTTTGame();
        initSnakeGame();
    }
    
    // Initialize tutorial if on tutorial page
    if (document.querySelector('.tutorial-content')) {
        initTutorial();
    }
    
    console.log('GameHub initialized successfully! 🎮');
});
