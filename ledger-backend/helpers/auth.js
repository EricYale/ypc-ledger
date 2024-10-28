const { getUserToken, setUserToken } = require("./localStorage");

function verifyUserToken(userId, userToken) {
    if(!userToken) return false;
    if(!getUserToken(userId)) {
        setUserToken(userId, userToken);
        return true;
    }
    return getUserToken(userId) === userToken;
}

module.exports = { verifyUserToken };
