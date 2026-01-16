// ========== GLOBAL VARIABLES & INITIALIZATION ==========
let currentTheme = 'light';
let totalWins = parseInt(localStorage.getItem('totalWins')) || 0;
let totalGames = parseInt(localStorage.getItem('totalGames')) || 0;

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

// ========== ROCK PAPER SCISSORS GAME ==========
let rpsPlayerScore = 0;
let rpsAIScore = 0;
let rpsRound = 1;
const maxRounds = 5;
let rpsHistory = [];
let isMultiplayer = false;

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
            const playerChoice = btn.dataset.choice;
            playRPSRound(playerChoice);
        });
    });
    
    // Reset button
    if (resetBtn) {
        resetBtn.addEventListener('click', resetRPSGame);
    }
    
    // Mode toggle
    if (modeBtn) {
        modeBtn.addEventListener('click', () => {
            isMultiplayer = !isMultiplayer;
            modeBtn.innerHTML = isMultiplayer ? 
                '<i class="fas fa-user-friends"></i> vs Player' : 
                '<i class="fas fa-robot"></i> vs AI';
            updateOpponentLabel();
            resetRPSGame();
        });
    }
    
    // Help button
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            alert('🎮 Rock Paper Scissors Rules:\n\n• Rock beats Scissors\n• Paper beats Rock\n• Scissors beats Paper\n\nFirst to win 3 rounds wins the game!');
        });
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
            } else if (rpsAIScore > rpsPlayerScore) {
                rpsMessageEl.textContent = '😞 AI won the game!';
                saveGameResult(false);
            } else {
                rpsMessageEl.textContent = '🤝 The game is a tie!';
            }
        }
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

function getPlayer2Choice() {
    // For multiplayer, simulate player 2 choice
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

function playRPSRound(playerChoice) {
    if (rpsRound > maxRounds) return;
    
    // Get opponent choice
    const opponentChoice = isMultiplayer ? getPlayer2Choice() : getAIChoice();
    
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
    
    if (playerChoiceDisplay) {
        playerChoiceDisplay.textContent = getEmoji(playerChoice);
    }
    if (aiChoiceDisplay) {
        aiChoiceDisplay.textContent = getEmoji(opponentChoice);
    }
    if (rpsMessageEl) {
        const messages = {
            'player': '🎉 You win this round!',
            'opponent': '😞 Opponent wins this round!',
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
    }
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
        'player': '🏆 Player',
        'opponent': '🤖 AI',
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
    
    // Add confetti effect for win
    if (rpsPlayerScore > rpsAIScore) {
        triggerConfetti();
    }
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
    
    updateRPSScores();
    updateRPSHistoryDisplay();
    
    // Reset UI elements
    const playerChoiceDisplay = document.getElementById('playerChoiceDisplay');
    const aiChoiceDisplay = document.getElementById('aiChoiceDisplay');
    const rpsMessageEl = document.getElementById('rpsMessage');
    
    if (playerChoiceDisplay) playerChoiceDisplay.textContent = '❓';
    if (aiChoiceDisplay) aiChoiceDisplay.textContent = '❓';
    if (rpsMessageEl) rpsMessageEl.textContent = 'Make your first move!';
    
    // Re-enable buttons
    const choiceBtns = document.querySelectorAll('.choice-btn[data-choice]');
    choiceBtns.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
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
const memoryGameTime = 60; // 60 seconds

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
            alert('🎮 Memory Game Rules:\n\n• Click cards to flip them\n• Match pairs of identical cards\n• Complete all pairs before time runs out\n• Score points for each matched pair');
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
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.style.opacity = '0.5';
    }
}

function updateMemoryTimer() {
    const timerEl = document.getElementById('memoryTimer');
    const timeLeft = memoryGameTime - timeElapsed;
    
    if (timerEl) {
        timerEl.textContent = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;
        
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
    
    card.classList.add('flipped');
    flippedCards.push(card);
    
    if (flippedCards.length === 2) {
        checkMemoryMatch();
    }
}

function checkMemoryMatch() {
    const [card1, card2] = flippedCards;
    
    if (card1.dataset.symbol === card2.dataset.symbol) {
        // Match found
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        memoryScore += 10;
        
        updateMemoryScore();
        
        // Check if game is complete
        if (matchedPairs === totalPairs) {
            endMemoryGame(true);
        }
        
        // Clear flipped cards after delay
        setTimeout(() => {
            flippedCards = [];
        }, 500);
    } else {
        // No match
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
        }, 1000);
    }
}

