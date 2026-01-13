// ========== SUPABASE INITIALIZATION ==========
console.log('Initializing Supabase...');
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
    if (element) {
        element.style.display = 'block';
        console.log('Showing element:', element.id);
    }
}

function hideElement(element) {
    if (element) {
        element.style.display = 'none';
        console.log('Hiding element:', element.id);
    }
}

function showAuthMessage(message, type = 'info') {
    if (authMessage) {
        authMessage.textContent = message;
        authMessage.className = `message ${type}`;
        console.log('Auth message:', message);
    }
}

function showRegisterMessage(message, type = 'info') {
    if (registerMessage) {
        registerMessage.textContent = message;
        registerMessage.className = `message ${type}`;
        console.log('Register message:', message);
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
    if (coinCountSpan) {
        coinCountSpan.textContent = coins;
        console.log('Coins updated:', coins);
    }
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
    console.log('🔑 Login button clicked');
    
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;

    if (!email || !password) {
        showAuthMessage('Please fill in all fields', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showAuthMessage('Please enter a valid email address', 'error');
        return;
    }

    try {
        // Show loading state
        const originalText = loginBtn.textContent;
        loginBtn.innerHTML = '<span class="loading"></span> Logging in...';
        loginBtn.disabled = true;
        
        showAuthMessage('Logging in...', 'info');
        
        console.log('Attempting login for:', email);
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('Login error:', error);
            throw error;
        }

        console.log('Login successful:', data.user);
        
        if (data.user) {
            user = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || 'Player'
            };
            
            showGameContainer();
            showAuthMessage('✅ Login successful! Welcome back!', 'success');
            
            setTimeout(() => {
                showAuthMessage('', 'success');
            }, 3000);
        }
    } catch (error) {
        console.error('Login failed:', error);
        let errorMessage = 'Invalid email or password';
        
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Please confirm your email address first.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showAuthMessage(errorMessage, 'error');
    } finally {
        // Reset button state
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
}

async function handleRegister(e) {
    if (e) e.preventDefault();
    console.log('📝 Register button clicked');
    
    const name = registerNameInput.value.trim();
    const email = registerEmailInput.value.trim();
    const password = registerPasswordInput.value;

    // Validation
    if (!name || !email || !password) {
        showRegisterMessage('❌ Please fill in all fields', 'error');
        return;
    }

    if (password.length < 6) {
        showRegisterMessage('❌ Password must be at least 6 characters', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showRegisterMessage('❌ Please enter a valid email address', 'error');
        return;
    }

    try {
        // Show loading state
        const originalText = registerBtn.textContent;
        registerBtn.innerHTML = '<span class="loading"></span> Creating account...';
        registerBtn.disabled = true;
        
        showRegisterMessage('Creating your account...', 'info');
        
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
            console.error('Registration error:', authError);
            
            if (authError.message.includes('already registered') || authError.code === 'user_already_exists') {
                throw new Error('📧 This email is already registered. Please login instead.');
            } else if (authError.message.includes('password')) {
                throw new Error('🔒 Password is too weak. Please use a stronger password.');
            } else {
                throw authError;
            }
        }

        console.log('Registration successful:', authData);
        
        showRegisterMessage('✅ Registration successful! You can now login with your credentials.', 'success');
        
        // Switch to login form after delay
        setTimeout(() => {
            hideElement(registerForm);
            showElement(loginForm);
            loginEmailInput.value = email;
            loginPasswordInput.value = '';
            showRegisterMessage('', 'success');
            showAuthMessage('🎉 Account created! Please login with your new account.', 'success');
            
            // Clear register form
            registerNameInput.value = '';
            registerEmailInput.value = '';
            registerPasswordInput.value = '';
            passwordStrengthIndicator.className = 'password-strength';
        }, 2000);

    } catch (error) {
        console.error('Registration failed:', error);
        showRegisterMessage(error.message || '❌ Registration failed. Please try again.', 'error');
    } finally {
        // Reset button state
        registerBtn.disabled = false;
        registerBtn.textContent = 'Create Account';
    }
}

async function signOut(e) {
    if (e) e.preventDefault();
    console.log('🚪 Logging out...');
    
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        user = null;
        coins = 100;
        showAuthContainer();
        resetGame();
        showAuthMessage('👋 Logged out successfully', 'success');
        
        setTimeout(() => {
            showAuthMessage('', 'success');
        }, 2000);
    } catch (error) {
        console.error('Logout error:', error);
        showAuthMessage('❌ Error signing out. Please try again.', 'error');
    }
}

