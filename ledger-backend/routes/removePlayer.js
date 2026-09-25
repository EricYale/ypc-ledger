const { verifyAdmin } = require("../helpers/auth");
const { getTables, tables, saveTable } = require("../helpers/localStorage");

async function removePlayerRoute(req, res, next) {
    const { adminPassword, tableId, playerId } = req.body;
    if(!tableId || !playerId) return res.status(400).send("Table ID and player ID are required");
    if(!verifyAdmin(adminPassword)) return res.status(403).send("Wrong admin password!");

    const table = getTables()[tableId];
    if(!table) return res.status(404).send("Table not found");
    if(!table.players[playerId]) return res.status(404).send("Player is not at this table");

    tables[tableId].transactions = table.transactions.filter(transaction => transaction.player !== playerId);
    delete tables[tableId].players[playerId];

    try {
        saveTable(tableId);
    } catch(e) {
        return res.status(500).send(e.message);
    }
    return res.status(200).end();
}

module.exports = removePlayerRoute;
