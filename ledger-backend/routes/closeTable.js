const { verifyAdmin } = require("../helpers/auth");
const { closeTable, getTables } = require("../helpers/localStorage");

async function closeTableRoute(req, res, next) {
    const {adminPassword, tableId} = req.body;
    if(!tableId) return res.status(400).send("Table ID is required");
    if(!verifyAdmin(adminPassword)) return res.status(403).send("Unauthorized");

    const table = getTables()[tableId];
    if(!table) {
        return res.status(404).send("Table not found");
    }
    try {
        closeTable(tableId);
    } catch(e) {
        return res.status(500).send(e.message);
    }
    return res.status(200).end();
}

module.exports = closeTableRoute;
