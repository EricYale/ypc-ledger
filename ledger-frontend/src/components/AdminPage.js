import React, { useEffect } from "react";
import style from "./stylesheets/AdminPage.module.scss";
import Input from "./Input";
import Button from "./Button";
import { API_URL } from "../helpers/consts";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faImage, faX } from "@fortawesome/free-solid-svg-icons";

const AdminPage = () => {
    const {id} = useParams();
    const [tables, setTables] = React.useState(null);
    const [password, setPassword ] = React.useState("");
    const [bankerPaymentApp, setBankerPaymentApp] = React.useState("");
    const [passwordEntered, setPasswordEntered] = React.useState(false);

    const fetchTables = async () => {
        let res;
        try {
            res = await fetch(API_URL + "/api/get_tables");
        } catch(e) {
            console.error("Could not fetch tables:", e);
            return;
        }
        const json = await res.json();
        setTables(json);
    };

    useEffect(() => {
        fetchTables();
    }, []);

    if(!passwordEntered) {
        return (
            <div id={style.admin_page}>
                <h1>Admin Page</h1>
                <Input
                    label="Password"
                    type="password"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="foobar"
                />
                <Button onClick={() => setPasswordEntered(true)}>
                    Enter
                </Button>
            </div>
        );
    }

    if(!tables) {
        return (
            <div id={style.admin_page}>
                Loading...
            </div>
        )
    }
    const table = tables[id];
    if(!table) {
        return (
            <div id={style.admin_page}>
                Table not found
            </div>
        )
    }

    const blindsDisplay = (() => {
        if(table.smallBlind === 0 && table.bigBlind === 0) return "Free play";
        if(Math.max(table.bigBlind, table.smallBlind) < 1) return `${table.smallBlind * 100}¢/${table.bigBlind * 100}¢`;
        return `$${table.smallBlind}/$${table.bigBlind}`;
    })();

    const sendEmails = async () => {
        const isBankerMode = table.bankingMode === "banker" || table.bankingMode === "banker-prepay";
        if(!bankerPaymentApp && isBankerMode) return;
        setTables(null);
        try {
            await fetch(API_URL + "/api/send_emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    tableId: id,
                    adminPassword: password,
                    bankerPaymentApp,
                }),
            });
        } catch(e) {
            console.error("Could not send emails:", e);
            return;
        }
        await fetchTables();
    }

    const closeTable = async () => {
        setTables(null);
        try {
            await fetch(API_URL + "/api/close_table", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    tableId: id,
                    adminPassword: password,
                }),
            });
        } catch(e) {
            console.error("Could not close table:", e);
            return;
        }
        await fetchTables();
    }

    const ledger = Object.keys(table.players)
        .map(playerId => {
            return {
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
            }
        })
        .sort((a, b) => a.amount - b.amount);

    const ledgerElems = ledger.map(player => {
        const photos = table.transactions
            .filter(i => i.player === player.id)
            .filter(i => i.chipPhoto != null)
            .map(i => (
                <a className={style.link} href={API_URL + "/chip_porn/" + i.chipPhoto} target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon icon={faImage} />
                </a>
            ))
        return (
            <p key={player.id} style={{color: player.amount > 0 ? "#FF0000" : "#00FF00"}}>
                {player.name} • {player.paymentApp} • {player.email}:&nbsp;
                {player.amount > 0 ? "Lost" : "Won"}&nbsp;
                ${Math.abs(player.amount)} (in ${player.in} / out ${-player.out})
                {photos}
            </p>
        )
    });

    const ledgerSumsToZero = ledger.reduce((acc, curr) => acc + curr.amount, 0) === 0;

    return (
        <div id={style.admin_page}>
            <h1>{blindsDisplay} · {table.gameType} · {table.tableNumber}</h1>
            <div id={style.ledger}>
                <h2>Ledger</h2>
                <span id={style.sum}>
                    {
                        ledgerSumsToZero ? (
                            <span><FontAwesomeIcon icon={faCheck} /> Ledger checks out</span>
                        ) : (
                            <span><FontAwesomeIcon icon={faX} /> Ledger does not sum to zero</span>
                        )
                    }
                </span>
                {ledgerElems}
            </div>
            {
                !table.closedAt && (
                    <Button onClick={closeTable}>
                        Close table
                    </Button>
                ) 
            }
            {
                ledgerSumsToZero && !table.bankingIsSettled && (
                    <>
                        {
                            (table.bankingMode === "banker" || table.bankingMode === "banker-prepay") && (
                                <Input
                                    label="Banker Venmo & Zelle"
                                    type="text"
                                    placeholder="@nickribs"
                                    value={bankerPaymentApp}
                                    onChange={(e) => setBankerPaymentApp(e.target.value)}
                                />
                            )
                        }
                        <Button onClick={sendEmails}>
                            Send emails
                        </Button>
                    </>
                )
            }
        </div>
    )
};

export default AdminPage;
