function randomString(length) {
    let result = "";
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for(let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function getUID() {
    const uid = localStorage.getItem("uid");
    if(!uid) return generateUID();
    return uid;
}

function generateUID() {
    const uid = randomString(32);
    localStorage.setItem("uid", uid);
    return uid;
}

module.exports = { getUID };
