const clerkPubKey = 'pk_test_cGVhY2VmdWwtY2FpbWFuLTM4LmNsZXJrLmFjY291bnRzLmRldiQ';
let currentUser = null;

async function initAuth() {
    console.log('🔄 Initializing Clerk authentication...');

    if (window.Clerk) return; // Already initialized

    const script = document.createElement('script');
    script.setAttribute('data-clerk-publishable-key', clerkPubKey);
    script.async = true;
    script.src = `https://peaceful-caiman-38.clerk.accounts.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js`;
    script.crossOrigin = 'anonymous';

    script.addEventListener('load', async function () {
        await window.Clerk.load({
            appearance: {
                variables: {
                    colorPrimary: '#3B82F6', // JobFlow Blue
                    borderRadius: '8px',
                    colorText: '#1f2937'
                },
                layout: {
                    socialButtonsPlacement: 'bottom',
                    socialButtonsVariant: 'blockButton'
                }
            }
        });
        console.log('✅ Clerk loaded');
        window.CLERK_READY = true;
        
        if (window.Clerk.user) {
            currentUser = window.Clerk.user;
            updateUIForAuthenticatedUser(currentUser);
        } else {
            updateUIForUnauthenticatedUser();
            if (window.location.pathname.includes('tracker.html') || window.location.pathname.includes('resume-analyzer.html')) {
                window.location.href = 'index.html';
            }
        }

        window.Clerk.addListener(({ user }) => {
            if (user) {
                currentUser = user;
                updateUIForAuthenticatedUser(user);
            } else {
                currentUser = null;
                updateUIForUnauthenticatedUser();
                const path = window.location.pathname;
                if (path.includes('tracker.html') || path.includes('resume-analyzer.html') || path.includes('ai-tools.html')) {
                    window.location.href = 'index.html';
                }
            }
        });
    });
    
    document.body.appendChild(script);
}

function signInWithGoogle() {
    if (window.Clerk) {
        window.Clerk.openSignIn();
    } else {
        alert('Authentication is still loading. Please try again in a moment.');
    }
}

async function signOut() {
    if (window.Clerk) {
        await window.Clerk.signOut();
    }
}

function getCurrentUser() {
    return currentUser;
}

function isAuthenticated() {
    return currentUser !== null;
}

// Helper for authorized API calls
async function apiFetch(endpoint, options = {}) {
    if (!window.Clerk) {
        console.error('Clerk not initialized');
        return null;
    }

    // Wait for session to be ready if it's not yet
    let retries = 0;
    while (!window.Clerk.session && retries < 20) {
        await new Promise(r => setTimeout(r, 100));
        retries++;
    }

    if (!window.Clerk.session) {
        console.error('No Clerk session found after waiting');
        return null;
    }

    try {
        const token = await window.Clerk.session.getToken();
        
        const defaultHeaders = {
            'Authorization': `Bearer ${token}`
        };
        
        if (!(options.body instanceof FormData) && options.body) {
            defaultHeaders['Content-Type'] = 'application/json';
            options.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
        }
        
        options.headers = { ...defaultHeaders, ...options.headers };
        return fetch(endpoint, options);
    } catch (e) {
        console.error('Error in apiFetch:', e);
        return null;
    }
}

function updateUIForAuthenticatedUser(user) {
    const loginBtn = document.querySelector('.btn-login');
    const existingUserMenu = document.querySelector('.user-menu');
    const navButtons = document.querySelector('.nav-buttons');
    
    let userButtonContainer = document.getElementById('user-button-container');
    if (!userButtonContainer) {
        userButtonContainer = document.createElement('div');
        userButtonContainer.id = 'user-button-container';
        userButtonContainer.style.marginLeft = '10px';
        if (existingUserMenu) {
            existingUserMenu.parentElement.replaceChild(userButtonContainer, existingUserMenu);
        } else if (loginBtn) {
            loginBtn.parentElement.replaceChild(userButtonContainer, loginBtn);
        } else if (navButtons) {
            navButtons.insertBefore(userButtonContainer, navButtons.querySelector('.mobile-menu-btn'));
        }
    }
    
    if (window.Clerk && document.getElementById('user-button-container')) {
        window.Clerk.mountUserButton(document.getElementById('user-button-container'));
    }

    const ctaButtons = document.querySelectorAll('.btn-primary, .btn-cta, .btn-cta-large');
    ctaButtons.forEach(btn => {
        if (btn.textContent.includes('Get Started') || btn.textContent.includes('Start')) {
            btn.onclick = () => window.location.href = 'tracker.html';
        }
    });
}

function updateUIForUnauthenticatedUser() {
    console.log('🔄 Updating UI for unauthenticated user');
    const userButtonContainer = document.getElementById('user-button-container');
    const existingUserMenu = document.querySelector('.user-menu');
    
    if (userButtonContainer) {
        const newLoginBtn = document.createElement('button');
        newLoginBtn.className = 'btn-login';
        newLoginBtn.textContent = 'Login';
        newLoginBtn.onclick = signInWithGoogle;
        userButtonContainer.parentElement.replaceChild(newLoginBtn, userButtonContainer);
    } else if (existingUserMenu) {
        const newLoginBtn = document.createElement('button');
        newLoginBtn.className = 'btn-login';
        newLoginBtn.textContent = 'Login';
        newLoginBtn.onclick = signInWithGoogle;
        existingUserMenu.parentElement.replaceChild(newLoginBtn, existingUserMenu);
    } else {
        const loginBtn = document.querySelector('.btn-login');
        if (loginBtn) {
            loginBtn.textContent = 'Login';
            loginBtn.onclick = signInWithGoogle;
        }
    }
}

async function protectPage() {
    let retries = 0;
    while (!window.Clerk && retries < 50) {
        await new Promise(r => setTimeout(r, 100));
        retries++;
    }
    
    if (!window.Clerk || !window.Clerk.user) {
        window.location.href = 'index.html';
        return false;
    }
    currentUser = window.Clerk.user;
    return true;
}

window.initAuth = initAuth;
window.signInWithGoogle = signInWithGoogle;
window.signOut = signOut;
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;
window.protectPage = protectPage;
window.apiFetch = apiFetch;
