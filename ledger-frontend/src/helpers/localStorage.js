function randomString(length) {
    let result = "";
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for(let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export function getUID() {
    const uid = localStorage.getItem("uid");
    if(!uid) return generateUID();
    return uid;
}

function generateUID() {
    const uid = randomString(32);
    localStorage.setItem("uid", uid);
    return uid;
}

export function getToken() {
    const token = localStorage.getItem("token");
    if(!token) return generateToken();
    return token;
}

function generateToken() {
    const token = randomString(32);
    localStorage.setItem("token", token);
    return token;
}

export function getSavedAdminPassword() {
    return localStorage.getItem("adminPassword");
}

export function saveAdminPassword(password) {
    localStorage.setItem("adminPassword", password);
}
