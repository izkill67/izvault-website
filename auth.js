const SUPABASE_URL = 'https://imkbmemvoqbbedbljueu.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Dosi6rJmV4SaGzLEClAYUA_1L2CdDfE';
const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const authOpen = document.getElementById('authOpen');
const authModal = document.getElementById('authModal');
const authClose = document.getElementById('authClose');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authLoginForm = document.getElementById('authLoginForm');
const authRegisterForm = document.getElementById('authRegisterForm');
const authAccount = document.getElementById('authAccount');
const authMessage = document.getElementById('authMessage');
const switchRegister = document.getElementById('switchRegister');
const switchLogin = document.getElementById('switchLogin');
const logoutBtn = document.getElementById('logoutBtn');

function showMessage(message, type = 'normal') {
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.className = `auth-message ${type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'loading' ? 'loading' : ''}`;
}

function addPasswordToggle(input) {
  if (!input || input.parentElement.classList.contains('auth-field')) return;
  const wrap = document.createElement('div');
  wrap.className = 'auth-field';
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'auth-password-toggle';
  toggle.setAttribute('aria-label', 'Show password');
  toggle.textContent = '◉';
  toggle.addEventListener('click', () => {
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    toggle.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
    toggle.textContent = visible ? '◉' : '◌';
  });
  wrap.appendChild(toggle);
}

function setupEnhancedForms() {
  document.querySelectorAll('#loginPassword,#registerPassword').forEach(addPasswordToggle);

  if (authLoginForm && !document.getElementById('loginOptions')) {
    const options = document.createElement('div');
    options.className = 'auth-options';
    options.id = 'loginOptions';
    options.innerHTML = '<label class="auth-check"><input id="rememberMe" type="checkbox" checked> Remember me</label><button class="auth-link" id="forgotPassword" type="button">Forgot password?</button>';
    const submit = authLoginForm.querySelector('.auth-submit');
    authLoginForm.insertBefore(options, submit);
    document.getElementById('forgotPassword').addEventListener('click', resetPassword);
  }

  if (authRegisterForm && !document.getElementById('registerStrength')) {
    const password = document.getElementById('registerPassword');
    const strength = document.createElement('div');
    strength.id = 'registerStrength';
    strength.innerHTML = '<div class="auth-strength"><i></i></div><div class="auth-strength-text">Password strength: —</div>';
    password.parentElement.parentElement.insertBefore(strength, password.parentElement.nextSibling);
    password.addEventListener('input', () => updatePasswordStrength(password.value));

    const confirmLabel = document.createElement('label');
    confirmLabel.setAttribute('for', 'registerConfirmPassword');
    confirmLabel.textContent = 'Confirm Password';
    const confirm = document.createElement('input');
    confirm.id = 'registerConfirmPassword';
    confirm.type = 'password';
    confirm.autocomplete = 'new-password';
    confirm.required = true;
    confirm.placeholder = 'Repeat your password';
    authRegisterForm.insertBefore(confirmLabel, authRegisterForm.querySelector('.auth-submit'));
    authRegisterForm.insertBefore(confirm, authRegisterForm.querySelector('.auth-submit'));
    addPasswordToggle(confirm);

    const terms = document.createElement('label');
    terms.className = 'auth-terms';
    terms.innerHTML = '<input id="authTerms" type="checkbox" required> I agree to the Terms of Service and Privacy Policy.';
    authRegisterForm.insertBefore(terms, authRegisterForm.querySelector('.auth-submit'));
  }
}

function updatePasswordStrength(value) {
  const box = document.getElementById('registerStrength');
  if (!box) return;
  let score = 0;
  if (value.length >= 6) score++;
  if (value.length >= 10) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  const width = [0,20,40,60,80,100][score];
  const label = ['—','Very weak','Weak','Fair','Strong','Very strong'][score];
  box.querySelector('i').style.width = `${width}%`;
  box.querySelector('.auth-strength-text').textContent = `Password strength: ${label}`;
}

async function resetPassword() {
  const email = document.getElementById('loginEmail')?.value.trim();
  if (!email) return showMessage('Enter your email address first.', 'error');
  showMessage('Sending password reset email...', 'loading');
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
  if (error) return showMessage(error.message || 'Could not send the reset email.', 'error');
  showMessage('If an account exists for this email, a password reset link has been sent.', 'success');
}

