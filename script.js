// Supabase configuration - Replace with your actual Supabase project details
const SUPABASE_URL = 'https://dbkavoetrfxonpkscqvv.supabase.co'; // e.g., 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_ODfJQ5yQR9C_FTu792TgaQ_MDApI3gv'; // Your anon key

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
const authContainer = document.getElementById('auth-container');
const gameContainer = document.getElementById('game-container');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const authMessage = document.getElementById('auth-message');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
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
let currentUser = null;
let gameMode = null; // 'ai' or 'friend' or 'join'
let playerChoice = null;
let opponentChoiceValue = null;
let roomId = null;
let channel = null;
let totalRounds = 3;
let currentRound = 1;
let playerScore = 0;
let opponentScore = 0;
let isHost = false;

// Authentication functions
async function login(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        if (error) throw error;
        currentUser = data.user;
        showGame();
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function register(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });
        if (error) throw error;
        return { success: true, message: 'Registration successful! Please check your email to confirm your account.' };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
    showAuth();
}

// Game functions
function showAuth() {
    authContainer.style.display = 'block';
    gameContainer.style.display = 'none';
    resetGame();
}

function showGame() {
    authContainer.style.display = 'none';
    gameContainer.style.display = 'block';
    userEmail.textContent = currentUser.email;
    showMenu();
}

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
    if (channel) {
        channel.unsubscribe();
        channel = null;
    }
}

function startGame(mode) {
    gameMode = mode;
    gameArea.style.display = 'block';
    if (mode === 'friend' || mode === 'join') {
        startMultiplayerGame();
    } else {
        // AI mode - no additional setup needed
    }
}

function startMultiplayerGame() {
    roomId = generateRoomId();
    roomIdSpan.textContent = roomId;
    roomInfo.style.display = 'block';

    // Create Supabase realtime channel for the room
    channel = supabase.channel(`game-${roomId}`);
    channel
        .on('broadcast', { event: 'choice' }, ({ payload }) => {
            if (payload.userId !== currentUser.id) {
                opponentChoiceValue = payload.choice;
                checkResult();
            }
        })
        .subscribe();
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
    } else {
        // Send choice to opponent via Supabase channel
        channel.send({
            type: 'broadcast',
            event: 'choice',
            payload: { userId: currentUser.id, choice: choice }
        });
        opponentChoice.textContent = 'Waiting for opponent...';
    }
}

function playVsAI() {
    const aiChoices = ['rock', 'paper', 'scissors'];
    opponentChoiceValue = aiChoices[Math.floor(Math.random() * 3)];
    setTimeout(() => {
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

    // Check if game is over
    if (currentRound >= totalRounds) {
        let gameResult = '';
        if (playerScore > opponentScore) {
            gameResult = '🎉 You won the game!';
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

// Event listeners
loginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    const result = await login(email, password);
    if (!result.success) {
        authMessage.textContent = result.message;
    }
});

registerBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    const result = await register(email, password);
    authMessage.textContent = result.message;
    if (result.success) {
        authMessage.style.color = 'green';
    } else {
        authMessage.style.color = 'red';
    }
});

logoutBtn.addEventListener('click', logout);

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

playAgainBtn.addEventListener('click', resetGame);

// Check for existing session on page load
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        currentUser = session.user;
        showGame();
    } else {
        showAuth();
    }
});

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        currentUser = session.user;
        showGame();
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        showAuth();
    }
});
