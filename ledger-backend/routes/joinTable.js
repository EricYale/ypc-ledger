const { BLINDS } = require("../helpers/blinds");
const { addUserToTable } = require("../helpers/localStorage");

async function joinTableRoute(req, res, next) {
    const { userId, name, paymentApp, email, tableId } = req.body;
    if(!userId || !name || !paymentApp || !email || !tableId) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        addUserToTable(tableId, userId, {
            name,
            paymentApp,
            email,
        });
    } catch(e) {
        return res.status(500).json({ error: e.message });
    }
    return res.status(200).end();
}

module.exports = joinTableRoute;
