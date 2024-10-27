async function createTableRoute(req, res, next) {
    return res.status(200).send("Hi");
}

module.exports = createTableRoute;
