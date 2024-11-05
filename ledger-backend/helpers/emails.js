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
            BccAddresses: ["eric.yoon@yale.edu"],
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

function displayCents(cents) {
    if(cents % 100 === 0) return (cents / 100).toFixed(0);
    return (cents / 100).toFixed(2);
}

async function sendEmailsForPrebank(table) {
    const {nets, ins, outs} = getPlayerNets(table);
    
    for(const playerId of Object.keys(table.players)) {
        const player = table.players[playerId];
        const subject = `Thanks for playing at ${table.eventName}`;
        const playerNet = nets[playerId];
        const playerReconciled = table.transactions.filter(i => i.player === playerId).some(i => i.reconciliation);

        const body = `
            <html>
                <body style="text-align: center; font-family: 'Lato', sans-serif;">
                    <img
                        src="https://yalepokerclub.com/resources/logo_black.png"
                        alt="Yale Poker Club"
                        style="max-width: 50%; max-height: 20%; margin: 70px 0;"
                    />
                    <h2>Thanks for playing at ${table.eventName}</h2>
                    <h3 style="margin-bottom: 50px;">Table ${table.tableNumber}</h3>
                    <div style="border: 1px black solid; margin: 50px auto; max-width: 75%; border-radius: 15px;">
                        <div style="display: inline-block; margin-right: 50px;">
                            <p style="text-transform: uppercase; font-weight: bold; font-size: 12px;">IN FOR</p>
                            <p style="font-size: 40px; margin: 10px;">$${displayCents(ins[playerId])}</p>
                        </div>
                        <div style="display: inline-block; margin-right: 50px;">
                            <p style="text-transform: uppercase; font-weight: bold; font-size: 12px;">OUT FOR</p>
                            <p style="font-size: 40px; margin: 10px;">$${displayCents(outs[playerId])}</p>
                        </div>
                        <div style="display: inline-block;">
                            <p style="text-transform: uppercase; font-weight: bold; font-size: 12px;">
                                ${playerNet >= 0 ? "Total earnings" : "Total losses"}
                            </p>
                            <p style="font-size: 40px; margin: 10px; color: ${playerNet >= 0 ? "#00BB00" : "#FF0000"}">$${displayCents(Math.abs(playerNet))}</p>
                        </div>
                    </div>
                    <div style="border: 1px black solid; margin: 50px auto; max-width: 75%; border-radius: 15px;">
                        <h3>Banking</h3>
                        <p>
                            ${playerNet > 0 ? "Expect a Venmo to arrive from the banker. No action is required." : "No action is required."}
                        </p>
                        ${playerReconciled ? "<p>This ledger had a discrepancy. Your balance was adjusted to reconcile the difference, which was split evenly amongst players. We deeply apologize; if you have any questions, ask a YPC officer.</p>" : ""}
                    </div>
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

    const ledgerSumsToZero = Object.values(nets).reduce((acc, curr) => acc + curr, 0) === 0;
    if(!ledgerSumsToZero) {
        console.error("Ledger does not sum to zero"); // should be prevented by frontend ui anyways
        return;
    }

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
        if(ledger[maxPlayer] === 0) delete ledger[maxPlayer];
        if(ledger[minPlayer] === 0) delete ledger[minPlayer];
        transactions.push({
            sender: minPlayer,
            recipient: maxPlayer,
            amount: Math.abs(amount),
        });
    }

    for(const playerId of Object.keys(table.players)) {
        const player = table.players[playerId];
        const subject = `Thanks for playing at ${table.eventName}, Table ${table.tableNumber}`;
        const playerNet = nets[playerId];
        const playerReconciled = table.transactions.filter(i => i.player === playerId).some(i => i.reconciliation);

        let transfers = "";
        transactions.filter(i => i.sender === playerId).forEach(i => {
            transfers += `<li>Please send <b>$${displayCents(i.amount)}</b> to <b>${table.players[i.recipient].paymentApp}</b>.</li>`;
        });
        transactions.filter(i => i.recipient === playerId).forEach(i => {
            transfers += `<li>Expect a transfer of <b>$${displayCents(i.amount)}</b> from <b>${table.players[i.sender].paymentApp}</b>.</li>`;
        });

        const body = `
            <html>
                <body style="text-align: center; font-family: 'Lato', sans-serif;">
                    <img
                        src="https://yalepokerclub.com/resources/logo_black.png"
                        alt="Yale Poker Club"
                        style="max-width: 50%; max-height: 20%; margin: 70px 0;"
                    />
                    <h2>Thanks for playing at ${table.eventName}</h2>
                    <h3 style="margin-bottom: 50px;">Table ${table.tableNumber}</h3>
                    <div style="border: 1px black solid; margin: 50px auto; max-width: 75%; border-radius: 15px;">
                        <div style="display: inline-block; margin-right: 50px;">
                            <p style="text-transform: uppercase; font-weight: bold; font-size: 12px;">IN FOR</p>
                            <p style="font-size: 40px; margin: 10px;">$${displayCents(ins[playerId])}</p>
                        </div>
                        <div style="display: inline-block; margin-right: 50px;">
                            <p style="text-transform: uppercase; font-weight: bold; font-size: 12px;">OUT FOR</p>
                            <p style="font-size: 40px; margin: 10px;">$${displayCents(outs[playerId])}</p>
                        </div>
                        <div style="display: inline-block;">
                            <p style="text-transform: uppercase; font-weight: bold; font-size: 12px;">
                                ${playerNet >= 0 ? "Total earnings" : "Total losses"}
                            </p>
                            <p style="font-size: 40px; margin: 10px; color: ${playerNet >= 0 ? "#00BB00" : "#FF0000"}">$${displayCents(Math.abs(playerNet))}</p>
                        </div>
                    </div>
                    <div style="border: 1px black solid; margin: 50px auto; max-width: 75%; border-radius: 15px;">
                        <h3>Banking</h3>
                        <ul style="display: inline-block;">
                            ${transfers}
                        </ul>
                        ${playerReconciled ? "<p>This ledger had a discrepancy. Your balance was adjusted to reconcile the difference, which was split evenly amongst players. We deeply apologize; if you have any questions, ask a YPC officer.</p>" : ""}
                    </div>
                </body>
            </html>
        `;
        await sendEmail(player.email, subject, body);
    }
}

const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};

module.exports = {
    getPlayerNets,
    sendEmailsForBank,
    sendEmailsForPrebank,
    sendEmailsForTransfer,
    validateEmail,
};
