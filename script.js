// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements for auth
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

// Game DOM elements
const gameContainer = document.getElementById('game-container');
const userNameSpan = document.getElementById('user-name');
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
let gameMode = null;
let playerChoice = null;
let opponentChoiceValue = null;
let roomId = null;
let totalRounds = 3;
let currentRound = 1;
let playerScore = 0;
let opponentScore = 0;
let isHost = false;
let gameData = null;
let realtimeSubscription = null;

// ========== AUTHENTICATION FUNCTIONS ==========

async function loginWithEmail() {
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;

    if (!email || !password) {
        showAuthMessage('Please fill in all fields', 'error');
        return;
    }

    try {
        showAuthMessage('Logging in...', 'info');
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        if (data.user) {
            await loadUserData(data.user);
            showGameContainer();
            showAuthMessage('', 'success');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAuthMessage(error.message || 'Login failed. Please try again.', 'error');
    }
}

async function registerWithEmail() {
    const name = registerNameInput.value.trim();
    const email = registerEmailInput.value.trim();
    const password = registerPasswordInput.value;

    if (!name || !email || !password) {
        showRegisterMessage('Please fill in all fields', 'error');
        return;
    }

    if (password.length < 6) {
        showRegisterMessage('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        showRegisterMessage('Creating account...', 'info');
        
        // Register user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name
                }
            }
        });

        if (authError) throw authError;

        if (authData.user) {
            // Create user profile in database
            await createUserProfile(authData.user, name);
            
            showRegisterMessage('Registration successful! Please login.', 'success');
            
            // Switch to login form after 2 seconds
            setTimeout(() => {
                registerForm.style.display = 'none';
                loginForm.style.display = 'block';
                loginEmailInput.value = email;
                loginPasswordInput.value = '';
                authMessage.textContent = '';
            }, 2000);
        }
    } catch (error) {
        console.error('Registration error:', error);
        showRegisterMessage(error.message || 'Registration failed. Please try again.', 'error');
    }
}

async function createUserProfile(supabaseUser, name) {
    try {
        const { error } = await supabase
            .from('profiles')
            .insert({
                id: supabaseUser.id,
                email: supabaseUser.email,
                name: name,
                coins: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
    } catch (error) {
        console.error('Error creating profile:', error);
        // Profile will be created on first login if this fails
    }
}

async function signOut() {
    try {
        // Unsubscribe from realtime updates
        if (realtimeSubscription) {
            supabase.removeSubscription(realtimeSubscription);
        }
        
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        user = null;
        coins = 0;
        showAuthContainer();
        resetGame();
        clearAuthForms();
    } catch (error) {
        console.error('Error signing out:', error);
        showAuthMessage('Error signing out. Please try again.', 'error');
    }
}

// Check auth state on page load
async function checkAuthState() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        await loadUserData(session.user);
        showGameContainer();
    } else {
        showAuthContainer();
    }
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            await loadUserData(session.user);
            showGameContainer();
        } else if (event === 'SIGNED_OUT') {
            user = null;
            coins = 0;
            showAuthContainer();
            resetGame();
            clearAuthForms();
        }
    });
}

async function loadUserData(supabaseUser) {
    try {
        // Get user profile from database
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
        }

        user = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: profile?.name || supabaseUser.user_metadata?.name || 'Player',
            coins: profile?.coins || 0
        };
        
        coins = user.coins;
        updateCoinDisplay();
        userNameSpan.textContent = user.name;

        // Create profile if doesn't exist
        if (!profile) {
            await createUserProfile(supabaseUser, user.name);
        }
        
    } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback
        user = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.user_metadata?.name || 'Player',
            coins: 0
        };
        coins = 0;
        updateCoinDisplay();
        userNameSpan.textContent = user.name;
    }
}

async function updateCoins(newCoins) {
    if (!user) return;

    coins = newCoins;
    updateCoinDisplay();

    // Update coins in database
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ 
                coins: newCoins,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating coins:', error);
    }
}

function updateCoinDisplay() {
    coinCountSpan.textContent = coins;
}

// ========== GAME FUNCTIONS ==========
// (Sama seperti sebelumnya, tetapi dengan email/password auth)

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
    choiceBtns.forEach(btn => {
        btn.classList.remove('selected');
        btn.disabled = false;
    });
    playerChoice = null;
    opponentChoiceValue = null;
    currentRound = 1;
    playerScore = 0;
    opponentScore = 0;
    isHost = false;
    gameData = null;
    
    if (realtimeSubscription) {
        supabase.removeSubscription(realtimeSubscription);
        realtimeSubscription = null;
    }
}

