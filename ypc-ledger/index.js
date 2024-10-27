const express = require("express");
const createTableRoute = require("./routes/createTable");
const { rehydrateRAM, createTable } = require("./helpers/localStorage");

let app;

function initialize() {
    rehydrateRAM();

    app = express();
    app.set("trust proxy",1);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(express.static("public"));
    app.get("/api/create_table", createTableRoute);

    app.listen(80, () => {
        console.log("Server is running on port 80");
    });
}

initialize();
createTable({
    smallBlind: 0.1,
    bigBlind: 0.2,
    bankingMode: "banker",
    denominations: {
        white: 0.1,
        red: 0.5,
        blue: 1,
        black: 5,
    },
});
