const { getLeaderboard } = require("../helpers/localStorage");

async function getLeaderboardRoute(req, res, next) {
    res.status(200).send(getLeaderboard());
}

module.exports = getLeaderboardRoute;
