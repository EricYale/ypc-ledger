const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const ses = new SESClient({
    region: process.env.AWS_SES_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

async function sendEmail(to, subject, body) {
    console.log(`Sending email to ${to} with subject "${subject}"`);
    
    const sendCommand = new SendEmailCommand({
        Destination: {
            // BccAddresses: ["eric.yoon+ypc@yale.edu"],
            ToAddresses: [to],
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: body,
                }
            },
            Subject: {
                Charset: "UTF-8",
                Data: subject,
            },
        },
        Source: `"Eric Yoon" <eric.yoon@yale.edu>`,
    });

    await ses.send(sendCommand);
}

function getPlayerNets(table) {
    const nets = {};
    const ins = {};
    const outs = {};
    for (const playerId in table.players) {
        const player = table.players[playerId];
        nets[playerId] = -1 * table.transactions
            .filter(i => i.player === playerId)
            .reduce((acc, curr) => acc + curr.amount, 0);
        ins[playerId] = table.transactions
            .filter(i => i.player === playerId)
            .filter(i => i.amount > 0)
            .reduce((acc, curr) => acc + curr.amount, 0);
        outs[playerId] = -1 * table.transactions
            .filter(i => i.player === playerId)
            .filter(i => i.amount < 0)
            .reduce((acc, curr) => acc + curr.amount, 0);
    }
    return {nets, ins, outs};
}

async function sendEmailsForPrebank(table) {
    const {nets, ins, outs} = getPlayerNets(table);
    
    for(const playerId of Object.keys(table.players)) {
        const player = table.players[playerId];
        const subject = `Thanks for playing at ${table.eventName}`;
        const playerNet = nets[playerId];
        const body = `
            <html>
                <body>
                    <h1>Yale Poker Club</h1>
                    <h2>Thanks for playing at ${table.eventName}, Table ${table.tableNumber}</h2>
                    <p>
                        <b>In for:</b> $${ins[playerId]}<br />
                        <b>Out for:</b> $${outs[playerId]}<br />
                        <b>${playerNet >= 0 ? "Total earnings" : "Total losses"}:</b> $${Math.abs(playerNet)}
                    </p>
                    ${playerNet > 0 ? "<p>Expect a Venmo to arrive from the banker. No action is required.</p>" : ""}
                </body>
            </html>
        `;
        await sendEmail(player.email, subject, body);
    }
}

async function sendEmailsForBank(table) {
    // Will be implemented in the future because YPC always prebanks now
}

async function sendEmailsForTransfer(table) {
    const {nets, ins, outs} = getPlayerNets(table);
    // round each net to the nearest cent
    for(const playerId in nets) nets[playerId] = Math.round(nets[playerId] * 100) / 100;
    // const ledgerSumsToZero = Object.values(nets).reduce((acc, curr) => acc + curr, 0) === 0;
    // if(!ledgerSumsToZero) {
    //     console.error("Ledger does not sum to zero"); // should be prevented by frontend ui anyways
    //     return;
    // }

    // thanks, ken https://ken-ledger.herokuapp.com/
    const transactions = [];
    const ledger = {};

    for(const player of Object.keys(nets)) ledger[player] = -nets[player];

    while(Object.keys(ledger).length > 0) {
        const minPlayer = Object.keys(ledger).reduce((a, b) => ledger[a] > ledger[b] ? a : b);
        const maxPlayer = Object.keys(ledger).reduce((a, b) => ledger[a] > ledger[b] ? b : a);
        const amount = Math.min(ledger[maxPlayer], Math.abs(ledger[minPlayer]));
        ledger[maxPlayer] -= amount;
        ledger[minPlayer] += amount;
        if(Math.abs(ledger[maxPlayer]) < 0.01) delete ledger[maxPlayer];
        if(Math.abs(ledger[minPlayer]) < 0.01) delete ledger[minPlayer];
        transactions.push({
            sender: minPlayer,
            recipient: maxPlayer,
            amount: Math.abs(amount),
        });
    }

    for(const playerId of Object.keys(table.players)) {
        const player = table.players[playerId];
        const subject = `Thanks for playing at ${table.eventName}`;
        const playerNet = nets[playerId];

        let transfers = "";
        transactions.filter(i => i.sender === playerId).forEach(i => {
            transfers += `<li>Please send $${i.amount.toFixed(2)} to ${table.players[i.recipient].paymentApp}.</li>`;
        });
        transactions.filter(i => i.recipient === playerId).forEach(i => {
            transfers += `<li>Expect a transfer of $${i.amount.toFixed(2)} from ${table.players[i.sender].paymentApp}.</li>`;
        });

        const body = `
            <html>
                <body>
                    <h1>Yale Poker Club</h1>
                    <h2>Thanks for playing at ${table.eventName}, Table ${table.tableNumber}</h2>
                    <p>
                        <b>In for:</b> $${ins[playerId]}<br />
                        <b>Out for:</b> $${outs[playerId]}<br />
                        <b>${playerNet >= 0 ? "Total earnings" : "Total losses"}:</b> $${Math.abs(playerNet)}
                    </p>
                    <ul>
                        ${transfers}
                    </ul>
                </body>
            </html>
        `;
        await sendEmail(player.email, subject, body);
    }
}

module.exports = {
    sendEmailsForBank,
    sendEmailsForPrebank,
    sendEmailsForTransfer,
};