function showAuthContainer() {
    console.log('Showing auth container');
    showElement(authContainer);
    hideElement(gameContainer);
    showElement(loginForm);
    hideElement(registerForm);
    
    // Clear forms
    if (loginEmailInput) loginEmailInput.value = '';
    if (loginPasswordInput) loginPasswordInput.value = '';
    if (registerNameInput) registerNameInput.value = '';
    if (registerEmailInput) registerEmailInput.value = '';
    if (registerPasswordInput) registerPasswordInput.value = '';
    
    showAuthMessage('', 'info');
    showRegisterMessage('', 'info');
    
    // Reset password strength indicator
    if (passwordStrengthIndicator) {
        passwordStrengthIndicator.className = 'password-strength';
    }
}

function showGameContainer() {
    console.log('Showing game container for user:', user);
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
    console.log('Showing menu');
    showElement(menu);
    hideElement(roomSetup);
    hideElement(joinRoomForm);
    hideElement(gameArea);
    resetGame();
}

function showRoomSetup() {
    console.log('Showing room setup');
    hideElement(menu);
    showElement(roomSetup);
    hideElement(joinRoomForm);
    hideElement(gameArea);
}

function showJoinRoomForm() {
    console.log('Showing join room form');
    hideElement(menu);
    hideElement(roomSetup);
    showElement(joinRoomForm);
    hideElement(gameArea);
}

function resetGame() {
    console.log('Resetting game');
    hideElement(gameArea);
    hideElement(roomInfo);
    hideElement(result);
    if (opponentChoice) opponentChoice.textContent = 'Opponent is choosing...';
    
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
    console.log('Starting game mode:', mode);
    gameMode = mode;
    
    if (mode === 'friend') {
        roomId = generateRoomId();
        if (roomIdSpan) roomIdSpan.textContent = roomId;
        showElement(roomInfo);
        alert(`🎮 Room created!\n\nRoom Code: ${roomId}\n\nShare this code with your friend to play together!`);
    } else if (mode === 'join') {
        const roomCode = joinRoomCodeInput.value.trim().toUpperCase();
        if (!roomCode) {
            alert('❌ Please enter a room code');
            return;
        }
        roomId = roomCode;
        if (roomIdSpan) roomIdSpan.textContent = roomId;
        showElement(roomInfo);
        alert(`🎯 Joined room: ${roomId}\n\nWaiting for the game to start...`);
    }
    
    totalRounds = parseInt(roundsSelect.value);
    showElement(gameArea);
}

function generateRoomId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function makeChoice(choice) {
    if (playerChoice) return;
    
    console.log('Player chose:', choice);
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
        opponentChoice.textContent = '⏳ Waiting for opponent...';
        setTimeout(() => {
            const choices = ['rock', 'paper', 'scissors'];
            opponentChoiceValue = choices[Math.floor(Math.random() * 3)];
            opponentChoice.textContent = `👤 Opponent chose: ${getChoiceEmoji(opponentChoiceValue)}`;
            checkResult();
        }, 2000);
    }
}

