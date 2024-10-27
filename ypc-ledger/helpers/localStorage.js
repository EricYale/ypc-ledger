const fs = require("fs");
const path = require("path");
const uuid = require("uuid").v4;

const tables = {
    /*
    "2024-10-31_20_abcdef": {
        "id": string,
        "createdAt": string timestamp,
        "smallBlind": .10,
        "bigBlind": .20,
        "bankingMode": "banker" | "transfer",
        "players": {
            "abcdef": {
                "name": "Nick Ribs",
                "paymentApp": "@nickribs"
            },
        },
        "transactions": [
            {
                "player": "abcdef",
                "amount": 10, // positive for buy-in, negative for buy-out
                "timestamp": "2024-10-31T20:00:00Z",
                "chipPhoto": "https://example.com/chip.png",
            },
        ],
        "denominations": [
            "white": 0.1,
            "red": 0.5,
            "blue": 1,
            "black": 5,
        ],
    }
    */
};

const tablesFolder = path.join(__dirname, "..", "data");

/**
 * Rehydrate RAM from save files
 * @throws {Error}
 */
function rehydrateRAM() {
    fs.readdir(tablesFolder, (err, files) => {
        if(err) throw new Error("Could not read tables folder");
        
        files.forEach(file => {
            const filePath = path.join(tablesFolder, file);
            const filename = path.basename(file, ".json");
            fs.readFile(filePath, "utf-8", (err, data) => {
                if(err) throw new Error(`Could not read file ${file}`);
                try {
                    tables[filename] = JSON.parse(data);
                } catch (err) {
                    throw new Error(`Could not parse JSON from file ${file}`);
                }
            });
        });
    });
}

function saveTable(id) {
    const filePath = path.join(tablesFolder, `${id}.json`);
    
    fs.writeFile(filePath, JSON.stringify(tables[id], null, 2, { flag: "w"}), (err) => {
        console.error(err)
        if(err) throw new Error(`Could not save table ${id}`);
    });
}

function createTable({ smallBlind,bigBlind, bankingMode, denominations }) {
    const dateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const randomUUID = uuid();
    const id = `${dateStr}_${smallBlind}-${bigBlind}_${randomUUID}`;

    tables[id] = {
        createdAt: new Date().toISOString(),
        smallBlind,
        bigBlind,
        bankingMode,
        players: {},
        transactions: [],
        denominations,
    };
    saveTable(id);
}

module.exports = { createTable, rehydrateRAM };