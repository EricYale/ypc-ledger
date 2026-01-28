const fs = require("fs");
const path = require("path");
const uuid = require("uuid").v4;
const userHelper = require("./user-helper");

const tables = {
    /*
    "2024-10-31_20_abcdef": {
        "id": string,
        "eventName": "Friday Night Live",
        "gameType": "No-limit Hold'Em",
        "tableNumber": "A" | "B" | "C", etc
        "createdAt": string timestamp,
        "closedAt": string timestamp | null,
        "bankingIsSettled": boolean,
        "smallBlind": 10,
        "bigBlind": 20,
        "bankingMode": "banker-prepay" | "banker" | "transfer",
        "players": {
            "abcdef": {
                "name": "Nick Ribs",
                "venmo": "@nickribs",
                "zelle": "1-800-NICK-RIBS",
                "email": "nickribs@gmail.com",
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
        "startingStack": {
            "white": 10,
            "red": 10,
            "blue": 9,
            "black": 1,
        },
    }
    */
};
const users = {
    /*
    "emy8": {
        "email": "eric.yoon@yale.edu",
        "firstName": "Eric",
        "lastName": "Yoon",
        "nickname": "action papa",
        "stats": {
            "daysPlayed": 10,
            "tablesPlayed": 12,
            "totalBuyIn": 500,
            "totalBuyOut": 450,
            "totalBuyInBigBlinds": 50,
            "totalBuyOutBigBlinds": 45,
        },
        "tableHistory": [
            {
                "tableId": "2024-10-31_20_abcdef",
                "buyIn": 100,
                "buyOut": 90,
                "date": timestamp,
                "bigBlind": 20,
            }1
        ]
    }
    */
};
let userTokens = {};

const tablesFolder = path.join(__dirname, "..", "data", "tables");
const userTokensFile = path.join(__dirname, "..", "data", "user_tokens.json");
const usersFolder = path.join(__dirname, "..", "data", "users");

/**
 * Rehydrate RAM from save files
 * @throws {Error}
 */
function rehydrateRAM() {
    if (!fs.existsSync(tablesFolder)) fs.mkdirSync(tablesFolder, { recursive: true });
    if (!fs.existsSync(usersFolder)) fs.mkdirSync(usersFolder, { recursive: true });

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

    fs.readdir(usersFolder, (err, files) => {
        if(err) throw new Error("Could not read users folder");

        files.forEach(file => {
            const filePath = path.join(usersFolder, file);
            const filename = path.basename(file, ".json");
            fs.readFile(filePath, "utf-8", (err, data) => {
                if(err) throw new Error(`Could not read file ${file}`);
                try {
                    users[filename] = JSON.parse(data);
                } catch (err) {
                    throw new Error(`Could not parse JSON from file ${file}`);
                }
            });
        });
    });

    try {
        fs.writeFileSync(userTokensFile, "{}", { flag: 'wx' });
    } catch(e) {}

    const tokensFile = fs.readFileSync(userTokensFile, "utf-8");
    userTokens = JSON.parse(tokensFile);
}

function saveTable(id) {
    const filePath = path.join(tablesFolder, `${id}.json`);
    
    fs.writeFile(filePath, JSON.stringify(tables[id], null, 2, { flag: "w"}), (err) => {
        if(err) {
            console.error(err);
            throw new Error(`Could not save table ${id}`);
        }
    });
}

function saveUser(id) {
    const filePath = path.join(usersFolder, `${id}.json`);
    
    fs.writeFile(filePath, JSON.stringify(users[id], null, 2, { flag: "w"}), (err) => {
        if(err) {
            console.error(err);
            throw new Error(`Could not save user ${id}`);
        }
    });
}

