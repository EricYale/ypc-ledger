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
        Source: `"YPC Ledger" <ledger@yalepokerclub.com>`,
    });

    await ses.send(sendCommand);
}

const SPOOKY_FONT = "'Creepster', 'Chiller', 'Papyrus', fantasy";
const CELL_STYLE = "padding: 7px; border: 1px solid #7a3d12; border-collapse: collapse;";
const HEADER_CELL_STYLE = `${CELL_STYLE} font-family: ${SPOOKY_FONT}; font-weight: normal; font-size: 18px; letter-spacing: 1px; color: #ff7518; background-color: #2a1347;`;
const BOX_STYLE = "border: 2px solid #ff7518; background-color: #1f0f33; margin: 50px auto; max-width: 75%; border-radius: 15px; padding: 10px 20px; box-shadow: 0 0 25px rgba(255, 117, 24, 0.4);";
const HEADING_STYLE = `font-family: ${SPOOKY_FONT}; font-weight: normal; font-size: 30px; letter-spacing: 2px; color: #ff7518; margin: 15px 0;`;
const STAT_LABEL_STYLE = "text-transform: uppercase; font-weight: bold; font-size: 12px; letter-spacing: 2px; color: #b388ff;";
const STAT_VALUE_STYLE = `font-family: ${SPOOKY_FONT}; font-size: 48px; margin: 10px;`;
const WIN_COLOR = "#7dff3a";
const LOSS_COLOR = "#ff2a3d";

function renderSpookyEmail({ table, playerIn, playerOut, playerNet, sections }) {
    return `
        <html>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Creepster&display=swap" rel="stylesheet" />
            </head>
            <body style="margin: 0; padding: 0; background-color: #0b0613;">
                <div style="background-color: #120a1f; background-image: radial-gradient(circle at 85% 60px, #fff6d5 0, #ffe9a8 40px, rgba(255, 117, 24, 0.25) 45px, transparent 140px); color: #f4ead5; text-align: center; font-family: 'Lato', sans-serif; padding: 20px 10px 40px 10px;">
                    <p style="font-size: 36px; margin: 20px 0 0 0; letter-spacing: 12px;">🦇🎃👻🎃🦇</p>
                    <img
                        src="https://storage.googleapis.com/ypc-static/logo_white.png"
                        alt="Yale Poker Club"
                        style="max-width: 50%; max-height: 160px; margin: 50px 0;"
                    />
                    <h1 style="${HEADING_STYLE} font-size: 44px; text-shadow: 3px 3px 0 #000;">Thanks for playing at ${table.eventName}</h1>
                    <h3 style="${HEADING_STYLE} font-size: 26px; color: #7dff3a; margin-bottom: 50px;">🪦 Table ${table.tableNumber} 🪦</h3>
                    <div style="${BOX_STYLE}">
                        <div style="display: inline-block; margin-right: 50px;">
                            <p style="${STAT_LABEL_STYLE}">IN FOR</p>
                            <p style="${STAT_VALUE_STYLE}">$${displayCents(playerIn)}</p>
                        </div>
                        <div style="display: inline-block; margin-right: 50px;">
                            <p style="${STAT_LABEL_STYLE}">OUT FOR</p>
                            <p style="${STAT_VALUE_STYLE}">$${displayCents(playerOut)}</p>
                        </div>
                        <div style="display: inline-block;">
                            <p style="${STAT_LABEL_STYLE}">
                                ${playerNet >= 0 ? "Total earnings 🍬" : "Total losses 💀"}
                            </p>
                            <p style="${STAT_VALUE_STYLE} color: ${playerNet >= 0 ? WIN_COLOR : LOSS_COLOR};">$${displayCents(Math.abs(playerNet))}</p>
                        </div>
                    </div>
                    ${sections.map(({ title, content }) => `
                        <div style="${BOX_STYLE}">
                            <h3 style="${HEADING_STYLE}">${title}</h3>
                            ${content}
                        </div>
                    `).join("")}
                    <p style="font-family: ${SPOOKY_FONT}; font-size: 22px; letter-spacing: 2px; color: #b388ff; margin-top: 60px;">🕷️ Happy Halloween from YPC 🕷️</p>
                </div>
            </body>
        </html>
    `;
}

