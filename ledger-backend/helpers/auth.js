const { getUserToken, setUserToken } = require("./localStorage");

function verifyUserToken(userId, userToken) {
    if(!userToken) return false;
    if(!getUserToken(userId)) {
        setUserToken(userId, userToken);
        return true;
    }
    return getUserToken(userId) === userToken;
}

function verifyAdmin(adminPassword) {
    if(!adminPassword) return false;
    if(!process.env.ADMIN_PASSWORD) return false;
    return adminPassword === process.env.ADMIN_PASSWORD;
}

module.exports = { verifyUserToken, verifyAdmin };
