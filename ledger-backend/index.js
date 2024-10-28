require("dotenv").config();
const express = require("express");
const createTableRoute = require("./routes/createTable");
const getTablesRoute = require("./routes/getTables");
const { rehydrateRAM } = require("./helpers/localStorage");
const path = require("path");
const cors = require("cors");
const joinTableRoute = require("./routes/joinTable");
const buyInRoute = require("./routes/buyIn");
const buyOutRoute = require("./routes/buyOut");
const uploadChipImageRoute = require("./routes/uploadChipImage");
const fs = require("fs");
const fileUpload = require("express-fileupload");
const closeTableRoute = require("./routes/closeTable");
const sendEmailsRoute = require("./routes/sendEmails");
let app;

const chipImagesFolder = path.join(__dirname, "chip_images");
if (!fs.existsSync(chipImagesFolder)) fs.mkdirSync(chipImagesFolder, { recursive: true });

function initialize() {
    rehydrateRAM();

    app = express();
    app.set("trust proxy",1);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cors());
    app.use(fileUpload());

    // app.use((req, res, next) => {
    //     console.log(`${req.method} :: ${req.path}`);
    //     next();
    // })

    app.post("/api/create_table", createTableRoute);
    app.get("/api/get_tables", getTablesRoute);
    app.post("/api/join_table", joinTableRoute);
    app.post("/api/buy_in", buyInRoute);
    app.post("/api/buy_out", buyOutRoute);
    app.post("/api/upload_chip_image", uploadChipImageRoute);
    app.post("/api/close_table", closeTableRoute);
    app.post("/api/send_emails", sendEmailsRoute);

    app.use(express.static("public"));
    app.use("/chip_porn", express.static("chip_images"));
    app.all("*", (req, res) => { // Redirect other routes to single page web app
        res.sendFile(path.resolve("public", "index.html"));
    });

    const port = process.env.PORT || 80;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

initialize();
