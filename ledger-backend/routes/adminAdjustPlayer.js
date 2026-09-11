const { verifyAdmin } = require("../helpers/auth");
const { getPlayerNets } = require("../helpers/banking");
const { getTables, tables, saveTable } = require("../helpers/localStorage");

async function adminAdjustPlayerRoute(req, res, next) {
    const { adminPassword, tableId, playerId, amountIn, amountOut } = req.body;
    if(!tableId || !playerId) return res.status(400).send("Table ID and player ID are required");
    if(typeof(amountIn) !== "number" || typeof(amountOut) !== "number") {
        return res.status(400).send("Amounts must be numbers");
    }
    if(amountIn < 0 || amountOut < 0) return res.status(400).send("Amounts must be positive");
    if(!verifyAdmin(adminPassword)) return res.status(403).send("Wrong admin password!");

    const table = getTables()[tableId];
    if(!table) return res.status(404).send("Table not found");
    if(!table.players[playerId]) return res.status(404).send("Player is not at this table");

    const { ins, outs } = getPlayerNets(table);
    const inDelta = amountIn - ins[playerId];
    const outDelta = amountOut - outs[playerId];

    if(inDelta === 0 && outDelta === 0) return res.status(200).end();

    if(inDelta !== 0) {
        tables[tableId].transactions.push({
            player: playerId,
            amount: inDelta,
            timestamp: new Date().toISOString(),
            adminAction: true,
            adjusts: "in",
        });
    }
    if(outDelta !== 0) {
        tables[tableId].transactions.push({
            player: playerId,
            amount: -outDelta,
            timestamp: new Date().toISOString(),
            adminAction: true,
            adjusts: "out",
        });
    }
    try {
        saveTable(tableId);
    } catch(e) {
        return res.status(500).send(e.message);
    }
    return res.status(200).end();
}

module.exports = adminAdjustPlayerRoute;
