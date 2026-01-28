function displayCents(cents) {
    if(cents % 100 === 0) return (cents / 100).toFixed(0);
    return (cents / 100).toFixed(2);
}

function getPlayerNets(table, skipReconciliation = false) {
    const nets = {};
    const ins = {};
    const outs = {};
    for (const playerId in table.players) {
        const player = table.players[playerId];
        // Nets are POSITIVE if you made money
        nets[playerId] = -1 * table.transactions
            .filter(i => i.player === playerId)
            .filter(i => !skipReconciliation || !i.reconciliation)
            .reduce((acc, curr) => acc + curr.amount, 0);
        // Ins are ALWAYS POSITIVE
        ins[playerId] = table.transactions
            .filter(i => i.player === playerId)
            .filter(i => i.amount > 0)
            .filter(i => !skipReconciliation || !i.reconciliation)
            .reduce((acc, curr) => acc + curr.amount, 0);
        // Outs are ALWAYS POSITIVE
        outs[playerId] = -1 * table.transactions
            .filter(i => i.player === playerId)
            .filter(i => i.amount < 0)
            .filter(i => !skipReconciliation || !i.reconciliation)
            .reduce((acc, curr) => acc + curr.amount, 0);
    }
    return {nets, ins, outs};
}

function getDirectTransferTransactions(table) {
    console.log(table);
    const { nets } = getPlayerNets(table);
    const netsArray = Object.keys(nets)
        .map(k => ({id: k, net: nets[k]}))
        .filter(k => k.net !== 0);
    netsArray.sort((a, b) => b.net - a.net); // desc
    const transactions = [];
    
    while(netsArray.length > 1) {
        const biggestWinner = netsArray[0];
        const biggestLoser = netsArray[netsArray.length - 1];
        const amount = Math.min(biggestWinner.net, -biggestLoser.net);
        biggestWinner.net -= amount;
        biggestLoser.net += amount;

        transactions.push({
            sender: biggestLoser.id,
            recipient: biggestWinner.id,
            amount,
            method: "any",
        });

        if(Math.abs(biggestWinner.net) === 0) netsArray.shift();
        if(netsArray.length > 0 && Math.abs(biggestLoser.net) === 0) netsArray.pop();
    }
    transactions.sort((a, b) => b.amount - a.amount);
    console.log(transactions);
    if(!transactionsSanityCheck(transactions, table, nets)) {
        console.error("Sanity check failed!");
        return null;
    }
    return transactions;
}

function transactionsSanityCheck(transactions, table, nets) {
    for(const player of Object.keys(table.players)) {
        if(!(player in nets)) continue;
        const playerSends = transactions.filter(t => t.sender === player);
        const playerReceives = transactions.filter(t => t.recipient === player);
        const totalSent = playerSends.reduce((acc, curr) => acc + curr.amount, 0);
        const totalReceived = playerReceives.reduce((acc, curr) => acc + curr.amount, 0);
        const expectedNet = nets[player];
        const actualNet = totalReceived - totalSent;
        if(expectedNet !== actualNet) return false;
    }
    return true;
}


module.exports = {
    displayCents,
    getPlayerNets,
    getDirectTransferTransactions,
};
