const express = require("express");
const createTableRoute = require("./routes/createTable");
const getTablesRoute = require("./routes/getTables");
const { rehydrateRAM, createTable } = require("./helpers/localStorage");
const path = require("path");
const cors = require("cors");
const joinTableRoute = require("./routes/joinTable");
const buyInRoute = require("./routes/buyIn");

let app;

function initialize() {
    rehydrateRAM();

    app = express();
    app.set("trust proxy",1);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cors());

    app.use((req, res, next) => {
        console.log(`${req.method} :: ${req.path}`);
        next();
    })

    app.post("/api/create_table", createTableRoute);
    app.get("/api/get_tables", getTablesRoute);
    app.post("/api/join_table", joinTableRoute);
    app.post("/api/buy_in", buyInRoute);
    app.use(express.static("public"));
    app.all("*", (req, res) => { // Redirect other routes to single page web app
        res.sendFile(path.resolve("public", "index.html"));
    });

    const port = process.env.PORT || 80;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

initialize();
