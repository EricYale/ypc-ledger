/**
 * VIBE CODED
 * Run with `node ledger-backend/helpers/historicalDataImport.js`
 */



require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const { rehydrateRAM, addTableToUserHistory, createUser, getLeaderboard } = require("./localStorage");

const HISTORICAL_DATA_DIR = path.join(__dirname, "..", "data", "historical");
const USERS_DIR = path.join(__dirname, "..", "data", "users");

function getMostRecentFridayBefore(dateStr) {
    // dateStr format: YYYY-MM-DD
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 is Sunday, 5 is Friday
    
    // We want Friday on or before.
    let daysToSubtract = 0;
    if (dayOfWeek === 5) {
        daysToSubtract = 0;
    } else if (dayOfWeek > 5) {
        daysToSubtract = dayOfWeek - 5;
    } else {
        daysToSubtract = dayOfWeek + 2;
    }
    
    const friday = new Date(date);
    friday.setDate(date.getDate() - daysToSubtract);
    
    // Return YYYY-MM-DD
    return friday.toISOString().split("T")[0];
}

function parseMoney(moneyStr) {
    if (!moneyStr) return 0;
    const clean = moneyStr.replace("$", "");
    const val = parseFloat(clean);
    return isNaN(val) ? 0 : val;
}

function parseCSV(content) {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(",").map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        const row = {};
        for(let j = 0; j < headers.length; j++) {
            if (headers[j]) {
                row[headers[j]] = values[j] ? values[j].trim() : "";
            }
        }
        data.push(row);
    }
    return data;
}

function inferBlind(rows) {
    const buyInCounts = {};
    for (const row of rows) {
        const val = parseMoney(row.In);
        if (val > 0) {
            buyInCounts[val] = (buyInCounts[val] || 0) + 1;
        }
    }
    
    let popularAmount = 0;
    let maxCount = 0;
    
    for (const [amount, count] of Object.entries(buyInCounts)) {
        if (count > maxCount) {
            maxCount = count;
            popularAmount = parseFloat(amount);
        } else if (count === maxCount) {
            if (parseFloat(amount) > popularAmount) {
                popularAmount = parseFloat(amount);
            }
        }
    }
    
    // Round down to nearest $5
    const rounded = Math.floor(popularAmount / 5) * 5;
    return rounded; 
}

async function main() {
    console.log("Starting historical data import...");
    
    try {
        rehydrateRAM();
        console.log("RAM rehydrated.");
    } catch (e) {
        console.error("Failed to rehydrate RAM:", e);
        process.exit(1);
    }
    
    if (!fs.existsSync(HISTORICAL_DATA_DIR)) {
        console.error("Historical data directory not found:", HISTORICAL_DATA_DIR);
        process.exit(1);
    }

    const files = fs.readdirSync(HISTORICAL_DATA_DIR).filter(f => f.endsWith(".csv"));
    console.log(`Found ${files.length} CSV files.`);
    
    const preparedTables = [];
    const allEmails = new Set();

    // 1. Pre-process files to gather all unique emails
    for (const file of files) {
        try {
            // Infer Date
            const match = file.match(/(\d{4}-\d{2}-\d{2})/);
            if (!match) continue;
            
            const fileDate = match[1];
            const tableDate = getMostRecentFridayBefore(fileDate);
            
            // Read content
            const content = fs.readFileSync(path.join(HISTORICAL_DATA_DIR, file), "utf-8");
            const rows = parseCSV(content);
            if (rows.length === 0) continue;
            
            // Infer Blinds
            const bigBlind = inferBlind(rows);

            // Construct Table Data structure
            const tableId = `${tableDate}_${bigBlind}_historical_${file.replace(".csv", "")}`;
            
            const tableData = {
                table: {
                    id: tableId,
                    createdAt: new Date(tableDate).toISOString(),
                    bigBlind: bigBlind,
                    players: {} 
                },
                nets: { ins: {}, outs: {} },
                fileName: file
            };

            for (const row of rows) {
                const email = row.Email ? row.Email.toLowerCase() : null;
                if (!email) continue;
                allEmails.add(email);
                
                const playerId = email; 
                tableData.table.players[playerId] = {
                    email: email,
                    name: row.Name
                };
                
                tableData.nets.ins[playerId] = Math.round(parseMoney(row.In) * 100);
                tableData.nets.outs[playerId] = Math.round(parseMoney(row.Out) * 100);
            }
            preparedTables.push(tableData);

        } catch (err) {
            console.error(`Error parsing file ${file}:`, err);
        }
    }
    
    console.log(`Identified ${allEmails.size} unique users across all history.`);
    
    // 2. Identify missing users and create them in parallel
    const users = getLeaderboard();
    const missingEmails = [];
    console.log(users);
    for (const email of allEmails) {
        const existing = Object.values(users).find(u => u.email === email);
        if (existing) {
            existing.tableHistory = [];
        } else {
            missingEmails.push(email);
        }
    }
    
    console.log(`Found ${missingEmails.length} new users to create.`);
    
    if (missingEmails.length > 0) {
        const BATCH_SIZE = 5; // To avoid hitting rate limits too hard? 
        // User asked to parallelize. Let's do batches or all at once.
        // Assuming Gemini/Yalies can handle it. Let's try chunks of 10.
        
        for (let i = 0; i < missingEmails.length; i += BATCH_SIZE) {
            const batch = missingEmails.slice(i, i + BATCH_SIZE);
            console.log(`Creating users batch ${i/BATCH_SIZE + 1}...`);
            await Promise.all(batch.map(async email => {
                try {
                    await createUser(email);
                    process.stdout.write("+");
                } catch (e) {
                    process.stdout.write("x");
                    console.error(` Failed to create user ${email}:`, e.message);
                }
            }));
            console.log("");
        }
    }

    // 3. Import tables
    console.log(" importing tables...");
    for (const { table, nets, fileName } of preparedTables) {
        console.log(`Importing ${fileName}...`);
        const playerIds = Object.keys(table.players);
        
        // We can parallelize this inner loop safely now since users exist
        // But addTableToUserHistory is not fully purely atomic with file writes,
        // however we are relying on rehydrateRAM for future reads if we crashed.
        // The in-memory updates are synchronous. The `saveUser` is async fire-and-forget.
        // It's safer to await them.
        
        await Promise.all(playerIds.map(async (playerId) => {
            try {
                // Should return quickly as user exists
                // pass true to skipSave to avoid huge disk I/O during loop
                await addTableToUserHistory(table, playerId, nets, true);
            } catch (e) {
                console.error(`Error adding history for ${playerId}:`, e.message);
            }
        }));
    }
    
    // 4. Save all users to disk
    console.log("Saving all users to disk...");
    const allUsers = getLeaderboard();
    for (const [netId, userData] of Object.entries(allUsers)) {
        const filePath = path.join(USERS_DIR, `${netId}.json`);
        try {
            fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));
        } catch (e) {
             console.error(`Failed to save user ${netId}:`, e.message);
        }
    }
    
    console.log("Import complete.");
}

if (require.main === module) {
    main();
}

module.exports = { main };
