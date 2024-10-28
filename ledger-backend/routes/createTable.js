const { BLINDS } = require("../helpers/blinds");
const { createTable } = require("../helpers/localStorage");

async function createTableRoute(req, res, next) {
    const { eventName, roomNumber, tableNumber, blinds } = req.body;
    if(!eventName || !roomNumber || !tableNumber || !blinds) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    if(!(blinds in BLINDS)) {
        return res.status(400).json({ error: "Invalid blinds string" });
    }
    
    const { smallBlind, bigBlind, startingStack, denoms } = BLINDS[blinds];
    const bankingMode = bigBlind > 0.5 ? "transfer" : "banker-prepay";

    const id = createTable({
        eventName: eventName,
        gameType: "NLH",
        tableNumber: `${roomNumber} · Table ${tableNumber}`,
        smallBlind,
        bigBlind,
        bankingMode,
        denominations: denoms,
        startingStack,
    });

    res.status(200).send(id);
}

module.exports = createTableRoute;