async function startGame(mode) {
    gameMode = mode;
    gameArea.style.display = 'block';

    if (mode === 'friend') {
        await startOnlineMultiplayerGame();
    } else if (mode === 'join') {
        await joinOnlineGame();
    }
    // AI mode doesn't need setup
}

async function startOnlineMultiplayerGame() {
    roomId = generateRoomId();
    roomIdSpan.textContent = roomId;
    roomInfo.style.display = 'block';

    const roomData = await createRoom(roomId, totalRounds);
    if (roomData) {
        isHost = true;
        subscribeToRoom(roomData.id);
        alert(`Room created! Share this code with your friend: ${roomId}`);
    }
}

async function joinOnlineGame() {
    const roomCode = joinRoomCodeInput.value.trim().toUpperCase();
    if (!roomCode) {
        alert('Please enter a room code');
        return;
    }

    const roomData = await joinRoom(roomCode);
    if (roomData) {
        roomId = roomCode;
        roomIdSpan.textContent = roomId;
        roomInfo.style.display = 'block';
        isHost = false;
        totalRounds = roomData.total_rounds;
        subscribeToRoom(roomData.id);
    }
}

function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function makeChoice(choice) {
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
    } else if (gameMode === 'friend' || gameMode === 'join') {
        // Update choice in database
        const updateField = isHost ? 'player1_choice' : 'player2_choice';
        
        // Get current room
        const { data: room } = await supabase
            .from('rooms')
            .select('*')
            .eq('room_code', roomId)
            .single();

        if (room) {
            await updateGameState(room.id, { [updateField]: choice });
            opponentChoice.textContent = 'Waiting for opponent...';
        }
    }
}

function playVsAI() {
    const aiChoices = ['rock', 'paper', 'scissors'];
    opponentChoiceValue = aiChoices[Math.floor(Math.random() * 3)];

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

    // Update score in database for multiplayer
    if (gameMode === 'friend' || gameMode === 'join') {
        updateMultiplayerScore(roundWinner);
    }

    // Check if game is over
    if (currentRound >= totalRounds) {
        let gameResult = '';
        if (playerScore > opponentScore) {
            gameResult = '🎉 You won the game!';
            updateCoins(coins + 1);
        } else if (opponentScore > playerScore) {
            gameResult = '😞 You lost the game!';
        } else {
            gameResult = '🤝 The game is a tie!';
        }
        resultMessage += `\n\nFinal Score: You ${playerScore} - ${opponentScore} ${gameMode === 'ai' ? 'AI' : 'Opponent'}\n${gameResult}`;
        playAgainBtn.textContent = 'Play Again';
        
        // End multiplayer game
        if (gameMode === 'friend' || gameMode === 'join') {
            endMultiplayerGame();
        }
    } else {
        resultMessage += `\n\nScore: You ${playerScore} - ${opponentScore} ${gameMode === 'ai' ? 'AI' : 'Opponent'}`;
        playAgainBtn.textContent = 'Next Round';
        currentRound++;
    }

    resultText.innerHTML = resultMessage.replace(/\n/g, '<br>');
    result.style.display = 'block';
}

// ========== SUPABASE ROOM MANAGEMENT ==========

async function createRoom(roomCode, totalRounds) {
    try {
        const { data, error } = await supabase
            .from('rooms')
            .insert({
                room_code: roomCode,
                total_rounds: totalRounds,
                host_id: user.id,
                player1_id: user.id,
                player1_score: 0,
                player2_score: 0,
                current_round: 1,
                status: 'waiting',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating room:', error);
        alert('Failed to create room. Please try again.');
        return null;
    }
}

async function joinRoom(roomCode) {
    try {
        // Check if room exists
        const { data: room, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('room_code', roomCode)
            .eq('status', 'waiting')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                alert('Room not found or already full!');
            }
            throw error;
        }

        // Join room
        const { data: updatedRoom, error: updateError } = await supabase
            .from('rooms')
            .update({
                player2_id: user.id,
                status: 'playing',
                updated_at: new Date().toISOString()
            })
            .eq('id', room.id)
            .select()
            .single();

        if (updateError) throw updateError;
        
        return updatedRoom;
    } catch (error) {
        console.error('Error joining room:', error);
        alert('Failed to join room. Please check the room code.');
        return null;
    }
}

async function updateGameState(roomId, updates) {
    try {
        const { error } = await supabase
            .from('rooms')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', roomId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating game state:', error);
        return false;
    }
}

