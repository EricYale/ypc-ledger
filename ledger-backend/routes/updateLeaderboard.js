const { addTableToUserHistory, setAddedToLeaderboard } = require("../helpers/localStorage");
const { getPlayerNets } = require("../helpers/banking");
const { verifyAdmin } = require("../helpers/auth");
const { getTables, tables } = require("../helpers/localStorage");

async function updateLeaderboardRoute(req, res, next) {
    const {adminPassword, tableId} = req.body;
    if(!tableId) return res.status(400).send("Table ID is required");
    if(!verifyAdmin(adminPassword)) return res.status(403).send("Wrong admin password!");

    const table = getTables()[tableId];
    if(!table) {
        return res.status(404).send("Table not found");
    }
    
    const nets = getPlayerNets(table, true);
    const playerIds = Object.keys(table.players);
    const results = await Promise.allSettled(playerIds.map(playerId => 
        addTableToUserHistory(table, playerId, nets)
    ));

    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            const playerId = playerIds[index];
            console.error(`Failed to update leaderboard for player ${playerId} in table ${tableId}: ${result.reason.message}`);
        }
    });

    setAddedToLeaderboard(tableId);

    return res.status(200).end();
}

module.exports = updateLeaderboardRoute;
