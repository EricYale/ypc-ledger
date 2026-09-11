const { verifyAdmin } = require("../helpers/auth");
const { getTables, tables, saveTable } = require("../helpers/localStorage");

async function deleteTransactionRoute(req, res, next) {
    const { adminPassword, tableId, playerId, timestamp, amount } = req.body;
    if(!tableId || !playerId || !timestamp) return res.status(400).send("Missing required fields");
    if(typeof(amount) !== "number") return res.status(400).send("Amount must be a number");
    if(!verifyAdmin(adminPassword)) return res.status(403).send("Wrong admin password!");

    const table = getTables()[tableId];
    if(!table) return res.status(404).send("Table not found");

    const index = table.transactions.findIndex(transaction =>
        transaction.player === playerId &&
        transaction.timestamp === timestamp &&
        transaction.amount === amount
    );
    if(index === -1) return res.status(404).send("Transaction not found");

    tables[tableId].transactions.splice(index, 1);

    try {
        saveTable(tableId);
    } catch(e) {
        return res.status(500).send(e.message);
    }
    return res.status(200).end();
}

module.exports = deleteTransactionRoute;
