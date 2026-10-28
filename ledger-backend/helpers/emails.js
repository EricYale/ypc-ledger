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

const FONT = "'Roboto Flex', Roboto, 'Helvetica Neue', Arial, sans-serif";
const COLORS = {
    background: "#F3F5FB",
    surface: "#FFFFFF",
    surfaceContainer: "#EEF1F8",
    outline: "#E2E5EE",
    onSurface: "#1A1C21",
    onSurfaceVariant: "#44474F",
    primaryContainer: "#D7E3FF",
    onPrimaryContainer: "#001B3F",
    winContainer: "#C3EFCC",
    onWinContainer: "#00210D",
    lossContainer: "#FFDAD6",
    onLossContainer: "#410002",
};

const PAGE_STYLE = `background-color: ${COLORS.background}; color: ${COLORS.onSurface}; font-family: ${FONT}; text-align: center; padding: 48px 16px;`;
const LOGO_STYLE = "max-width: 50%; max-height: 120px; margin: 16px 0 40px 0;";
const TITLE_STYLE = "font-size: 32px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; margin: 0 0 16px 0;";
const TABLE_CHIP_STYLE = `display: inline-block; background-color: ${COLORS.primaryContainer}; color: ${COLORS.onPrimaryContainer}; font-size: 16px; font-weight: 600; border-radius: 100px; padding: 8px 20px; margin: 0 0 32px 0;`;
const CARD_STYLE = `background-color: ${COLORS.surface}; border-radius: 32px; padding: 28px 24px; margin: 16px auto; max-width: 600px; text-align: left;`;
const CARD_TITLE_STYLE = "font-size: 22px; font-weight: 600; margin: 0 0 16px 0;";
const BODY_TEXT_STYLE = `color: ${COLORS.onSurfaceVariant}; font-size: 15px; line-height: 1.5;`;
const LIST_STYLE = `${BODY_TEXT_STYLE} margin: 0; padding-left: 20px;`;
const LIST_ITEM_STYLE = "margin-bottom: 8px;";
const STATS_CARD_STYLE = `${CARD_STYLE} text-align: center; padding: 16px;`;
const STAT_TILE_STYLE = `display: inline-block; vertical-align: top; width: 160px; margin: 6px; padding: 20px 8px; border-radius: 24px; background-color: ${COLORS.surfaceContainer};`;
const STAT_LABEL_STYLE = "text-transform: uppercase; font-weight: 600; font-size: 12px; letter-spacing: 0.8px; margin: 0; opacity: 0.8;";
const STAT_VALUE_STYLE = "font-size: 36px; font-weight: 700; letter-spacing: -1px; margin: 6px 0 0 0;";
const CELL_STYLE = `padding: 12px 8px; border-bottom: 1px solid ${COLORS.outline}; font-size: 14px; text-align: left;`;
const HEADER_CELL_STYLE = `padding: 8px; border-bottom: 1px solid ${COLORS.outline}; font-size: 12px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; color: ${COLORS.onSurfaceVariant}; text-align: left;`;

function netTileStyle(playerNet) {
    const background = playerNet >= 0 ? COLORS.winContainer : COLORS.lossContainer;
    const color = playerNet >= 0 ? COLORS.onWinContainer : COLORS.onLossContainer;
    return `${STAT_TILE_STYLE} border-radius: 40px; background-color: ${background}; color: ${color};`;
}

