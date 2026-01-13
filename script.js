// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
const authContainer = document.getElementById('auth-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const googleLoginBtn = document.getElementById('google-login-btn');
const googleRegisterBtn = document.getElementById('google-register-btn');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const gameContainer = document.getElementById('game-container');
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const coinCountSpan = document.getElementById('coin-count');
const menu = document.getElementById('menu');
const modeSelection = document.getElementById('mode-selection');
const vsAiBtn = document.getElementById('vs-ai-btn');
const vsFriendBtn = document.getElementById('vs-friend-btn');
const joinRoomBtn = document.getElementById('join-room-btn');
const roomSetup = document.getElementById('room-setup');
const roundsSelect = document.getElementById('rounds-select');
const createRoomBtn = document.getElementById('create-room-btn');
const backToMenuBtn = document.getElementById('back-to-menu-btn');
const joinRoomForm = document.getElementById('join-room-form');
const joinRoomCodeInput = document.getElementById('join-room-code');
const joinRoomSubmitBtn = document.getElementById('join-room-submit-btn');
const backToMenuBtn2 = document.getElementById('back-to-menu-btn2');
const gameArea = document.getElementById('game-area');
const roomInfo = document.getElementById('room-info');
const roomIdSpan = document.getElementById('room-id');
const choices = document.getElementById('choices');
const choiceBtns = document.querySelectorAll('.choice-btn');
const opponentChoice = document.getElementById('opponent-choice');
const result = document.getElementById('result');
const resultText = document.getElementById('result-text');
const playAgainBtn = document.getElementById('play-again-btn');

// Game state
let user = null;
let coins = 0;
let gameMode = null; // 'ai' or 'friend' or 'join'
let playerChoice = null;
let opponentChoiceValue = null;
let roomId = null;
let totalRounds = 3;
let currentRound = 1;
let playerScore = 0;
let opponentScore = 0;
let isHost = false;
let gameData = null; // For local multiplayer

// Game functions
function showMenu() {
    menu.style.display = 'block';
    roomSetup.style.display = 'none';
    joinRoomForm.style.display = 'none';
    gameArea.style.display = 'none';
    resetGame();
}

function showRoomSetup() {
    menu.style.display = 'none';
    roomSetup.style.display = 'block';
    joinRoomForm.style.display = 'none';
    gameArea.style.display = 'none';
}

function showJoinRoomForm() {
    menu.style.display = 'none';
    roomSetup.style.display = 'none';
    joinRoomForm.style.display = 'block';
    gameArea.style.display = 'none';
}

function resetGame() {
    gameArea.style.display = 'none';
    roomInfo.style.display = 'none';
    result.style.display = 'none';
    opponentChoice.textContent = 'Opponent is choosing...';
    choiceBtns.forEach(btn => btn.classList.remove('selected'));
    playerChoice = null;
    opponentChoiceValue = null;
    currentRound = 1;
    playerScore = 0;
    opponentScore = 0;
    isHost = false;
    gameData = null;
}

function startGame(mode) {
    gameMode = mode;
    gameArea.style.display = 'block';

    if (mode === 'friend') {
        startLocalMultiplayerGame();
    } else if (mode === 'join') {
        joinLocalGame();
    } else {
        // AI mode - no additional setup needed
    }
}

function startLocalMultiplayerGame() {
    roomId = generateRoomId();
    roomIdSpan.textContent = roomId;
    roomInfo.style.display = 'block';

    // Create game data for local storage
    gameData = {
        roomId: roomId,
        totalRounds: totalRounds,
        currentRound: 1,
        player1Score: 0,
        player2Score: 0,
        player1Choice: null,
        player2Choice: null,
        gameStarted: true
    };

    localStorage.setItem(`suit-game-${roomId}`, JSON.stringify(gameData));
    alert(`Room created! Share this code with your friend: ${roomId}`);
}

function joinLocalGame() {
    const roomCode = joinRoomCodeInput.value.trim().toUpperCase();
    if (!roomCode) {
        alert('Please enter a room code');
        return;
    }

    const storedGame = localStorage.getItem(`suit-game-${roomCode}`);
    if (!storedGame) {
        alert('Room not found! Please check the room code.');
        return;
    }

    gameData = JSON.parse(storedGame);
    roomId = roomCode;
    roomIdSpan.textContent = roomId;
    roomInfo.style.display = 'block';
    totalRounds = gameData.totalRounds;
    currentRound = gameData.currentRound;
    playerScore = gameData.player2Score || 0;
    opponentScore = gameData.player1Score || 0;
}

function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function makeChoice(choice) {
    playerChoice = choice;
    choiceBtns.forEach(btn => {
        if (btn.dataset.choice === choice) {
            btn.classList.add('selected');
        } else {
            btn.disabled = true;
        }
    });

    if (gameMode === 'ai') {
        playVsAI();
    } else if (gameMode === 'friend') {
        // Player 1 (host) makes choice
        gameData.player1Choice = choice;
        localStorage.setItem(`suit-game-${roomId}`, JSON.stringify(gameData));
        opponentChoice.textContent = 'Waiting for Player 2...';
        checkLocalGameState();
    } else if (gameMode === 'join') {
        // Player 2 (joiner) makes choice
        gameData.player2Choice = choice;
        localStorage.setItem(`suit-game-${roomId}`, JSON.stringify(gameData));
        opponentChoice.textContent = 'Waiting for Player 1...';
        checkLocalGameState();
    }
}

function checkLocalGameState() {
    // Check if both players have made their choices
    const currentGameData = JSON.parse(localStorage.getItem(`suit-game-${roomId}`) || '{}');

    if (currentGameData.player1Choice && currentGameData.player2Choice) {
        // Both players have chosen
        if (gameMode === 'friend') {
            opponentChoiceValue = currentGameData.player2Choice;
        } else {
            opponentChoiceValue = currentGameData.player1Choice;
        }
        checkResult();
    } else {
        // Poll for opponent's choice
        setTimeout(checkLocalGameState, 1000);
    }
}

function playVsAI() {
    const aiChoices = ['rock', 'paper', 'scissors'];
    opponentChoiceValue = aiChoices[Math.floor(Math.random() * 3)];

    // Show changing random choices during the wait
    let changeCount = 0;
    const changeInterval = setInterval(() => {
        const randomChoice = aiChoices[Math.floor(Math.random() * 3)];
        opponentChoice.textContent = `AI is choosing... ${getChoiceEmoji(randomChoice)}`;
        changeCount++;
        if (changeCount >= 5) {
            clearInterval(changeInterval);
        }
    }, 200);

    setTimeout(() => {
        clearInterval(changeInterval);
        opponentChoice.textContent = `AI chose: ${getChoiceEmoji(opponentChoiceValue)}`;
        checkResult();
    }, 1000);
}

function checkResult() {
    if (!playerChoice || !opponentChoiceValue) return;

    let roundWinner = null;
    let resultMessage = '';

    if (playerChoice === opponentChoiceValue) {
        resultMessage = "Round " + currentRound + ": It's a tie!";
    } else if (
        (playerChoice === 'rock' && opponentChoiceValue === 'scissors') ||
        (playerChoice === 'paper' && opponentChoiceValue === 'rock') ||
        (playerChoice === 'scissors' && opponentChoiceValue === 'paper')
    ) {
        resultMessage = "Round " + currentRound + ": You win!";
        playerScore++;
        roundWinner = 'player';
    } else {
        resultMessage = "Round " + currentRound + ": You lose!";
        opponentScore++;
        roundWinner = 'opponent';
    }

    // Update game data for local multiplayer
    if (gameData) {
        if (gameMode === 'friend') {
            gameData.player1Score = playerScore;
            gameData.player2Score = opponentScore;
        } else {
            gameData.player2Score = playerScore;
            gameData.player1Score = opponentScore;
        }
        localStorage.setItem(`suit-game-${roomId}`, JSON.stringify(gameData));
    }

    // Check if game is over
    if (currentRound >= totalRounds) {
        let gameResult = '';
        if (playerScore > opponentScore) {
            gameResult = '🎉 You won the game!';
            // Award 1 coin for winning
            updateCoins(coins + 1);
        } else if (opponentScore > playerScore) {
            gameResult = '😞 You lost the game!';
        } else {
            gameResult = '🤝 The game is a tie!';
        }
        resultMessage += `\n\nFinal Score: You ${playerScore} - ${opponentScore} ${gameMode === 'ai' ? 'AI' : 'Opponent'}\n${gameResult}`;
        playAgainBtn.textContent = 'Play Again';
    } else {
        resultMessage += `\n\nScore: You ${playerScore} - ${opponentScore} ${gameMode === 'ai' ? 'AI' : 'Opponent'}`;
        playAgainBtn.textContent = 'Next Round';
        currentRound++;
        if (gameData) {
            gameData.currentRound = currentRound;
            localStorage.setItem(`suit-game-${roomId}`, JSON.stringify(gameData));
        }
    }

    resultText.innerHTML = resultMessage.replace(/\n/g, '<br>');
    result.style.display = 'block';
}

function getChoiceEmoji(choice) {
    switch (choice) {
        case 'rock': return '🪨';
        case 'paper': return '📄';
        case 'scissors': return '✂️';
        default: return '';
    }
}

// Auth functions
async function signInWithGoogle() {
    console.log('Sign in with Google clicked');
    try {
        console.log('Attempting to sign in with Google...');
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        console.log('OAuth response:', { data, error });
        if (error) throw error;
        console.log('Sign in initiated successfully');
    } catch (error) {
        console.error('Error signing in:', error);
        alert('Error signing in. Please try again.');
    }
}

async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        user = null;
        coins = 0;
        showAuthContainer();
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
    }
}

