const { verifyAdmin } = require("../helpers/auth");
const { BLINDS } = require("../helpers/blinds");
const { createTable } = require("../helpers/localStorage");

async function createTableRoute(req, res, next) {
    const { eventName, blinds, adminPassword, tableNumber, bankingMode, bankerVenmo, bankerZelle } = req.body;
    if(!eventName || !blinds || !tableNumber || !bankingMode) {
        return res.status(400).send("Missing required fields");
    }
    if(!verifyAdmin(adminPassword)) return res.status(403).send("Wrong admin password!");
    if(!(blinds in BLINDS)) {
        return res.status(400).send("Invalid blinds string");
    }
    
    const { smallBlind, bigBlind, startingStack, denoms } = BLINDS[blinds];

    const id = createTable({
        eventName: eventName,
        gameType: "NLH",
        tableNumber,
        smallBlind,
        bigBlind,
        bankingMode,
        bankerVenmo,
        bankerZelle,
        denominations: denoms,
        startingStack,
    });

    res.status(200).send(id);
}

module.exports = createTableRoute;
