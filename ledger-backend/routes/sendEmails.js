const { verifyAdmin } = require("../helpers/auth");
const { setSettled, getTables } = require("../helpers/localStorage");
const { sendEmailsForBank, sendEmailsForPrebank, sendEmailsForTransfer } = require("../helpers/emails");

async function sendEmailsRoute(req, res, next) {
    const {adminPassword, tableId, bankerPaymentApp} = req.body;
    if(!tableId) return res.status(400).send("Table ID is required");
    if(!verifyAdmin(adminPassword)) return res.status(403).send("Wrong admin password!");

    const table = getTables()[tableId];
    if(!table) {
        return res.status(404).send("Table not found");
    }
    if(table.bankingMode === "banker-prepay" || table.bankingMode === "banker") {
        if(!bankerPaymentApp) {
            return res.status(400).send("Banker payment app is required");
        }
    }
    
    try {
        if(table.bankingMode === "banker-prepay") {
            await sendEmailsForPrebank(table);
        } else if( table.bankingMode === "banker") {
            await sendEmailsForBank(table);
        } else if( table.bankingMode === "transfer") {
            await sendEmailsForTransfer(table);
        }
    } catch(e) {
        return res.status(500).send("Failed to send emails: " + e.message);
    }

    try {
        setSettled(tableId);
    } catch(e) {
        return res.status(500).send(e.message);
    }
    return res.status(200).end();
}

module.exports = sendEmailsRoute;
