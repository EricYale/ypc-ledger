const { verifyUserToken } = require("../helpers/auth");
const { addTransactionToTable, getTables } = require("../helpers/localStorage");

async function buyInRoute(req, res, next) {
    const { userId, userToken, tableId, amount } = req.body;
    if(!userId || !tableId || typeof(amount) !== "number") {
        return res.status(400).send("Missing required fields");
    }
    if(amount < 0) {
        return res.status(400).send("Amount must be positive");
    }
    if(!verifyUserToken(userId, userToken)) {
        return res.status(403).send("Invalid user token");
    }
    const table = getTables()[tableId];
    if(!table) {
        return res.status(404).send("Table not found");
    }
    if(table.closedAt !== null) {
        return res.status(403).send("Table is closed");
    }
    try {
        addTransactionToTable(tableId, {
            player: userId,
            amount,
            timestamp: new Date().toISOString(),
        });
    } catch(e) {
        return res.status(500).send(e.message);
    }
    return res.status(200).end();
}

module.exports = buyInRoute;
