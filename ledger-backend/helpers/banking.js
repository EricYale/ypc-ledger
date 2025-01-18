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
    const { nets } = getPlayerNets(table);

    const transactions = [];
    const ledger = {};

    const ledgerSum = Object.values(ledger).reduce((acc, curr) => acc + curr, 0);
    if(ledgerSum !== 0) throw new Error("Ledger does not sum to zero");

    // Copy ledger, and invert it for clarity (so if you're up, it's positive)
    for(const player of Object.keys(nets)) ledger[player] = -nets[player];
    
    function processTransaction(sender, recipient, amount, method) {
        ledger[recipient] -= amount;
        ledger[sender] += amount;
        if(ledger[recipient] === 0) delete ledger[recipient];
        if(ledger[sender] === 0) delete ledger[sender];
        transactions.push({ sender, recipient, amount: Math.abs(amount), method });
    }
    console.log(ledger);
    while(Object.keys(ledger).length > 0) {
        const minPlayer = Object.keys(ledger).reduce((a, b) => ledger[a] > ledger[b] ? a : b);
        const maxPlayer = Object.keys(ledger).reduce((a, b) => ledger[a] > ledger[b] ? b : a);
        const amount = Math.min(ledger[maxPlayer], Math.abs(ledger[minPlayer]));
        if(amount === 0) {
            delete ledger[maxPlayer];
            delete ledger[minPlayer];
            continue;
        }
        processTransaction(minPlayer, maxPlayer, amount, "any");
    }

    return transactions;
}

module.exports = {
    displayCents,
    getPlayerNets,
    getDirectTransferTransactions,
};