function reconciliationNotes(playerReconciledMoneyRemoved, playerReconciledMoneyAdded) {
    return `
        ${playerReconciledMoneyRemoved ? "<p>This ledger had a discrepancy. Your balance was adjusted to reconcile the difference, which was split evenly amongst players. We deeply apologize; if you have any questions, ask a YPC officer.</p>" : ""}
        ${playerReconciledMoneyAdded ? "<p>This ledger had a discrepancy resulting in extra money in the system. Since you were the biggest winner, you were awarded the difference. It's your lucky day!</p>" : ""}
    `;
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
                <td style="${CELL_STYLE}">${player.name}</td>
                <td style="${CELL_STYLE}">${player.venmo} ${player.zelle}</td>
                <td style="${CELL_STYLE}">${player.email}</td>
                <td style="${CELL_STYLE}">$${displayCents(player.in)}</td>
                <td style="${CELL_STYLE}">$${displayCents(-player.out)}</td>
                <td style="${CELL_STYLE} color: ${player.amount > 0 ? LOSS_COLOR : WIN_COLOR};">
                    $${displayCents(-player.amount)}
                </td>
            </tr>
        `;
    }

    const ret = `
        <table style="width: 100%; border-collapse: collapse; color: #f4ead5; margin-bottom: 15px;">
            <tr>
                <th style="${HEADER_CELL_STYLE}">Name</th>
                <th style="${HEADER_CELL_STYLE}">Venmo/Zelle</th>
                <th style="${HEADER_CELL_STYLE}">Email</th>
                <th style="${HEADER_CELL_STYLE}">In</th>
                <th style="${HEADER_CELL_STYLE}">Out</th>
                <th style="${HEADER_CELL_STYLE}">Net</th>
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
        const subject = `🎃 Thanks for playing at ${table.eventName}, Table ${table.tableNumber}`;
        const playerNet = nets[playerId];
        const playerReconciledMoneyRemoved = table.transactions.filter(i => i.player === playerId).some(i => i.reconciliation && i.amount > 0);
        const playerReconciledMoneyAdded = table.transactions.filter(i => i.player === playerId).some(i => i.reconciliation && i.amount < 0);

        const body = renderSpookyEmail({
            table,
            playerIn: ins[playerId],
            playerOut: outs[playerId],
            playerNet,
            sections: [
                {
                    title: "🦇 Banking 🦇",
                    content: `
                        <p>
                            ${playerNet > 0 ? "Expect a Venmo to arrive from the banker. No action is required." : "No action is required."}
                        </p>
                        ${reconciliationNotes(playerReconciledMoneyRemoved, playerReconciledMoneyAdded)}
                    `,
                },
                { title: "📜 Ledger 📜", content: ledgerString },
            ],
        });
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

function venmoHandle(player) {
    return (player.venmo || "").trim().replace(/^@/, "");
}

function venmoPayButton(sender, recipient, amountCents) {
    const recipientHandle = venmoHandle(recipient);
    if(!venmoHandle(sender) || !recipientHandle) return "";

    const url = `https://venmo.com/${encodeURIComponent(recipientHandle)}?txn=pay&amount=${(amountCents / 100).toFixed(2)}`;

    return `
        <a
            href="${url}"
            style="display: inline-block; margin-left: 8px; padding: 4px 12px; background-color: #008CFF; color: #FFFFFF; border-radius: 6px; text-decoration: none; font-weight: bold; vertical-align: middle;"
        >
            <img
                src="https://storage.googleapis.com/ypc-static/venmo-icon-white.png"
                alt=""
                width="14"
                height="14"
                style="vertical-align: middle; margin-right: 4px; border: 0;"
            /><span style="vertical-align: middle; color: #FFFFFF;">Pay</span>
        </a>
    `;
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
        const subject = `🎃 Thanks for playing at ${table.eventName}, Table ${table.tableNumber}`;
        const playerNet = nets[playerId];
        const playerReconciledMoneyRemoved = table.transactions.filter(i => i.player === playerId).some(i => i.reconciliation && i.amount > 0);
        const playerReconciledMoneyAdded = table.transactions.filter(i => i.player === playerId).some(i => i.reconciliation && i.amount < 0);

        let transfers = "";
        transactions.filter(i => i.sender === playerId).forEach(i => {
            const recipient = table.players[i.recipient];
            const paymentApp = getPaymentMethod(recipient, i.method);
            const payButton = i.method === "zelle" ? "" : venmoPayButton(player, recipient, i.amount);

            transfers += `<li style="margin-bottom: 8px;">Please send <b>$${displayCents(i.amount)}</b> to <b>${recipient.name}</b>: <b>${paymentApp}</b>.${payButton}</li>`;
        });
        transactions.filter(i => i.recipient === playerId).forEach(i => {
            const sender = table.players[i.sender];
            const paymentApp = getPaymentMethod(sender, i.method);
            
            transfers += `<li>Expect a transfer of <b>$${displayCents(i.amount)}</b> from <b>${sender.name}</b>: <b>${paymentApp}</b>.</li>`;
        });
        if(transfers.length === 0) transfers = "<li>No action is required.</li>";

        const body = renderSpookyEmail({
            table,
            playerIn: ins[playerId],
            playerOut: outs[playerId],
            playerNet,
            sections: [
                {
                    title: "🦇 Banking 🦇",
                    content: `
                        <ul style="display: inline-block; text-align: left;">
                            ${transfers}
                        </ul>
                        ${reconciliationNotes(playerReconciledMoneyRemoved, playerReconciledMoneyAdded)}
                    `,
                },
                { title: "📜 Ledger 📜", content: ledgerString },
                {
                    title: "👻 Transfers 👻",
                    content: `
                        <ul style="display: inline-block; text-align: left;">
                            ${allTransactionsString}
                        </ul>
                    `,
                },
            ],
        });
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
