function displayCents(cents) {
    if(cents % 100 === 0) return (cents / 100).toFixed(0);
    return (cents / 100).toFixed(2);
}

function getPlayerNets(table) {
    const nets = {};
    const ins = {};
    const outs = {};
    for (const playerId in table.players) {
        const player = table.players[playerId];
        // Nets are POSITIVE if you made money
        nets[playerId] = -1 * table.transactions
            .filter(i => i.player === playerId)
            .reduce((acc, curr) => acc + curr.amount, 0);
        // Ins are ALWAYS POSITIVE
        ins[playerId] = table.transactions
            .filter(i => i.player === playerId)
            .filter(i => i.amount > 0)
            .reduce((acc, curr) => acc + curr.amount, 0);
        // Outs are ALWAYS POSITIVE
        outs[playerId] = -1 * table.transactions
            .filter(i => i.player === playerId)
            .filter(i => i.amount < 0)
            .reduce((acc, curr) => acc + curr.amount, 0);
    }
    return {nets, ins, outs};
}

function getDirectTransferTransactions(table) {
    const {nets, ins, outs} = getPlayerNets(table);

    const transactions = [];
    const ledger = {};

    const ledgerSum = Object.values(ledger).reduce((acc, curr) => acc + curr, 0);
    if(ledgerSum !== 0) throw new Error("Ledger does not sum to zero");

    // Copy ledger, and invert it for clarity (so if you're up, it's positive)
    for(const player of Object.keys(nets)) ledger[player] = -nets[player];
    
    function processTransaction(sender, recipient, amount, method) {
        ledger[sender] += amount;
        ledger[recipient] -= amount;
        transactions.push({ sender, recipient, amount: Math.abs(amount), method });
    }

    /**
     * @param {string[]} losers People who lost money, sorted ascending (element 0 is biggest loser)
     * @param {string[]} winners People who made money, sorted descending (element 0 is biggest winner)
     * @param {string} method Venmo or Zelle
     */
    function settleLedgerWithinGroup(losers, winners, method) {
        while (losers.length > 0 && winners.length > 0) {
            const loser = losers[0];
            const winner = winners[0];
            const amount = Math.min(ledger[loser], Math.abs(ledger[winner]));
            processTransaction(loser, winner, amount, method);
            if (ledger[downPlayer] === 0) losers.shift();
            if (ledger[upPlayer] === 0) winners.shift();
        }
    }

    const playersSorted = Object.keys(ledger)
        .sort((a, b) => ledger[a] - ledger[b])
        .filter(id => ledger[id] !== 0);

    const allHaveVenmo = Object.values(table.players).every(player => player.venmo != null);
    
    if (allHaveVenmo) {
        // Process transactions for all players as Venmo-only
        const losers = playersByBalance.filter(id => ledger[id] < 0); // ascending
        const winners = playersByBalance.filter(id => ledger[id] > 0).reverse(); // descending
        settleLedgerWithinGroup(losers, winners, "venmo");
        if(losers.length !== 0 || winners.length !== 0) throw new Error("Transactions did not settle");
        return transactions;
    }

    // Process transactions for all players as Venmo and Zelle
    const venmoOnly = playersSorted.filter(id => !table.players[id].zelle);
    const zelleOnly = playersSorted.filter(id => !table.players[id].venmo);
    const middlemen = playersSorted.filter(id => table.players[id].venmo && table.players[id].zelle);
    if(venmoOnly.length + zelleOnly.length + middlemen.length !== playersSorted.length) throw new Error("Players were not categorized correctly");

    const venmoLosers = venmoOnly.filter(id => ledger[id] < 0);
    const venmoWinners = venmoOnly.filter(id => ledger[id] > 0).reverse();
    const zelleLosers = zelleOnly.filter(id => ledger[id] < 0);
    const zelleWinners = zelleOnly.filter(id => ledger[id] > 0).reverse();

    settleLedgerWithinGroup(venmoLosers, venmoWinners, "venmo");
    settleLedgerWithinGroup(zelleLosers, zelleWinners, "zelle");

    // TODO WTF lol

    // while ((venmoDown.length > 0 || zelleDown.length > 0) && (venmoUp.length > 0 || zelleUp.length > 0) && middlemen.length > 0) {
    //     const middleman = middlemen[0];
    //     let downPlayer, upPlayer, method;

    //     // Check Venmo down players to Zelle up players
    //     if (venmoDown.length > 0 && zelleUp.length > 0) {
    //         downPlayer = venmoDown[0];
    //         upPlayer = zelleUp[0];
    //         method = "Venmo";
    //     }
    //     // Check Zelle down players to Venmo up players
    //     else if (zelleDown.length > 0 && venmoUp.length > 0) {
    //         downPlayer = zelleDown[0];
    //         upPlayer = venmoUp[0];
    //         method = "Zelle";
    //     }

    //     // If there is a valid cross-platform transaction, process it
    //     if (downPlayer && upPlayer) {
    //         const amount = Math.min(ledger[downPlayer], Math.abs(ledger[upPlayer]));

    //         // Down player pays middleman
    //         processTransaction(downPlayer, middleman, amount, method);

    //         // Middleman pays up player in their preferred method
    //         processTransaction(middleman, upPlayer, amount, method === "Venmo" ? "Zelle" : "Venmo");

    //         // Remove players if balance is zero
    //         if (ledger[downPlayer] === 0) {
    //             method === "Venmo" ? venmoDown.shift() : zelleDown.shift();
    //         }
    //         if (ledger[upPlayer] === 0) {
    //             method === "Venmo" ? zelleUp.shift() : venmoUp.shift();
    //         }
    //     } else {
    //         // If no matching players are left for cross-platform, break out
    //         break;
    //     }
    // }
}

module.exports = {
    displayCents,
    getPlayerNets,
    getDirectTransferTransactions,
};
