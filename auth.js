// ========== SUPABASE INITIALIZATION ==========
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== DOM ELEMENTS (Login Page) ==========
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const togglePassword = document.getElementById('toggle-password');
const authMessage = document.getElementById('auth-message');

// ========== DOM ELEMENTS (Register Page) ==========
const registerNameInput = document.getElementById('register-name');
const registerEmailInput = document.getElementById('register-email');
const registerPasswordInput = document.getElementById('register-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const registerBtn = document.getElementById('register-btn');
const toggleRegisterPassword = document.getElementById('toggle-register-password');
const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
const registerMessage = document.getElementById('register-message');
const strengthText = document.getElementById('strength-text');
const passwordMatch = document.getElementById('password-match');
const agreeTerms = document.getElementById('agree-terms');

// ========== HELPER FUNCTIONS ==========
function showMessage(element, message, type = 'info') {
    if (!element) return;
    
    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = 'block';
    
    if (type !== 'info') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function checkPasswordStrength(password) {
    if (!password) return { strength: 0, text: 'None', color: '#9ca3af' };
    
    let strength = 0;
    
    // Length check
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    let text, color;
    switch (strength) {
        case 0:
        case 1:
            text = 'Weak';
            color = '#ef4444'; // red
            break;
        case 2:
        case 3:
            text = 'Medium';
            color = '#f59e0b'; // orange
            break;
        case 4:
        case 5:
            text = 'Strong';
            color = '#10b981'; // green
            break;
        default:
            text = 'Strong';
            color = '#10b981';
    }
    
    return { strength, text, color };
}

function updatePasswordStrength() {
    const password = registerPasswordInput.value;
    const strength = checkPasswordStrength(password);
    
    if (strengthText) {
        strengthText.textContent = strength.text;
        strengthText.style.color = strength.color;
    }
    
    // Update strength meter
    const strengthMeter = document.querySelector('.strength-fill');
    if (strengthMeter) {
        strengthMeter.style.width = `${(strength.strength / 5) * 100}%`;
        strengthMeter.style.background = strength.color;
    }
}

function checkPasswordMatch() {
    const password = registerPasswordInput.value;
    const confirm = confirmPasswordInput.value;
    
    if (!passwordMatch) return;
    
    if (!confirm) {
        passwordMatch.textContent = '';
        passwordMatch.className = 'password-match';
        return;
    }
    
    if (password === confirm) {
        passwordMatch.textContent = '✓ Passwords match';
        passwordMatch.className = 'password-match valid';
    } else {
        passwordMatch.textContent = '✗ Passwords do not match';
        passwordMatch.className = 'password-match invalid';
    }
}

// ========== PASSWORD TOGGLE ==========
if (togglePassword) {
    togglePassword.addEventListener('click', function() {
        const type = loginPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        loginPasswordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}

if (toggleRegisterPassword) {
    toggleRegisterPassword.addEventListener('click', function() {
        const type = registerPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        registerPasswordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}

if (toggleConfirmPassword) {
    toggleConfirmPassword.addEventListener('click', function() {
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}

// ========== REAL-TIME VALIDATION (Register) ==========
if (registerPasswordInput) {
    registerPasswordInput.addEventListener('input', function() {
        updatePasswordStrength();
        checkPasswordMatch();
    });
}

if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);
}

// ========== LOGIN FUNCTION ==========
async function handleLogin() {
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;

    // Validation
    if (!email || !password) {
        showMessage(authMessage, 'Please fill in all fields', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showMessage(authMessage, 'Please enter a valid email address', 'error');
        return;
    }

    try {
        // Show loading state
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        loginBtn.disabled = true;
        
        showMessage(authMessage, 'Logging in...', 'info');
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        console.log('Login successful:', data.user);
        
        showMessage(authMessage, '✅ Login successful! Redirecting to game...', 'success');
        
        // Redirect to game page after delay
        setTimeout(() => {
            window.location.href = 'game.html';
        }, 1500);

    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'Login failed. Please try again.';
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Please confirm your email address first';
        }
        
        showMessage(authMessage, `❌ ${errorMessage}`, 'error');
    } finally {
        // Reset button state
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login to Game';
        }
    }
}

// ========== REGISTER FUNCTION ==========
async function handleRegister() {
    const name = registerNameInput.value.trim();
    const email = registerEmailInput.value.trim();
    const password = registerPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showMessage(registerMessage, '❌ Please fill in all fields', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage(registerMessage, '❌ Password must be at least 6 characters', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showMessage(registerMessage, '❌ Please enter a valid email address', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage(registerMessage, '❌ Passwords do not match', 'error');
        return;
    }

    if (!agreeTerms || !agreeTerms.checked) {
        showMessage(registerMessage, '❌ Please agree to the terms and conditions', 'error');
        return;
    }

    const strength = checkPasswordStrength(password);
    if (strength.text === 'Weak') {
        showMessage(registerMessage, '⚠️ Password is weak. Consider using a stronger password.', 'error');
        return;
    }

    try {
        // Show loading state
        const originalText = registerBtn.innerHTML;
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
        registerBtn.disabled = true;
        
        showMessage(registerMessage, 'Creating your account...', 'info');
        
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
            if (authError.message.includes('already registered') || authError.code === 'user_already_exists') {
                throw new Error('This email is already registered. Please login instead.');
            } else if (authError.message.includes('password')) {
                throw new Error('Password is too weak. Please use a stronger password.');
            }
            throw authError;
        }

        console.log('Registration successful:', authData);
        
        showMessage(registerMessage, '✅ Registration successful! Redirecting to login...', 'success');
        
        // Redirect to login page after delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);

    } catch (error) {
        console.error('Registration error:', error);
        showMessage(registerMessage, `❌ ${error.message || 'Registration failed. Please try again.'}`, 'error');
    } finally {
        // Reset button state
        if (registerBtn) {
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        }
    }
}

// ========== EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth page loaded');
    
    // Auto-focus on first input
    if (loginEmailInput) loginEmailInput.focus();
    if (registerNameInput) registerNameInput.focus();
    
    // Add event listeners for login page
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
        
        // Enter key support
        if (loginPasswordInput) {
            loginPasswordInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleLogin();
                }
            });
        }
    }
    
    // Add event listeners for register page
    if (registerBtn) {
        registerBtn.addEventListener('click', handleRegister);
        
        // Enter key support
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleRegister();
                }
            });
        }
    }
    
    // Check if user is already logged in (for login page)
    checkAuthState();
});

// ========== CHECK AUTH STATE ==========
async function checkAuthState() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && session.user && window.location.pathname.includes('index.html')) {
            // User is already logged in, redirect to game
            console.log('User already logged in, redirecting to game...');
            setTimeout(() => {
                window.location.href = 'game.html';
            }, 1000);
        }
        
        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            
            if (event === 'SIGNED_IN' && session && window.location.pathname.includes('index.html')) {
                window.location.href = 'game.html';
            }
        });
        
    } catch (error) {
        console.error('Error checking auth state:', error);
    }
}

// Make functions available globally
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
