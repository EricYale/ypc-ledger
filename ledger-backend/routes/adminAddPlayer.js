const uuid = require("uuid").v4;
const { verifyAdmin } = require("../helpers/auth");
const { validateEmail } = require("../helpers/emails");
const { getTables, tables, saveTable } = require("../helpers/localStorage");

async function adminAddPlayerRoute(req, res, next) {
    const { adminPassword, tableId, name, venmo, zelle, email, amountIn } = req.body;
    if(!tableId || !name || !email) return res.status(400).send("Missing required fields");
    if(!venmo && !zelle) return res.status(400).send("Need at least one of: venmo or zelle");
    if(!validateEmail(email)) return res.status(400).send("Invalid email");
    if(typeof(amountIn) !== "number" || amountIn < 0) return res.status(400).send("Buy-in must be a positive number");
    if(!verifyAdmin(adminPassword)) return res.status(403).send("Wrong admin password!");

    const table = getTables()[tableId];
    if(!table) return res.status(404).send("Table not found");

    const playerId = uuid();
    tables[tableId].players[playerId] = { name, venmo, zelle, email };
    if(amountIn > 0) {
        tables[tableId].transactions.push({
            player: playerId,
            amount: amountIn,
            timestamp: new Date().toISOString(),
            adminAction: true,
            adjusts: "in",
        });
    }

    try {
        saveTable(tableId);
    } catch(e) {
        return res.status(500).send(e.message);
    }
    return res.status(200).end();
}

module.exports = adminAddPlayerRoute;
