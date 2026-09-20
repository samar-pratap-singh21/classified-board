// Shared helpers used across all pages

function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
}

function setAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

function authHeaders() {
    const token = getToken();
    return token
        ? { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' };
}

// Renders the top navbar depending on login state. Call on every page.
function renderNavbar(containerId) {
    const user = getUser();
    const container = document.getElementById(containerId);
    if (!container) return;

    if (user) {
        container.innerHTML = `
            <div class="navbar">
                <a href="/index.html" class="brand" style="color:#fff;text-decoration:none;">📋 Local Classifieds</a>
                <div>
                    <a href="/index.html">Board</a>
                    <a href="/post-ad.html">Post Ad</a>
                    <a href="/my-ads.html">My Ads</a>
                    <span style="margin-left:15px;">Hi, ${user.name}</span>
                    <button onclick="logout()">Logout</button>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="navbar">
                <a href="/index.html" class="brand" style="color:#fff;text-decoration:none;">📋 Local Classifieds</a>
                <div>
                    <a href="/index.html">Board</a>
                    <a href="/login.html">Login</a>
                    <a href="/register.html" class="primary">Sign Up</a>
                </div>
            </div>
        `;
    }
}

function requireLoginRedirect() {
    if (!getToken()) {
        window.location.href = '/login.html';
    }
}