async function loadUserData() {
    if (!user) return;

    try {
        const { data, error } = await supabase
            .from('users')
            .select('coins')
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"

        if (data) {
            coins = data.coins;
        } else {
            // Create user record if it doesn't exist
            const { error: insertError } = await supabase
                .from('users')
                .insert([{ id: user.id, email: user.email, coins: 0 }]);

            if (insertError) throw insertError;
            coins = 0;
        }

        updateCoinDisplay();
    } catch (error) {
        console.error('Error loading user data:', error);
        alert('Error loading user data. Please refresh the page.');
    }
}

async function updateCoins(newCoins) {
    if (!user) return;

    coins = newCoins;
    updateCoinDisplay();

    try {
        const { error } = await supabase
            .from('users')
            .update({ coins: coins })
            .eq('id', user.id);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating coins:', error);
        alert('Error saving coins. Please check your connection.');
    }
}

function updateCoinDisplay() {
    coinCountSpan.textContent = coins;
}

function showAuthContainer() {
    authContainer.style.display = 'block';
    gameContainer.style.display = 'none';
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
}

function showGameContainer() {
    authContainer.style.display = 'none';
    gameContainer.style.display = 'block';
    userEmailSpan.textContent = user.email;
}

// Event listeners
vsAiBtn.addEventListener('click', () => startGame('ai'));
vsFriendBtn.addEventListener('click', () => showRoomSetup());
joinRoomBtn.addEventListener('click', () => showJoinRoomForm());

