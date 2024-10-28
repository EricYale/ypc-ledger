const { addTransactionToTable, getTables } = require("../helpers/localStorage");

async function buyInRoute(req, res, next) {
    const { userId, tableId } = req.body;
    if(!userId || !tableId) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    const table = getTables()[tableId];
    if(!table) {
        return res.status(404).json({ error: "Table not found" });
    }
    try {
        addTransactionToTable(tableId, {
            player: userId,
            amount: table.bigBlind * 100,
            timestamp: new Date().toISOString(),
        });
    } catch(e) {
        return res.status(500).json({ error: e.message });
    }
    return res.status(200).end();
}

module.exports = buyInRoute;
