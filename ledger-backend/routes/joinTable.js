const { BLINDS } = require("../helpers/blinds");
const { addUserToTable } = require("../helpers/localStorage");
const { verifyUserToken } = require("../helpers/auth");
const { validateEmail } = require("../helpers/emails");

async function joinTableRoute(req, res, next) {
    const { userId, userToken, name, venmo, zelle, email, tableId } = req.body;
    if(!userId || !name || !email || !tableId) {
        return res.status(400).send("Missing required fields");
    }
    if(!venmo && !zelle) {
        return res.status(400).send("Need at least one of: venmo or zelle");
    }
    if(!verifyUserToken(userId, userToken)) {
        return res.status(403).send("Invalid user token");
    }
    if(!validateEmail(email)) {
        return res.status(400).send("Invalid email");
    }
    try {
        addUserToTable(tableId, userId, {
            name,
            venmo,
            zelle,
            email,
        });
    } catch(e) {
        return res.status(500).send(e.message);
    }
    return res.status(200).end();
}

module.exports = joinTableRoute;
