// ========== SUPABASE INITIALIZATION ==========
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== DOM ELEMENTS ==========
const userNameSpan = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const coinCountSpan = document.getElementById('coin-count');
const gamesWonSpan = document.getElementById('games-won');
const gamesTiedSpan = document.getElementById('games-tied');
const totalCoinsSpan = document.getElementById('total-coins');

// Game mode buttons
const vsAiBtn = document.getElementById('vs-ai-btn');
const vsFriendBtn = document.getElementById('vs-friend-btn');
const joinRoomBtn = document.getElementById('join-room-btn');

// Room setup elements
const backToMenuBtn = document.getElementById('back-to-menu');
const roundsSelect = document.getElementById('rounds-select');
const createRoomBtn = document.getElementById('create-room-btn');

// Join room elements
const backToMenuBtn2 = document.getElementById('back-to-menu2');
const joinRoomCodeInput = document.getElementById('join-room-code');
const joinRoomSubmitBtn = document.getElementById('join-room-submit-btn');
const quickRoomBtns = document.querySelectorAll('.quick-room-btn');

// Game area elements
const roomInfo = document.getElementById('room-info');
const roomIdSpan = document.getElementById('room-id');
const playerScoreSpan = document.getElementById('player-score');
const opponentScoreSpan = document.getElementById('opponent-score');
const currentRoundSpan = document.getElementById('current-round');
const totalRoundsSpan = document.getElementById('total-rounds');
const choiceBtns = document.querySelectorAll('.choice-btn');
const opponentChoiceDiv = document.getElementById('opponent-choice');
const resultDiv = document.getElementById('result');
const resultText = document.getElementById('result-text');
const playAgainBtn = document.getElementById('play-again-btn');
const backToMenuFromGameBtn = document.getElementById('back-to-menu-from-game');

// ========== GAME STATE ==========
let user = null;
let coins = 100;
let gamesWon = 0;
let gamesTied = 0;
let gameMode = null;
let playerChoice = null;
let opponentChoiceValue = null;
let roomId = null;
let totalRounds = 5;
let currentRound = 1;
let playerScore = 0;
let opponentScore = 0;
let isHost = false;

// ========== HELPER FUNCTIONS ==========
function updateUserDisplay() {
    if (user && userNameSpan) {
        userNameSpan.textContent = user.name || user.email;
    }
    
    if (coinCountSpan) coinCountSpan.textContent = coins;
    if (totalCoinsSpan) totalCoinsSpan.textContent = coins;
    if (gamesWonSpan) gamesWonSpan.textContent = gamesWon;
    if (gamesTiedSpan) gamesTiedSpan.textContent = gamesTied;
}

function showSection(sectionId) {
    // Hide all sections
    const sections = ['menu', 'room-setup', 'join-room-form', 'game-area'];
    sections.forEach(id => {
        const section = document.getElementById(id);
        if (section) section.style.display = 'none';
    });
    
    // Show requested section
    const section = document.getElementById(sectionId);
    if (section) section.style.display = 'block';
}

function resetGame() {
    playerChoice = null;
    opponentChoiceValue = null;
    currentRound = 1;
    playerScore = 0;
    opponentScore = 0;
    
    if (playerScoreSpan) playerScoreSpan.textContent = '0';
    if (opponentScoreSpan) opponentScoreSpan.textContent = '0';
    if (currentRoundSpan) currentRoundSpan.textContent = '1';
    if (totalRoundsSpan) totalRoundsSpan.textContent = totalRounds;
    
    // Reset choice buttons
    choiceBtns.forEach(btn => {
        btn.classList.remove('selected');
        btn.disabled = false;
    });
    
    // Hide result
    if (resultDiv) resultDiv.style.display = 'none';
    
    // Reset opponent display
    if (opponentChoiceDiv) {
        opponentChoiceDiv.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <p>Waiting for opponent's choice...</p>
        `;
    }
}

function generateRoomId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function copyRoomId() {
    if (!roomId) return;
    
    navigator.clipboard.writeText(roomId).then(() => {
        alert('Room ID copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function getChoiceEmoji(choice) {
    switch (choice) {
        case 'rock': return '🪨';
        case 'paper': return '📄';
        case 'scissors': return '✂️';
        default: return '';
    }
}

// ========== GAME LOGIC ==========
function startGame(mode) {
    gameMode = mode;
    totalRounds = parseInt(roundsSelect.value) || 5;
    
    if (mode === 'friend') {
        roomId = generateRoomId();
        if (roomIdSpan) roomIdSpan.textContent = roomId;
        if (roomInfo) roomInfo.style.display = 'block';
        isHost = true;
        
        // Show room info
        alert(`🎮 Room Created!\n\nRoom Code: ${roomId}\n\nShare this code with your friend!`);
    } else if (mode === 'join') {
        const roomCode = joinRoomCodeInput ? joinRoomCodeInput.value.trim().toUpperCase() : '';
        if (!roomCode) {
            alert('Please enter a room code');
            return;
        }
        roomId = roomCode;
        if (roomIdSpan) roomIdSpan.textContent = roomId;
        if (roomInfo) roomInfo.style.display = 'block';
        isHost = false;
        
        alert(`🎯 Joined Room: ${roomId}\n\nWaiting for game to start...`);
    }
    
    resetGame();
    showSection('game-area');
}

function makeChoice(choice) {
    if (playerChoice) return;
    
    playerChoice = choice;
    
    // Update UI
    choiceBtns.forEach(btn => {
        if (btn.dataset.choice === choice) {
            btn.classList.add('selected');
        } else {
            btn.disabled = true;
        }
    });
    
    if (gameMode === 'ai') {
        playVsAI();
    } else {
        // For multiplayer, simulate opponent after delay
        opponentChoiceDiv.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <p>Waiting for opponent's choice...</p>
        `;
        
        setTimeout(() => {
            const choices = ['rock', 'paper', 'scissors'];
            opponentChoiceValue = choices[Math.floor(Math.random() * 3)];
            opponentChoiceDiv.innerHTML = `
                <i class="fas fa-user-friends"></i>
                <p>Opponent chose: ${getChoiceEmoji(opponentChoiceValue)}</p>
            `;
            checkResult();
        }, 2000);
    }
}

function playVsAI() {
    const aiChoices = ['rock', 'paper', 'scissors'];
    
    let counter = 0;
    const interval = setInterval(() => {
        const randomChoice = aiChoices[Math.floor(Math.random() * 3)];
        opponentChoiceDiv.innerHTML = `
            <i class="fas fa-robot"></i>
            <p>AI is thinking... ${getChoiceEmoji(randomChoice)}</p>
        `;
        counter++;
        
        if (counter >= 5) {
            clearInterval(interval);
            opponentChoiceValue = aiChoices[Math.floor(Math.random() * 3)];
            opponentChoiceDiv.innerHTML = `
                <i class="fas fa-robot"></i>
                <p>AI chose: ${getChoiceEmoji(opponentChoiceValue)}</p>
            `;
            checkResult();
        }
    }, 200);
}

function checkResult() {
    if (!playerChoice || !opponentChoiceValue) return;

    let resultMessage = '';
    let roundResult = '';

    if (playerChoice === opponentChoiceValue) {
        resultMessage = `Round ${currentRound}: 🤝 It
