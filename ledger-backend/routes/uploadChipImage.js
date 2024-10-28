const path = require("path");

const uuid = require("uuid").v4;

async function uploadChipImageRoute(req, res, next) {
    const file = req.files.chipImage;
    if(!file) {
        return res.status(400).send("No file uploaded");
    }
    if(file.size > 10000000) { // 10mb
        return res.status(400).send("File size exceeds limit");
    }
    if(!file.mimetype.startsWith("image/")) {
        return res.status(400).send("File type not supported");
    }
    const extension = path.extname(file.name);
    const myUuid = uuid();
    const uploadPath = path.join(__dirname, "..", "/chip_images", myUuid + extension);
    await file.mv(uploadPath);
    return res.status(200).send(`${myUuid}${extension}`);
};

module.exports = uploadChipImageRoute;
