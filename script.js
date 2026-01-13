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
    element.style.display = 'block';
}

function hideElement(element) {
    element.style.display = 'none';
}

function showAuthMessage(message, type = 'info') {
    authMessage.textContent = message;
    authMessage.className = `message ${type}`;
}

function showRegisterMessage(message, type = 'info') {
    registerMessage.textContent = message;
    registerMessage.className = `message ${type}`;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function checkPasswordStrength(password) {
    if (password.length === 0) return '';
    if (password.length < 6) return 'weak';
    if (password.length < 8) return 'medium';
    return 'strong';
}

function updateCoinDisplay() {
    coinCountSpan.textContent = coins;
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
async function loginWithEmail() {
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;

    if (!email || !password) {
        showAuthMessage('Please fill in all fields', 'error');
        return;
    }

    try {
        loginBtn.disabled = true;
        loginBtn.innerHTML = 'Logging in...';
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        if (data.user) {
            // Simpan user data sederhana
            user = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || 'Player'
            };
            
            showGameContainer();
            showAuthMessage('Login successful!', 'success');
            
            // Auto-hide message
            setTimeout(() => {
                authMessage.textContent = '';
            }, 2000);
        }
    } catch (error) {
        console.error('Login error:', error);
        showAuthMessage('Invalid email or password', 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Login';
    }
}

async function registerWithEmail() {
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
        registerBtn.innerHTML = 'Creating account...';
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name
                }
            }
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                throw new Error('Email already registered. Please login.');
            }
            throw authError;
        }

        showRegisterMessage('Registration successful! Please login.', 'success');
        
        // Switch to login form
        setTimeout(() => {
            hideElement(registerForm);
            showElement(loginForm);
            loginEmailInput.value = email;
            registerMessage.textContent = '';
            authMessage.textContent = 'Account created! Please login.';
            authMessage.className = 'message success';
        }, 1500);

    } catch (error) {
        console.error('Registration error:', error);
        showRegisterMessage(error.message || 'Registration failed', 'error');
    } finally {
        registerBtn.disabled = false;
        registerBtn.innerHTML = 'Register';
    }
}

async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        user = null;
        showAuthContainer();
        resetGame();
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
    
    authMessage.textContent = '';
    registerMessage.textContent = '';
}

function showGameContainer() {
    hideElement(authContainer);
    showElement(gameContainer);
    
    // Set user info
    if (user) {
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
        btn.disabled = false;
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
        // For multiplayer, simulate opponent choice after delay
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
    
    // Show AI thinking animation
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

    // Check if game is over
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
// Setup semua event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Auth event listeners
    if (loginBtn) {
        loginBtn.addEventListener('click', loginWithEmail);
        console.log('Login button listener added');
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', registerWithEmail);
        console.log('Register button listener added');
    }
    
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            hideElement(loginForm);
            showElement(registerForm);
            authMessage.textContent = '';
        });
        console.log('Show register link listener added');
    }
    
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            hideElement(registerForm);
            showElement(loginForm);
            registerMessage.textContent = '';
        });
        console.log('Show login link listener added');
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', signOut);
    }
    
    // Game event listeners
    if (vsAiBtn) {
        vsAiBtn.addEventListener('click', function() {
            gameMode = 'ai';
            startGame('ai');
        });
    }
    
    if (vsFriendBtn) {
        vsFriendBtn.addEventListener('click', showRoomSetup);
    }
    
    if (joinRoomBtn) {
        joinRoomBtn.addEventListener('click', showJoinRoomForm);
    }
    
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', function() {
            startGame('friend');
        });
    }
    
    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', showMenu);
    }
    
    if (backToMenuBtn2) {
        backToMenuBtn2.addEventListener('click', showMenu);
    }
    
    if (joinRoomSubmitBtn) {
        joinRoomSubmitBtn.addEventListener('click', function() {
            gameMode = 'join';
            startGame('join');
        });
    }
    
    // Choice buttons
    choiceBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            makeChoice(this.dataset.choice);
        });
    });
    
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', function() {
            resetGame();
            showMenu();
        });
    }
    
    // Form input listeners
    if (registerPasswordInput) {
        registerPasswordInput.addEventListener('input', function() {
            const strength = checkPasswordStrength(this.value);
            if (passwordStrengthIndicator) {
                passwordStrengthIndicator.className = `password-strength ${strength}`;
            }
        });
    }
    
    // Enter key for forms
    if (loginPasswordInput) {
        loginPasswordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginWithEmail();
            }
        });
    }
    
    if (registerPasswordInput) {
        registerPasswordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                registerWithEmail();
            }
        });
    }
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
