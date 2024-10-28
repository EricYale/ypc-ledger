const path = require("path");
const { addTransactionToTable, getTables } = require("../helpers/localStorage");
const fs = require("fs");

async function buyOutRoute(req, res, next) {
    const { userId, tableId, amount, chipPhoto } = req.body;
    if(!userId || !tableId || typeof(amount) !== "number" || !chipPhoto) {
        return res.status(400).send("Missing required fields");
    }
    if(amount < 0) {
        return res.status(400).send("Amount must be positive");
    }

    const chipPhotoPath = path.join(__dirname, "..", "/chip_images", chipPhoto);
    if(!fs.existsSync(chipPhotoPath)) {
        return res.status(400).send("Chip photo not found");
    }

    const table = getTables()[tableId];
    if(!table) {
        return res.status(404).send("Table not found");
    }
    try {
        addTransactionToTable(tableId, {
            player: userId,
            amount: -amount,
            timestamp: new Date().toISOString(),
            chipPhoto,
        });
    } catch(e) {
        return res.status(500).send(e.message);
    }
    return res.status(200).end();
}

module.exports = buyOutRoute;
