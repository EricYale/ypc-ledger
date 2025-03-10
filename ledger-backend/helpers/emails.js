const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const { displayCents, getPlayerNets, getDirectTransferTransactions } = require("./banking");

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

function generateLedger(table) {
    let tr = "";
    
    for(const playerId of Object.keys(table.players)) {
        const player = {
            ...table.players[playerId],
            id: playerId,
            amount: table.transactions
                .filter(i => i.player === playerId)
                .reduce((acc, curr) => acc + curr.amount, 0),
            in: table.transactions
                .filter(i => i.player === playerId)
                .filter(i => i.amount > 0)
                .reduce((acc, curr) => acc + curr.amount, 0),
            out: table.transactions
                .filter(i => i.player === playerId)
                .filter(i => i.amount < 0)
                .reduce((acc, curr) => acc + curr.amount, 0),
        };

        tr += `
            <tr>
                <td style="padding: 7px; border: 1px solid #777777; border-collapse: collapse;">${player.name}</td>
                <td style="padding: 7px; border: 1px solid #777777; border-collapse: collapse;">${player.venmo} ${player.zelle}</td>
                <td style="padding: 7px; border: 1px solid #777777; border-collapse: collapse;">${player.email}</td>
                <td style="padding: 7px; border: 1px solid #777777; border-collapse: collapse;">$${displayCents(player.in)}</td>
                <td style="padding: 7px; border: 1px solid #777777; border-collapse: collapse;">$${displayCents(-player.out)}</td>
                <td style="padding: 7px; border: 1px solid #777777; border-collapse: collapse; color: ${player.amount > 0 ? "red" : "green"};">
                    $${displayCents(-player.amount)}
                </td>
            </tr>
        `;
    }

    const ret = `
        <table style="width: 100%;">
            <tr>
                <th style="padding: 7px; border: 1px solid #777777; border-collapse: collapse;">Name</th>
                <th style="padding: 7px; border: 1px solid #777777; border-collapse: collapse;">Venmo/Zelle</th>
                <th style="padding: 7px; border: 1px solid #777777; border-collapse: collapse;">Email</th>
                <th style="padding: 7px; border: 1px solid #777777; border-collapse: collapse;">In</th>
                <th style="padding: 7px; border: 1px solid #777777; border-collapse: collapse;">Out</th>
                <th style="padding: 7px; border: 1px solid #777777; border-collapse: collapse;">Net</th>
            </tr>
            ${tr}
        </table>
    `;

    return ret;
}

async function sendEmailsForPrebank(table) {
    const {nets, ins, outs} = getPlayerNets(table);
    const ledgerString = generateLedger(table);

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
                    <div style="border: 1px black solid; margin: 50px auto; max-width: 75%; border-radius: 15px;">
                        <h3>Ledger</h3>
                        ${ledgerString}
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

function getPaymentMethod(player, mode) {
    if(mode === "venmo") return player.venmo;
    if(mode === "zelle") return player.zelle;
    
    if(player.venmo && player.zelle) return `${player.venmo} / ${player.zelle}`;
    if(player.venmo) return player.venmo;
    if(player.zelle) return player.zelle;
    return "[no payment app]";
}

async function sendEmailsForTransfer(table) {
    const {nets, ins, outs} = getPlayerNets(table);
    const transactions = getDirectTransferTransactions(table);
    const ledgerString = generateLedger(table);

    if(!transactions) {
        console.error("Failed to get transfer transactions, perhaps the algorithm failed?");
        return;
    }

    let allTransactionsString = "";
    transactions.forEach(i => {
        const sender = table.players[i.sender];
        const recipient = table.players[i.recipient];
        const senderPaymentApp = getPaymentMethod(sender, i.method);
        const recipientPaymentApp = getPaymentMethod(recipient, i.method);

        allTransactionsString += `<li>${sender.name} (${senderPaymentApp}) pays ${recipient.name} (${recipientPaymentApp}) $${displayCents(i.amount)}</li>`;
    })

    for(const playerId of Object.keys(table.players)) {
        const player = table.players[playerId];
        const subject = `Thanks for playing at ${table.eventName}, Table ${table.tableNumber}`;
        const playerNet = nets[playerId];
        const playerReconciled = table.transactions.filter(i => i.player === playerId).some(i => i.reconciliation);

        let transfers = "";
        transactions.filter(i => i.sender === playerId).forEach(i => {
            const recipient = table.players[i.recipient];
            paymentApp = getPaymentMethod(recipient, i.method);

            transfers += `<li>Please send <b>$${displayCents(i.amount)}</b> to <b>${recipient.name}</b>: <b>${paymentApp}</b>.</li>`;
        });
        transactions.filter(i => i.recipient === playerId).forEach(i => {
            const sender = table.players[i.sender];
            const paymentApp = getPaymentMethod(sender, i.method);
            
            transfers += `<li>Expect a transfer of <b>$${displayCents(i.amount)}</b> from <b>${sender.name}</b>: <b>${paymentApp}</b>.</li>`;
        });
        if(transfers.length === 0) transfers = "<li>No action is required.</li>";

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
                    <div style="border: 1px black solid; margin: 50px auto; max-width: 75%; border-radius: 15px;">
                        <h3>Ledger</h3>
                        ${ledgerString}
                    </div>
                    <div style="border: 1px black solid; margin: 50px auto; max-width: 75%; border-radius: 15px;">
                        <h3>Transfers</h3>
                        <ul style="display: inline-block;">
                            ${allTransactionsString}
                        </ul>
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
    sendEmailsForBank,
    sendEmailsForPrebank,
    sendEmailsForTransfer,
    validateEmail,
};
