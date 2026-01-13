// ========== SUPABASE INITIALIZATION ==========
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== DOM ELEMENTS ==========
// Auth elements
const authContainer = document.getElementById('auth-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const registerNameInput = document.getElementById('register-name');
const registerEmailInput = document.getElementById('register-email');
const registerPasswordInput = document.getElementById('register-password');
const registerBtn = document.getElementById('register-btn');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const authMessage = document.getElementById('auth-message');
const registerMessage = document.getElementById('register-message');
const passwordStrengthIndicator = document.getElementById('password-strength');

// Game elements
const gameContainer = document.getElementById('game-container');
const userNameSpan = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const coinCountSpan = document.getElementById('coin-count');
const menu = document.getElementById('menu');
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
const choiceBtns = document.querySelectorAll('.choice-btn');
const opponentChoice = document.getElementById('opponent-choice');
const result = document.getElementById('result');
const resultText = document.getElementById('result-text');
const playAgainBtn = document.getElementById('play-again-btn');

// ========== GAME STATE ==========
let user = null;
let coins = 100;
let gameMode = null;
let playerChoice = null;
let opponentChoiceValue = null;
let roomId = null;
let totalRounds = 3;
let currentRound = 1;
let playerScore = 0;
let opponentScore = 0;

// ========== HELPER FUNCTIONS ==========
function showElement(element) {
    if (element) element.style.display = 'block';
}

function hideElement(element) {
    if (element) element.style.display = 'none';
}

function showAuthMessage(message, type = 'info') {
    if (authMessage) {
        authMessage.textContent = message;
        authMessage.className = `message ${type}`;
    }
}

function showRegisterMessage(message, type = 'info') {
    if (registerMessage) {
        registerMessage.textContent = message;
        registerMessage.className = `message ${type}`;
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function checkPasswordStrength(password) {
    if (!password) return '';
    if (password.length < 6) return 'weak';
    if (password.length < 8) return 'medium';
    return 'strong';
}

function updateCoinDisplay() {
    if (coinCountSpan) coinCountSpan.textContent = coins;
}

function getChoiceEmoji(choice) {
    switch (choice) {
        case 'rock': return '🪨';
        case 'paper': return '📄';
        case 'scissors': return '✂️';
        default: return '';
    }
}

// ========== AUTH FUNCTIONS ==========
async function handleLogin(e) {
    if (e) e.preventDefault();
    console.log('Login button clicked');
    
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;

    if (!email || !password) {
        showAuthMessage('Please fill in all fields', 'error');
        return;
    }

    try {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        if (data.user) {
            user = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || 'Player'
            };
            
            showGameContainer();
            showAuthMessage('Login successful!', 'success');
            
            setTimeout(() => {
                showAuthMessage('', 'success');
            }, 2000);
        }
    } catch (error) {
        console.error('Login error:', error);
        showAuthMessage(error.message || 'Invalid email or password', 'error');
    } finally {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Login';
    }
}

async function handleRegister(e) {
    if (e) e.preventDefault();
    console.log('Register button clicked');
    
    const name = registerNameInput.value.trim();
    const email = registerEmailInput.value.trim();
    const password = registerPasswordInput.value;

    // Validation
    if (!name || !email || !password) {
        showRegisterMessage('Please fill in all fields', 'error');
        return;
    }

    if (password.length < 6) {
        showRegisterMessage('Password must be at least 6 characters', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showRegisterMessage('Please enter a valid email address', 'error');
        return;
    }

    try {
        registerBtn.disabled = true;
        registerBtn.textContent = 'Creating account...';
        
        console.log('Registering user:', { email, name });
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name,
                    created_at: new Date().toISOString()
                }
            }
        });

        if (authError) {
            console.error('Supabase auth error:', authError);
            if (authError.message.includes('already registered') || authError.code === 'user_already_exists') {
                throw new Error('This email is already registered. Please login instead.');
            }
            throw authError;
        }

        console.log('Registration successful:', authData);
        
        showRegisterMessage('Registration successful! Please login with your credentials.', 'success');
        
        // Switch to login form after delay
        setTimeout(() => {
            hideElement(registerForm);
            showElement(loginForm);
            loginEmailInput.value = email;
            showRegisterMessage('', 'success');
            showAuthMessage('Account created! Please login.', 'success');
        }, 2000);

    } catch (error) {
        console.error('Registration error:', error);
        showRegisterMessage(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Register';
    }
}