function playVsAI() {
    const aiChoices = ['rock', 'paper', 'scissors'];
    
    let counter = 0;
    const interval = setInterval(() => {
        const randomChoice = aiChoices[Math.floor(Math.random() * 3)];
        opponentChoice.textContent = `🤖 AI is thinking... ${getChoiceEmoji(randomChoice)}`;
        counter++;
        
        if (counter >= 5) {
            clearInterval(interval);
            opponentChoiceValue = aiChoices[Math.floor(Math.random() * 3)];
            opponentChoice.textContent = `🤖 AI chose: ${getChoiceEmoji(opponentChoiceValue)}`;
            checkResult();
        }
    }, 200);
}

function checkResult() {
    if (!playerChoice || !opponentChoiceValue) return;

    let resultMessage = '';

    if (playerChoice === opponentChoiceValue) {
        resultMessage = `Round ${currentRound}: 🤝 It's a tie!`;
    } else if (
        (playerChoice === 'rock' && opponentChoiceValue === 'scissors') ||
        (playerChoice === 'paper' && opponentChoiceValue === 'rock') ||
        (playerChoice === 'scissors' && opponentChoiceValue === 'paper')
    ) {
        resultMessage = `Round ${currentRound}: 🎉 You win!`;
        playerScore++;
    } else {
        resultMessage = `Round ${currentRound}: 😞 You lose!`;
        opponentScore++;
    }

    // Check if game is over
    if (currentRound >= totalRounds) {
        let gameResult = '';
        if (playerScore > opponentScore) {
            gameResult = '🏆 You won the game!';
            coins += 10;
        } else if (opponentScore > playerScore) {
            gameResult = '😔 You lost the game!';
        } else {
            gameResult = '🤝 The game is a tie!';
            coins += 5;
        }
        
        resultMessage += `<br><br><strong>Final Score:</strong><br>You: ${playerScore} - ${opponentScore}: ${gameMode === 'ai' ? 'AI' : 'Opponent'}<br><br>${gameResult}`;
        if (playAgainBtn) playAgainBtn.textContent = '🔄 Play Again';
        updateCoinDisplay();
        
        // Show coin reward
        if (playerScore > opponentScore) {
            resultMessage += `<br><br>💰 +10 coins! Total: ${coins} coins`;
        } else if (playerScore === opponentScore) {
            resultMessage += `<br><br>💰 +5 coins! Total: ${coins} coins`;
        }
    } else {
        resultMessage += `<br><br><strong>Current Score:</strong><br>You: ${playerScore} - ${opponentScore}: ${gameMode === 'ai' ? 'AI' : 'Opponent'}`;
        playAgainBtn.textContent = '⏭️ Next Round';
        currentRound++;
    }

    if (resultText) resultText.innerHTML = resultMessage;
    showElement(result);
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Auth event listeners
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
        console.log('✅ Login button listener added');
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', handleRegister);
        console.log('✅ Register button listener added');
    }
    
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📝 Switching to register form');
            hideElement(loginForm);
            showElement(registerForm);
            showAuthMessage('');
            
            // Auto-fill email if login email exists
            if (loginEmailInput.value && validateEmail(loginEmailInput.value)) {
                registerEmailInput.value = loginEmailInput.value;
            }
            
            // Focus on name input
            setTimeout(() => {
                registerNameInput.focus();
            }, 100);
        });
        console.log('✅ Show register link listener added');
    }
    
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔑 Switching to login form');
            hideElement(registerForm);
            showElement(loginForm);
            showRegisterMessage('');
            
            // Focus on email input
            setTimeout(() => {
                loginEmailInput.focus();
            }, 100);
        });
        console.log('✅ Show login link listener added');
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', signOut);
        console.log('✅ Logout button listener added');
    }
    
    // Game event listeners
    if (vsAiBtn) {
        vsAiBtn.addEventListener('click', () => {
            console.log('🤖 AI mode selected');
            gameMode = 'ai';
            startGame('ai');
        });
        console.log('✅ VS AI button listener added');
    }
    
    if (vsFriendBtn) {
        vsFriendBtn.addEventListener('click', showRoomSetup);
        console.log('✅ VS Friend button listener added');
    }
    
    if (joinRoomBtn) {
        joinRoomBtn.addEventListener('click', showJoinRoomForm);
        console.log('✅ Join Room button listener added');
    }
    
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', () => {
            console.log('🎮 Creating room');
            startGame('friend');
        });
        console.log('✅ Create Room button listener added');
    }
    
    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', showMenu);
        console.log('✅ Back to menu button listener added');
    }
    
    if (backToMenuBtn2) {
        backToMenuBtn2.addEventListener('click', showMenu);
        console.log('✅ Back to menu button 2 listener added');
    }
    
    if (joinRoomSubmitBtn) {
        joinRoomSubmitBtn.addEventListener('click', () => {
            console.log('🎯 Joining room');
            gameMode = 'join';
            startGame('join');
        });
        console.log('✅ Join room submit button listener added');
    }
    
    // Choice buttons
    choiceBtns.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            console.log('🎯 Choice button clicked:', this.dataset.choice);
            makeChoice(this.dataset.choice);
        });
        console.log(`✅ Choice button ${index + 1} listener added`);
    });
    
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', function() {
            console.log('🔄 Play again clicked');
            resetGame();
            showMenu();
        });
        console.log('✅ Play again button listener added');
    }
    
    // Form input listeners
    if (registerPasswordInput) {
        registerPasswordInput.addEventListener('input', function() {
            const strength = checkPasswordStrength(this.value);
            if (passwordStrengthIndicator) {
                passwordStrengthIndicator.className = `password-strength ${strength}`;
            }
        });
        console.log('✅ Password strength listener added');
    }
    
    // Enter key for forms
    if (loginPasswordInput) {
        loginPasswordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                console.log('⏎ Enter pressed on login');
                handleLogin();
            }
        });
    }
    
    if (registerPasswordInput) {
        registerPasswordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                console.log('⏎ Enter pressed on register');
                handleRegister();
            }
        });
    }
    
    // Real-time input validation
    if (registerEmailInput) {
        registerEmailInput.addEventListener('blur', function() {
            if (this.value && !validateEmail(this.value)) {
                this.style.borderColor = '#ff6b6b';
                this.style.boxShadow = '0 0 0 3px rgba(255, 107, 107, 0.1)';
            } else if (this.value && validateEmail(this.value)) {
                this.style.borderColor = '#4CAF50';
                this.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.1)';
            } else {
                this.style.borderColor = '#e2e8f0';
                this.style.boxShadow = 'none';
            }
        });
    }
}

