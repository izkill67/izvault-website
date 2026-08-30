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

function showMessage(message, isError = false) {
  authMessage.textContent = message;
  authMessage.style.color = isError ? '#fb7185' : '#9d7cff';
}

function openAuth(mode = 'login') {
  authModal.hidden = false;
  authMessage.textContent = '';
  const isAccount = mode === 'account';
  const isRegister = mode === 'register';

  authTitle.textContent = isAccount ? 'Your Account' : isRegister ? 'Create Account' : 'Welcome Back';
  authSubtitle.textContent = isAccount ? 'Manage your IZVAULT account.' : isRegister ? 'Create your IZVAULT account.' : 'Sign in to continue to IZVAULT.';
  authLoginForm.hidden = isRegister || isAccount;
  authRegisterForm.hidden = !isRegister || isAccount;
  authAccount.hidden = !isAccount;
  logoutBtn.hidden = !isAccount;
  switchRegister.hidden = isRegister || isAccount;
  switchLogin.hidden = !isRegister || isAccount;
}

function closeAuth() {
  authModal.hidden = true;
}

authOpen?.addEventListener('click', () => {
  if (authOpen.dataset.loggedIn === 'true') openAuth('account');
  else openAuth('login');
});
authClose?.addEventListener('click', closeAuth);
authModal?.addEventListener('click', (event) => {
  if (event.target === authModal) closeAuth();
});
switchRegister?.addEventListener('click', () => openAuth('register'));
switchLogin?.addEventListener('click', () => openAuth('login'));

authRegisterForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = document.getElementById('registerUsername').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const submit = authRegisterForm.querySelector('button[type="submit"]');

  if (username.length < 3) return showMessage('Username must be at least 3 characters.', true);
  if (password.length < 6) return showMessage('Password must be at least 6 characters.', true);

  submit.disabled = true;
  showMessage('Creating account...');

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: window.location.origin + window.location.pathname
      }
    });

    if (error) throw error;

    if (data.session) {
      showMessage('Account created successfully. Welcome to IZVAULT!');
      setTimeout(closeAuth, 900);
    } else {
      showMessage('Account created. Check your email to verify your account before signing in.');
    }
  } catch (error) {
    showMessage(error.message || 'Could not create your account.', true);
  } finally {
    submit.disabled = false;
  }
});

authLoginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const submit = authLoginForm.querySelector('button[type="submit"]');

  submit.disabled = true;
  showMessage('Signing in...');

  try {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    showMessage('Signed in successfully.');
    setTimeout(closeAuth, 500);
  } catch (error) {
    showMessage(error.message || 'Could not sign in.', true);
  } finally {
    submit.disabled = false;
  }
});

logoutBtn?.addEventListener('click', async () => {
  const { error } = await supabaseClient.auth.signOut();
  if (error) return showMessage(error.message || 'Could not sign out.', true);
  closeAuth();
});

async function updateAuthUI(user) {
  if (!authOpen) return;
  if (user) {
    authOpen.innerHTML = '<i class="fa-regular fa-user"></i> Account';
    authOpen.dataset.loggedIn = 'true';
    const username = user.user_metadata?.username || 'IZVAULT User';
    authAccount.innerHTML = `<p>Username: <strong>${escapeHtml(username)}</strong></p><p>Email: <strong>${escapeHtml(user.email || '')}</strong></p><p>Plan: <strong>Free</strong></p>`;
  } else {
    authOpen.innerHTML = '<i class="fa-regular fa-user"></i> Sign In';
    authOpen.dataset.loggedIn = 'false';
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

supabaseClient.auth.onAuthStateChange((_event, session) => {
  updateAuthUI(session?.user || null);
});

supabaseClient.auth.getSession().then(({ data }) => updateAuthUI(data.session?.user || null));