async function signOut(e) {
    if (e) e.preventDefault();
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        user = null;
        showAuthContainer();
        resetGame();
        showAuthMessage('Logged out successfully', 'success');
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out');
    }
}

function showAuthContainer() {
    showElement(authContainer);
    hideElement(gameContainer);
    showElement(loginForm);
    hideElement(registerForm);
    
    // Clear forms
    loginEmailInput.value = '';
    loginPasswordInput.value = '';
    registerNameInput.value = '';
    registerEmailInput.value = '';
    registerPasswordInput.value = '';
    
    showAuthMessage('', 'info');
    showRegisterMessage('', 'info');
}

function showGameContainer() {
    hideElement(authContainer);
    showElement(gameContainer);
    
    // Set user info
    if (user && userNameSpan) {
        userNameSpan.textContent = user.name || user.email;
    }
    
    updateCoinDisplay();
    showMenu();
}

// ========== GAME FUNCTIONS ==========
function showMenu() {
    showElement(menu);
    hideElement(roomSetup);
    hideElement(joinRoomForm);
    hideElement(gameArea);
    resetGame();
}

function showRoomSetup() {
    hideElement(menu);
    showElement(roomSetup);
    hideElement(joinRoomForm);
    hideElement(gameArea);
}

function showJoinRoomForm() {
    hideElement(menu);
    hideElement(roomSetup);
    showElement(joinRoomForm);
    hideElement(gameArea);
}

function resetGame() {
    hideElement(gameArea);
    hideElement(roomInfo);
    hideElement(result);
    opponentChoice.textContent = 'Opponent is choosing...';
    
    choiceBtns.forEach(btn => {
        btn.classList.remove('selected');
        btn.disabled = true;
    });
    
    playerChoice = null;
    opponentChoiceValue = null;
    currentRound = 1;
    playerScore = 0;
    opponentScore = 0;
}

function startGame(mode) {
    gameMode = mode;
    
    if (mode === 'friend') {
        roomId = generateRoomId();
        roomIdSpan.textContent = roomId;
        showElement(roomInfo);
        alert(`Room created! Share this code: ${roomId}`);
    } else if (mode === 'join') {
        const roomCode = joinRoomCodeInput.value.trim().toUpperCase();
        if (!roomCode) {
            alert('Please enter room code');
            return;
        }
        roomId = roomCode;
        roomIdSpan.textContent = roomId;
        showElement(roomInfo);
    }
    
    totalRounds = parseInt(roundsSelect.value);
    showElement(gameArea);
}

function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function makeChoice(choice) {
    if (playerChoice) return;
    
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
        opponentChoice.textContent = 'Waiting for opponent...';
        setTimeout(() => {
            const choices = ['rock', 'paper', 'scissors'];
            opponentChoiceValue = choices[Math.floor(Math.random() * 3)];
            opponentChoice.textContent = `Opponent chose: ${getChoiceEmoji(opponentChoiceValue)}`;
            checkResult();
        }, 2000);
    }
}

function playVsAI() {
    const aiChoices = ['rock', 'paper', 'scissors'];
    
    let counter = 0;
    const interval = setInterval(() => {
        const randomChoice = aiChoices[Math.floor(Math.random() * 3)];
        opponentChoice.textContent = `AI is thinking... ${getChoiceEmoji(randomChoice)}`;
        counter++;
        
        if (counter >= 5) {
            clearInterval(interval);
            opponentChoiceValue = aiChoices[Math.floor(Math.random() * 3)];
            opponentChoice.textContent = `AI chose: ${getChoiceEmoji(opponentChoiceValue)}`;
            checkResult();
        }
    }, 200);
}

