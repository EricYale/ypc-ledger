const { verifyAdmin } = require("../helpers/auth");
const { getTables, tables, saveTable } = require("../helpers/localStorage");

async function mergePlayersRoute(req, res, next) {
    const { adminPassword, tableId, fromPlayerId, toPlayerId } = req.body;
    if(!tableId || !fromPlayerId || !toPlayerId) return res.status(400).send("Missing required fields");
    if(fromPlayerId === toPlayerId) return res.status(400).send("Cannot merge a player into themselves");
    if(!verifyAdmin(adminPassword)) return res.status(403).send("Wrong admin password!");

    const table = getTables()[tableId];
    if(!table) return res.status(404).send("Table not found");
    if(!table.players[fromPlayerId] || !table.players[toPlayerId]) {
        return res.status(404).send("Player is not at this table");
    }

    tables[tableId].transactions.forEach(transaction => {
        if(transaction.player === fromPlayerId) transaction.player = toPlayerId;
    });
    delete tables[tableId].players[fromPlayerId];

    try {
        saveTable(tableId);
    } catch(e) {
        return res.status(500).send(e.message);
    }
    return res.status(200).end();
}

module.exports = mergePlayersRoute;
