const { verifyAdmin } = require("../helpers/auth");
const { getPlayerNets } = require("../helpers/emails");
const { getTables, tables, saveTable } = require("../helpers/localStorage");


async function reconcileTableRoute(req, res, next) {
    const {adminPassword, tableId} = req.body;
    if(!tableId) return res.status(400).send("Table ID is required");
    if(!verifyAdmin(adminPassword)) return res.status(403).send("Wrong admin password!");

    const table = getTables()[tableId];
    if(!table) {
        return res.status(404).send("Table not found");
    }

    const {nets, outs} = getPlayerNets(table);
    // Players who didn't lose their entire buy-in
    const nonBankruptPlayers = Object.keys(table.players).filter(id => outs[id] > 0);

    if(nonBankruptPlayers.length === 0) {
        res.status(200).send("No non-bankrupt players to reconcile");
        return;
    }

    const topEarner = nonBankruptPlayers.reduce((a, b) => nets[a] > nets[b] ? a : b);
    const fanumTaxTotal = Object.values(nets).reduce((acc, curr) => acc + curr, 0);

    if(fanumTaxTotal === 0) {
        res.status(200).send("No money to reconcile");
        return;
    }
    if(fanumTaxTotal > 0) {
        if(nonBankruptPlayers.length === 0) {
            res.status(500).send("Need at least one non-bankrupt player to reconcile");
            return;
        }
        // Money is missing, fanum tax each non-bankrupt player
        const fanumTaxPerPlayer = Math.floor(fanumTaxTotal / nonBankruptPlayers.length);
        nonBankruptPlayers.forEach(player => {
            tables[tableId].transactions.push({
                player,
                amount: fanumTaxPerPlayer,
                timestamp: new Date().toISOString(),
                reconciliation: true,
            });
        });
        const fanumTaxLeftover = fanumTaxTotal % nonBankruptPlayers.length;
        // Fanum tax the biggest winner the extra amount, in case it doesn't divide equally
        tables[tableId].transactions.push({
            player: topEarner,
            amount: fanumTaxLeftover,
            timestamp: new Date().toISOString(),
            reconciliation: true,
        });
    } else {
        // Extra money in the table, give it all to the top earner
        tables[tableId].transactions.push({
            player: topEarner,
            amount: fanumTaxTotal,
            timestamp: new Date().toISOString(),
            reconciliation: true,
        });
    }
    saveTable(tableId);

    res.status(200).send("Reconciled");
};

module.exports = reconcileTableRoute;