createRoomBtn.addEventListener('click', () => {
    totalRounds = parseInt(roundsSelect.value);
    gameMode = 'friend';
    isHost = true;
    startGame('friend');
});

backToMenuBtn.addEventListener('click', () => showMenu());
backToMenuBtn2.addEventListener('click', () => showMenu());

joinRoomSubmitBtn.addEventListener('click', () => {
    const roomCode = joinRoomCodeInput.value.trim().toUpperCase();
    if (roomCode) {
        roomId = roomCode;
        gameMode = 'join';
        isHost = false;
        startGame('join');
    } else {
        alert('Please enter a room code');
    }
});

choiceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (!playerChoice) {
            makeChoice(btn.dataset.choice);
        }
    });
});

playAgainBtn.addEventListener('click', () => {
    resetGame();
    showMenu();
});

// Auth event listeners
googleLoginBtn.addEventListener('click', signInWithGoogle);
googleRegisterBtn.addEventListener('click', signInWithGoogle);
showRegisterLink.addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
});
showLoginLink.addEventListener('click', () => {
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
});
logoutBtn.addEventListener('click', signOut);

// Initialize auth state
supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
        user = session.user;
        await loadUserData();
        showGameContainer();
    } else {
        user = null;
        coins = 0;
        showAuthContainer();
    }
});

// Initialize the game
showMenu();