function checkResult() {
    if (!playerChoice || !opponentChoiceValue) return;

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
    } else {
        resultMessage = "Round " + currentRound + ": You lose!";
        opponentScore++;
    }

    if (currentRound >= totalRounds) {
        let gameResult = '';
        if (playerScore > opponentScore) {
            gameResult = '🎉 You won the game!';
            coins += 10;
        } else if (opponentScore > playerScore) {
            gameResult = '😞 You lost the game!';
        } else {
            gameResult = '🤝 The game is a tie!';
            coins += 5;
        }
        
        resultMessage += `\n\nFinal Score: You ${playerScore} - ${opponentScore} ${gameMode === 'ai' ? 'AI' : 'Opponent'}\n${gameResult}`;
        playAgainBtn.textContent = 'Play Again';
        updateCoinDisplay();
    } else {
        resultMessage += `\n\nScore: You ${playerScore} - ${opponentScore} ${gameMode === 'ai' ? 'AI' : 'Opponent'}`;
        playAgainBtn.textContent = 'Next Round';
        currentRound++;
    }

    resultText.innerHTML = resultMessage.replace(/\n/g, '<br>');
    showElement(result);
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Auth event listeners
    loginBtn.addEventListener('click', handleLogin);
    registerBtn.addEventListener('click', handleRegister);
    
    showRegisterLink.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Show register link clicked');
        hideElement(loginForm);
        showElement(registerForm);
        showAuthMessage('');
    });
    
    showLoginLink.addEventListener('click', function(e) {
        e.preventDefault();
        hideElement(registerForm);
        showElement(loginForm);
        showRegisterMessage('');
    });
    
    logoutBtn.addEventListener('click', signOut);
    
    // Game event listeners
    vsAiBtn.addEventListener('click', () => {
        gameMode = 'ai';
        startGame('ai');
    });
    
    vsFriendBtn.addEventListener('click', showRoomSetup);
    joinRoomBtn.addEventListener('click', showJoinRoomForm);
    
    createRoomBtn.addEventListener('click', () => {
        startGame('friend');
    });
    
    backToMenuBtn.addEventListener('click', showMenu);
    backToMenuBtn2.addEventListener('click', showMenu);
    
    joinRoomSubmitBtn.addEventListener('click', () => {
        gameMode = 'join';
        startGame('join');
    });
    
    // Choice buttons
    choiceBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            makeChoice(this.dataset.choice);
        });
    });
    
    playAgainBtn.addEventListener('click', function() {
        resetGame();
        showMenu();
    });
    
    // Form input listeners
    registerPasswordInput.addEventListener('input', function() {
        const strength = checkPasswordStrength(this.value);
        passwordStrengthIndicator.className = `password-strength ${strength}`;
    });
    
    // Enter key for forms
    loginPasswordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    registerPasswordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleRegister();
        }
    });
}

// ========== INITIALIZATION ==========
async function initializeApp() {
    console.log('Initializing app...');
    
    // Setup semua event listeners
    setupEventListeners();
    
    // Check auth state
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && session.user) {
            user = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || 'Player'
            };
            showGameContainer();
            console.log('User already logged in');
        } else {
            showAuthContainer();
            console.log('No user session found');
        }
        
        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            
            if (event === 'SIGNED_IN' && session) {
                user = {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.name || 'Player'
                };
                showGameContainer();
            } else if (event === 'SIGNED_OUT') {
                user = null;
                showAuthContainer();
            }
        });
        
    } catch (error) {
        console.error('Initialization error:', error);
        showAuthContainer();
    }
}

// Start the app when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting app...');
    initializeApp();
});