async function updateMultiplayerScore(roundWinner) {
    try {
        const { data: room } = await supabase
            .from('rooms')
            .select('*')
            .eq('room_code', roomId)
            .single();

        if (room) {
            let updates = {
                current_round: currentRound + 1,
                player1_choice: null,
                player2_choice: null
            };

            if (isHost) {
                updates.player1_score = playerScore;
                updates.player2_score = opponentScore;
            } else {
                updates.player2_score = playerScore;
                updates.player1_score = opponentScore;
            }

            await updateGameState(room.id, updates);
        }
    } catch (error) {
        console.error('Error updating multiplayer score:', error);
    }
}

async function endMultiplayerGame() {
    try {
        const { data: room } = await supabase
            .from('rooms')
            .select('*')
            .eq('room_code', roomId)
            .single();

        if (room) {
            await updateGameState(room.id, {
                status: 'finished',
                winner_id: playerScore > opponentScore ? user.id : 
                          opponentScore > playerScore ? (isHost ? room.player2_id : room.player1_id) : null
            });
        }
    } catch (error) {
        console.error('Error ending multiplayer game:', error);
    }
}

// Real-time updates
function subscribeToRoom(roomId) {
    if (realtimeSubscription) {
        supabase.removeSubscription(realtimeSubscription);
    }

    realtimeSubscription = supabase
        .channel(`room:${roomId}`)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'rooms',
            filter: `id=eq.${roomId}`
        }, (payload) => {
            handleRoomUpdate(payload.new);
        })
        .subscribe();
}

function handleRoomUpdate(roomData) {
    if (!roomData) return;

    // Update game state based on room data
    totalRounds = roomData.total_rounds;
    currentRound = roomData.current_round;
    
    if (user.id === roomData.player1_id) {
        playerScore = roomData.player1_score;
        opponentScore = roomData.player2_score;
        opponentChoiceValue = roomData.player2_choice;
    } else {
        playerScore = roomData.player2_score;
        opponentScore = roomData.player1_score;
        opponentChoiceValue = roomData.player1_choice;
    }

    // Show opponent's choice
    if (opponentChoiceValue) {
        opponentChoice.textContent = `Opponent chose: ${getChoiceEmoji(opponentChoiceValue)}`;
        checkResult();
    }
}

// ========== HELPER FUNCTIONS ==========

function getChoiceEmoji(choice) {
    switch (choice) {
        case 'rock': return '🪨';
        case 'paper': return '📄';
        case 'scissors': return '✂️';
        default: return '';
    }
}

function showAuthContainer() {
    authContainer.style.display = 'block';
    gameContainer.style.display = 'none';
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    authMessage.textContent = '';
    registerMessage.textContent = '';
}

function showGameContainer() {
    authContainer.style.display = 'none';
    gameContainer.style.display = 'block';
    showMenu();
}

function showAuthMessage(message, type = 'info') {
    authMessage.textContent = message;
    authMessage.className = `message ${type}`;
}

function showRegisterMessage(message, type = 'info') {
    registerMessage.textContent = message;
    registerMessage.className = `message ${type}`;
}

function clearAuthForms() {
    loginEmailInput.value = '';
    loginPasswordInput.value = '';
    registerNameInput.value = '';
    registerEmailInput.value = '';
    registerPasswordInput.value = '';
    authMessage.textContent = '';
    registerMessage.textContent = '';
}

// ========== EVENT LISTENERS ==========

// Auth listeners
loginBtn.addEventListener('click', loginWithEmail);
registerBtn.addEventListener('click', registerWithEmail);

// Allow form submission with Enter key
loginPasswordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginWithEmail();
});

registerPasswordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') registerWithEmail();
});

showRegisterLink.addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    authMessage.textContent = '';
});

showLoginLink.addEventListener('click', () => {
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    registerMessage.textContent = '';
});

logoutBtn.addEventListener('click', signOut);

// Game listeners
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

// ========== INITIALIZATION ==========

checkAuthState();