// ========== INITIALIZATION ==========
async function initializeApp() {
    console.log('🚀 Initializing Suit Game...');
    
    // Setup semua event listeners
    setupEventListeners();
    
    // Check auth state
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && session.user) {
            console.log('✅ User already logged in:', session.user.email);
            user = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || 'Player'
            };
            showGameContainer();
        } else {
            console.log('ℹ️ No user session found');
            showAuthContainer();
        }
        
        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔐 Auth state changed:', event);
            
            if (event === 'SIGNED_IN' && session) {
                console.log('✅ User signed in:', session.user.email);
                user = {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.name || 'Player'
                };
                showGameContainer();
            } else if (event === 'SIGNED_OUT') {
                console.log('👋 User signed out');
                user = null;
                showAuthContainer();
            } else if (event === 'USER_UPDATED') {
                console.log('📝 User updated');
                if (session && session.user) {
                    user = {
                        id: session.user.id,
                        email: session.user.email,
                        name: session.user.user_metadata?.name || 'Player'
                    };
                    if (userNameSpan) {
                        userNameSpan.textContent = user.name || user.email;
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showAuthContainer();
        showAuthMessage('⚠️ Failed to initialize. Please refresh the page.', 'error');
    }
}

// Start the app when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM loaded, starting app...');
    initializeApp();
});

// Make functions available globally for debugging
window.debugApp = {
    showAuthContainer,
    showGameContainer,
    getState: () => ({ user, coins, gameMode }),
    testRegister: () => {
        console.log('🧪 Testing register button...');
        registerBtn.click();
    }
};