function netPillStyle(lost) {
    const background = lost ? COLORS.lossContainer : COLORS.winContainer;
    const color = lost ? COLORS.onLossContainer : COLORS.onWinContainer;
    return `display: inline-block; padding: 4px 12px; border-radius: 100px; font-weight: 600; background-color: ${background}; color: ${color};`;
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
                <td style="${CELL_STYLE}">
                    <span style="${netPillStyle(player.amount > 0)}">$${displayCents(-player.amount)}</span>
                </td>
            </tr>
        `;
    }

    const ret = `
        <table style="width: 100%; border-collapse: collapse; color: ${COLORS.onSurface};">
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
        const subject = `Thanks for playing at ${table.eventName}, Table ${table.tableNumber}`;
        const playerNet = nets[playerId];
        const playerReconciledMoneyRemoved = table.transactions.filter(i => i.player === playerId).some(i => i.reconciliation && i.amount > 0);
        const playerReconciledMoneyAdded = table.transactions.filter(i => i.player === playerId).some(i => i.reconciliation && i.amount < 0);

        const body = `
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;600;700&display=swap" rel="stylesheet" />
            </head>
            <body style="margin: 0; padding: 0; background-color: ${COLORS.background};">
                <div style="${PAGE_STYLE}">
                    <img
                        src="https://storage.googleapis.com/ypc-static/logo_black.png"
                        alt="Yale Poker Club"
                        style="${LOGO_STYLE}"
                    />
                    <h2 style="${TITLE_STYLE}">Thanks for playing at ${table.eventName}</h2>
                    <h3 style="${TABLE_CHIP_STYLE}">Table ${table.tableNumber}</h3>
                    <div style="${STATS_CARD_STYLE}">
                        <div style="${STAT_TILE_STYLE}">
                            <p style="${STAT_LABEL_STYLE}">IN FOR</p>
                            <p style="${STAT_VALUE_STYLE}">$${displayCents(ins[playerId])}</p>
                        </div>
                        <div style="${STAT_TILE_STYLE}">
                            <p style="${STAT_LABEL_STYLE}">OUT FOR</p>
                            <p style="${STAT_VALUE_STYLE}">$${displayCents(outs[playerId])}</p>
                        </div>
                        <div style="${netTileStyle(playerNet)}">
                            <p style="${STAT_LABEL_STYLE}">
                                ${playerNet >= 0 ? "Total earnings" : "Total losses"}
                            </p>
                            <p style="${STAT_VALUE_STYLE}">$${displayCents(Math.abs(playerNet))}</p>
                        </div>
                    </div>
                    <div style="${CARD_STYLE}">
                        <h3 style="${CARD_TITLE_STYLE}">Banking</h3>
                        <p style="${BODY_TEXT_STYLE}">
                            ${playerNet > 0 ? "Expect a Venmo to arrive from the banker. No action is required." : "No action is required."}
                        </p>
                        ${playerReconciledMoneyRemoved ? `<p style="${BODY_TEXT_STYLE}">This ledger had a discrepancy. Your balance was adjusted to reconcile the difference, which was split evenly amongst players. We deeply apologize; if you have any questions, ask a YPC officer.</p>` : ""}
                        ${playerReconciledMoneyAdded ? `<p style="${BODY_TEXT_STYLE}">This ledger had a discrepancy resulting in extra money in the system. Since you were the biggest winner, you were awarded the difference. It's your lucky day!</p>` : ""}
                    </div>
                    <div style="${CARD_STYLE}">
                        <h3 style="${CARD_TITLE_STYLE}">Ledger</h3>
                        <div style="overflow-x: auto;">
                            ${ledgerString}
                        </div>
                    </div>
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
            style="display: inline-block; margin-left: 8px; padding: 6px 16px; background-color: #008CFF; color: #FFFFFF; border-radius: 100px; text-decoration: none; font-weight: 600; vertical-align: middle;"
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

        allTransactionsString += `<li style="${LIST_ITEM_STYLE}">${sender.name} (${senderPaymentApp}) pays ${recipient.name} (${recipientPaymentApp}) $${displayCents(i.amount)}</li>`;
    })

    for(const playerId of Object.keys(table.players)) {
        const player = table.players[playerId];
        const subject = `Thanks for playing at ${table.eventName}, Table ${table.tableNumber}`;
        const playerNet = nets[playerId];
        const playerReconciledMoneyRemoved = table.transactions.filter(i => i.player === playerId).some(i => i.reconciliation && i.amount > 0);
        const playerReconciledMoneyAdded = table.transactions.filter(i => i.player === playerId).some(i => i.reconciliation && i.amount < 0);

        let transfers = "";
        transactions.filter(i => i.sender === playerId).forEach(i => {
            const recipient = table.players[i.recipient];
            const paymentApp = getPaymentMethod(recipient, i.method);
            const payButton = i.method === "zelle" ? "" : venmoPayButton(player, recipient, i.amount);

            transfers += `<li style="${LIST_ITEM_STYLE}">Please send <b>$${displayCents(i.amount)}</b> to <b>${recipient.name}</b>: <b>${paymentApp}</b>.${payButton}</li>`;
        });
        transactions.filter(i => i.recipient === playerId).forEach(i => {
            const sender = table.players[i.sender];
            const paymentApp = getPaymentMethod(sender, i.method);
            
            transfers += `<li style="${LIST_ITEM_STYLE}">Expect a transfer of <b>$${displayCents(i.amount)}</b> from <b>${sender.name}</b>: <b>${paymentApp}</b>.</li>`;
        });
        if(transfers.length === 0) transfers = `<li style="${LIST_ITEM_STYLE}">No action is required.</li>`;

        const body = `
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;600;700&display=swap" rel="stylesheet" />
            </head>
            <body style="margin: 0; padding: 0; background-color: ${COLORS.background};">
                <div style="${PAGE_STYLE}">
                    <img
                        src="https://storage.googleapis.com/ypc-static/logo_black.png"
                        alt="Yale Poker Club"
                        style="${LOGO_STYLE}"
                    />
                    <h2 style="${TITLE_STYLE}">Thanks for playing at ${table.eventName}</h2>
                    <h3 style="${TABLE_CHIP_STYLE}">Table ${table.tableNumber}</h3>
                    <div style="${STATS_CARD_STYLE}">
                        <div style="${STAT_TILE_STYLE}">
                            <p style="${STAT_LABEL_STYLE}">IN FOR</p>
                            <p style="${STAT_VALUE_STYLE}">$${displayCents(ins[playerId])}</p>
                        </div>
                        <div style="${STAT_TILE_STYLE}">
                            <p style="${STAT_LABEL_STYLE}">OUT FOR</p>
                            <p style="${STAT_VALUE_STYLE}">$${displayCents(outs[playerId])}</p>
                        </div>
                        <div style="${netTileStyle(playerNet)}">
                            <p style="${STAT_LABEL_STYLE}">
                                ${playerNet >= 0 ? "Total earnings" : "Total losses"}
                            </p>
                            <p style="${STAT_VALUE_STYLE}">$${displayCents(Math.abs(playerNet))}</p>
                        </div>
                    </div>
                    <div style="${CARD_STYLE}">
                        <h3 style="${CARD_TITLE_STYLE}">Banking</h3>
                        <ul style="${LIST_STYLE}">
                            ${transfers}
                        </ul>
                        ${playerReconciledMoneyRemoved ? `<p style="${BODY_TEXT_STYLE}">This ledger had a discrepancy. Your balance was adjusted to reconcile the difference, which was split evenly amongst players. We deeply apologize; if you have any questions, ask a YPC officer.</p>` : ""}
                        ${playerReconciledMoneyAdded ? `<p style="${BODY_TEXT_STYLE}">This ledger had a discrepancy resulting in extra money in the system. Since you were the biggest winner, you were awarded the difference. It's your lucky day!</p>` : ""}
                    </div>
                    <div style="${CARD_STYLE}">
                        <h3 style="${CARD_TITLE_STYLE}">Ledger</h3>
                        <div style="overflow-x: auto;">
                            ${ledgerString}
                        </div>
                    </div>
                    <div style="${CARD_STYLE}">
                        <h3 style="${CARD_TITLE_STYLE}">Transfers</h3>
                        <ul style="${LIST_STYLE}">
                            ${allTransactionsString}
                        </ul>
                    </div>
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