function updateMemoryScore() {
    const scoreEl = document.getElementById('memoryScore');
    if (scoreEl) {
        scoreEl.textContent = memoryScore;
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
            messageEl.textContent = `🎉 You won! Time: ${timeElapsed}s Score: ${memoryScore}`;
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
    
    const messageEl = document.getElementById('memoryMessage');
    if (messageEl) {
        messageEl.textContent = 'Click Start to begin!';
    }
    
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
let tttMode = 'ai'; // 'ai' or 'player'

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
            tttMode = tttMode === 'ai' ? 'player' : 'ai';
            modeBtn.textContent = tttMode === 'ai' ? '🤖 vs AI' : '👥 2 Players';
            resetTTTGame();
        });
    }
    
    // Help button
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            alert('🎮 Tic Tac Toe Rules:\n\n• Players take turns placing X and O\n• First to get 3 in a row wins\n• Row can be horizontal, vertical, or diagonal\n• If all squares are filled, it\'s a tie');
        });
    }
    
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
        cell.classList.remove('x', 'o');
        if (tttBoard[index] === 'X') cell.classList.add('x');
        if (tttBoard[index] === 'O') cell.classList.add('o');
    });
}

function updateTTTStatus() {
    const statusEl = document.getElementById('tttStatus');
    if (statusEl) {
        const playerNames = {
            'X': tttMode === 'ai' ? 'Player' : 'Player 1',
            'O': tttMode === 'ai' ? 'AI' : 'Player 2'
        };
        statusEl.textContent = `${playerNames[tttCurrentPlayer]}'s turn (${tttCurrentPlayer})`;
    }
}

function checkTTTWin() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];
    
    return winPatterns.some(pattern => {
        const [a, b, c] = pattern;
        return tttBoard[a] && tttBoard[a] === tttBoard[b] && tttBoard[a] === tttBoard[c];
    });
}

function checkTTTTie() {
    return !tttBoard.includes('');
}

function updateTTTScores() {
    if (tttCurrentPlayer === 'X' && checkTTTWin()) {
        tttScores['X']++;
    } else if (tttCurrentPlayer === 'O' && checkTTTWin()) {
        tttScores['O']++;
    } else if (checkTTTTie()) {
        tttScores['ties']++;
    }
    
    // Update score display
    const xScoreEl = document.getElementById('tttXScore');
    const oScoreEl = document.getElementById('tttOScore');
    const tiesEl = document.getElementById('tttTies');
    
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
        saveGameResult(true);
        triggerConfetti();
    } else if (message.includes('O wins') && tttMode === 'ai') {
        saveGameResult(false);
    }
    
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
        }
    }
}

// ========== SETTINGS & PREFERENCES ==========
function initSettings() {
    const resetStatsBtn = document.getElementById('resetStats');
    const soundToggle = document.getElementById('soundToggle');
    const vibrationToggle = document.getElementById('vibrationToggle');
    
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all game statistics? This cannot be undone.')) {
                localStorage.removeItem('totalWins');
                localStorage.removeItem('totalGames');
                totalWins = 0;
                totalGames = 0;
                updateDashboardStats();
                alert('Statistics have been reset.');
            }
        });
    }
    
    if (soundToggle) {
        const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        soundToggle.checked = soundEnabled;
        
        soundToggle.addEventListener('change', () => {
            localStorage.setItem('soundEnabled', soundToggle.checked);
        });
    }
    
    if (vibrationToggle) {
        const vibrationEnabled = localStorage.getItem('vibrationEnabled') !== 'false';
        vibrationToggle.checked = vibrationEnabled;
        
        vibrationToggle.addEventListener('change', () => {
            localStorage.setItem('vibrationEnabled', vibrationToggle.checked);
        });
    }
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    initTheme();
    initNavigation();
    updateDashboardStats();
    initSettings();
    
    // Initialize games
    initRPSGame();
    initMemoryGame();
    initTTTGame();
    
    // Add CSS for confetti animation
    if (!document.querySelector('#confetti-styles')) {
        const style = document.createElement('style');
        style.id = 'confetti-styles';
        style.textContent = `
            @keyframes fall {
                to {
                    transform: translateY(100vh) rotate(360deg);
                    opacity: 0;
                }
            }
            
            .confetti {
                position: absolute;
                width: 10px;
                height: 10px;
                background: var(--primary-color);
                border-radius: 50%;
                animation: fall 2s linear forwards;
                z-index: 1000;
            }
        `;
        document.head.appendChild(style);
    }
    
    console.log('GameHub initialized successfully! 🎮');
});

// ========== UTILITY FUNCTIONS ==========
function vibrate(pattern = 100) {
    if (navigator.vibrate && localStorage.getItem('vibrationEnabled') !== 'false') {
        navigator.vibrate(pattern);
    }
}

function playSound(soundType) {
    if (localStorage.getItem('soundEnabled') === 'false') return;
    
    // Simple sound effects using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch(soundType) {
            case 'win':
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
                break;
            case 'click':
                oscillator.frequency.setValueAtTime(261.63, audioContext.currentTime); // C4
                break;
            case 'match':
                oscillator.frequency.setValueAtTime(392.00, audioContext.currentTime); // G4
                break;
        }
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Audio not supported:', error);
    }
}