function openAuth(mode = 'login') {
  setupEnhancedForms();
  authModal.hidden = false;
  authMessage.textContent = '';
  const isAccount = mode === 'account';
  const isRegister = mode === 'register';
  authTitle.textContent = isAccount ? 'Your Account' : isRegister ? 'Create your account' : 'Welcome back';
  authSubtitle.textContent = isAccount ? 'Manage your IZVAULT account.' : isRegister ? 'Join IZVAULT and keep your digital world organised.' : 'Sign in to continue to your account.';
  authLoginForm.hidden = isRegister || isAccount;
  authRegisterForm.hidden = !isRegister || isAccount;
  authAccount.hidden = !isAccount;
  logoutBtn.hidden = !isAccount;
  switchRegister.hidden = isRegister || isAccount;
  switchLogin.hidden = !isRegister || isAccount;
  if (isRegister) updatePasswordStrength(document.getElementById('registerPassword')?.value || '');
}

function closeAuth() { authModal.hidden = true; }

authOpen?.addEventListener('click', () => authOpen.dataset.loggedIn === 'true' ? openAuth('account') : openAuth('login'));
authClose?.addEventListener('click', closeAuth);
authModal?.addEventListener('click', e => { if (e.target === authModal) closeAuth(); });
switchRegister?.addEventListener('click', () => openAuth('register'));
switchLogin?.addEventListener('click', () => openAuth('login'));

authRegisterForm?.addEventListener('submit', async event => {
  event.preventDefault();
  setupEnhancedForms();
  const username = document.getElementById('registerUsername').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirm = document.getElementById('registerConfirmPassword')?.value || '';
  const submit = authRegisterForm.querySelector('button[type="submit"]');
  if (username.length < 3) return showMessage('Username must be at least 3 characters.', 'error');
  if (password.length < 6) return showMessage('Password must be at least 6 characters.', 'error');
  if (password !== confirm) return showMessage('Passwords do not match.', 'error');
  if (!document.getElementById('authTerms')?.checked) return showMessage('Please accept the Terms of Service and Privacy Policy.', 'error');
  submit.disabled = true; showMessage('Creating your account...', 'loading');
  try {
    const { data, error } = await supabaseClient.auth.signUp({ email, password, options: { data: { username }, emailRedirectTo: window.location.origin + window.location.pathname } });
    if (error) throw error;
    if (data.session) { showMessage('Account created successfully. Welcome to IZVAULT!', 'success'); setTimeout(closeAuth, 800); }
    else showMessage('Account created. Check your email to verify your account before signing in.', 'success');
  } catch (error) { showMessage(error.message || 'Could not create your account.', 'error'); }
  finally { submit.disabled = false; }
});

authLoginForm?.addEventListener('submit', async event => {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const submit = authLoginForm.querySelector('button[type="submit"]');
  submit.disabled = true; submit.textContent = 'Signing in...'; showMessage('Signing you in...', 'loading');
  try {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    showMessage('Login successful! Welcome back to IZVAULT.', 'success');
    setTimeout(closeAuth, 650);
  } catch (error) { showMessage(error.message || 'Invalid email or password. Please try again.', 'error'); }
  finally { submit.disabled = false; submit.textContent = 'Sign In'; }
});

logoutBtn?.addEventListener('click', async () => {
  const { error } = await supabaseClient.auth.signOut({ scope: 'local' });
  if (error) return showMessage(error.message || 'Could not sign out.', 'error');
  closeAuth();
});

async function updateAuthUI(user) {
  if (!authOpen) return;
  if (user) {
    authOpen.innerHTML = '<i class="fa-regular fa-user"></i> Account';
    authOpen.dataset.loggedIn = 'true';
    const username = user.user_metadata?.username || 'IZVAULT User';
    authAccount.innerHTML = `<div class="account-panel"><div class="account-avatar">${escapeHtml(username.slice(0,1).toUpperCase())}</div><p>Welcome back, <strong>${escapeHtml(username)}</strong></p><p>Email: <strong>${escapeHtml(user.email || '')}</strong></p><p>Plan: <strong>Free</strong></p><div class="account-actions"><button class="account-action" type="button" onclick="document.getElementById('authMessage').textContent='Account settings are available from your IZVAULT tools.'">⚙ Settings</button><button class="account-action" type="button" onclick="location.href='resources.html'">☁ Resources</button></div></div>`;
  } else {
    authOpen.innerHTML = '<i class="fa-regular fa-user"></i> Sign In';
    authOpen.dataset.loggedIn = 'false';
  }
}

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }

supabaseClient.auth.onAuthStateChange((_event, session) => updateAuthUI(session?.user || null));
supabaseClient.auth.getSession().then(({ data }) => updateAuthUI(data.session?.user || null));