function createTable({ eventName, gameType, tableNumber, smallBlind, bigBlind, bankingMode, bankerVenmo, bankerZelle, denominations, startingStack }) {
    const dateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const randomUUID = uuid();
    const id = `${dateStr}_${smallBlind}-${bigBlind}_${randomUUID}`;

    tables[id] = {
        id,
        eventName,
        gameType,
        tableNumber,
        createdAt: new Date().toISOString(),
        closedAt: null,
        bankingIsSettled: false,
        addedToLeaderboard: false,
        smallBlind,
        bigBlind,
        bankingMode,
        bankerVenmo,
        bankerZelle,
        players: {},
        transactions: [],
        denominations,
        startingStack,
    };
    saveTable(id);
    return id;
}

async function createUser(email) {
    const yaliesPerson = await userHelper.fetchUserFromYalies(email);
    if(!yaliesPerson) return false;
    const nickname = await userHelper.generateUserNickname(yaliesPerson);
    console.log(`${yaliesPerson.firstName} "${nickname}" ${yaliesPerson.lastName}`);
    users[yaliesPerson.netId] = {
        firstName: yaliesPerson.firstName,
        lastName: yaliesPerson.lastName,
        nickname,
        email,
        stats: {
            daysPlayed: 0,
            tablesPlayed: 0,
            totalBuyIn: 0,
            totalBuyOut: 0,
            totalBuyInBigBlinds: 0,
            totalBuyOutBigBlinds: 0,
        },
        tableHistory: [],
    };
    // saveUser(yaliesPerson.netId); // Avoid a file write race condition with addTableToUserHistory
    return yaliesPerson.netId;
}

async function addTableToUserHistory(table, playerId, nets) {
    const email = table.players[playerId].email;
    let netId = Object.keys(users).find(id => users[id].email === email);
    if(!netId) {
        netId = await createUser(email);
        if(!netId) return false;
    }
    const user = users[netId];
    
    user.tableHistory.push({
        tableId: table.id,
        buyIn: nets.ins[playerId] || 0,
        buyOut: nets.outs[playerId] || 0,
        date: table.createdAt,
        bigBlind: table.bigBlind,
    });

    // Recompute stats
    user.stats = userHelper.computeStats(user.tableHistory);
    saveUser(netId);
    return true;
}

function addUserToTable(tableId, userId, user) {
    if (!tables[tableId]) {
        throw new Error(`Table with id ${tableId} does not exist`);
    }
    tables[tableId].players[userId] = user;
    saveTable(tableId);
}

function addTransactionToTable(tableId, transaction) {
    if (!tables[tableId]) {
        throw new Error(`Table with id ${tableId} does not exist`);
    }
    tables[tableId].transactions.push(transaction);
    saveTable(tableId);
}

function closeTable(tableId) {
    if(!tables[tableId]) {
        throw new Error(`Table with id ${tableId} does not exist`);
    }
    tables[tableId].closedAt = new Date().toISOString();
    saveTable(tableId);
}
function setSettled(tableId) {
    if(!tables[tableId]) {
        throw new Error(`Table with id ${tableId} does not exist`);
    }
    tables[tableId].bankingIsSettled = true;
    saveTable(tableId);
}
function setAddedToLeaderboard(tableId) {
    if(!tables[tableId]) {
        throw new Error(`Table with id ${tableId} does not exist`);
    }
    tables[tableId].addedToLeaderboard = true;
    saveTable(tableId);
}

function getTables() {
    return tables;
}

function getLeaderboard() {
    return users;
}

function getUserToken(userId) {
    return userTokens[userId];
}

function setUserToken(userId, userToken) {
    userTokens[userId] = userToken;
    fs.writeFileSync(userTokensFile, JSON.stringify(userTokens, null, 2));
}

module.exports = {
    createTable,
    rehydrateRAM,
    getTables,
    getLeaderboard,
    addUserToTable,
    addTransactionToTable,
    getUserToken,
    setUserToken,
    closeTable,
    setSettled,
    saveTable,
    tables,
    addTableToUserHistory,
    setAddedToLeaderboard,
};