const { getTables } = require("../helpers/localStorage");

async function getTablesRoute(req, res, next) {
    res.status(200).send(getTables());
}

module.exports = getTablesRoute;
