const { getLeaderboard } = require("../helpers/localStorage");
const { verifyAdmin } = require("../helpers/auth");

async function getPlayerEmailsRoute(req, res, next) {
    const { adminPassword } = req.body;
    if(!verifyAdmin(adminPassword)) return res.status(403).send("Wrong admin password!");

    const leaderboard = getLeaderboard();
    const emails = Object.values(leaderboard).map(player => player.email);
    return res.status(200).send(emails);
}

module.exports = getPlayerEmailsRoute;
