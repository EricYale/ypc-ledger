const { verifyAdmin } = require("../helpers/auth");
const { validateEmail } = require("../helpers/emails");
const { getTables, tables, saveTable } = require("../helpers/localStorage");

async function adminEditPlayerInfoRoute(req, res, next) {
    const { adminPassword, tableId, playerId, name, venmo, zelle, email } = req.body;
    if(!tableId || !playerId) return res.status(400).send("Table ID and player ID are required");
    if(!name || !email) return res.status(400).send("Missing required fields");
    if(!venmo && !zelle) return res.status(400).send("Need at least one of: venmo or zelle");
    if(!validateEmail(email)) return res.status(400).send("Invalid email");
    if(!verifyAdmin(adminPassword)) return res.status(403).send("Wrong admin password!");

    const table = getTables()[tableId];
    if(!table) return res.status(404).send("Table not found");
    if(!table.players[playerId]) return res.status(404).send("Player is not at this table");

    tables[tableId].players[playerId] = { ...table.players[playerId], name, venmo, zelle, email };
    try {
        saveTable(tableId);
    } catch(e) {
        return res.status(500).send(e.message);
    }
    return res.status(200).end();
}

module.exports = adminEditPlayerInfoRoute;
