import React, { useEffect } from "react";
import style from "./stylesheets/AdminPage.module.scss";
import Input from "./Input";
import Button from "./Button";
import { API_URL, blindsDisplay, displayCents } from "../helpers/consts";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCircleCheck, faCircleXmark, faImage, faX } from "@fortawesome/free-solid-svg-icons";
import { getSavedAdminPassword } from "../helpers/localStorage";

const AdminPage = () => {
    const {id} = useParams();
    const [tables, setTables] = React.useState(null);
    const [bankerPaymentApp, setBankerPaymentApp] = React.useState("");
    const [error, setError] = React.useState("");
    const password = getSavedAdminPassword();

    const fetchTables = async () => {
        let json;
        try {
            const res = await fetch(API_URL + "/api/get_tables");
            if(!res.ok) throw new Error(`Error ${res.status}`);
            json = await res.json();
        } catch(e) {
            console.error("Could not fetch tables:", e);
            setError(`Could not fetch tables: ${e.message}`);
            return;
        }
        setTables(json);
    };

    useEffect(() => {
        fetchTables();
    }, []);

    if(!tables) {
        return (
            <div id={style.admin_page}>
                Loading...
                {
                    error && <p className={style.error}>{error}</p>
                }
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

    const blindsText = blindsDisplay(table);

    console.log(table, blindsText)
    const sendEmails = async () => {
        if(!bankerPaymentApp && table.bankingMode === "banker") return;
        setTables(null);
        let resp;
        try {
            resp = await fetch(API_URL + "/api/send_emails", {
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
            setError("Error while sending emails");
            return;
        }
        if(!resp.ok) {
            setError(`Could not send emails: ${resp.status} ${await resp.text()}`);
            return;
        }
        await fetchTables();
    }

    const closeTable = async () => {
        setTables(null);
        let res;
        try {
            res = await fetch(API_URL + "/api/close_table", {
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
            setError("Could not close table");
            return;
        }
        if(!res.ok) {
            setError(`Could not close table: ${res.status} ${await res.text()}`);
            return;
        }
        await fetchTables();
    }

    const reconcileTable = async () => {
        setTables(null);
        let res;
        try {
            res = await fetch(API_URL + "/api/reconcile_table", {
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
            console.error("Could not reconcile table:", e);
            setError("Could not reconcile table");
            return;
        }
        if(!res.ok) {
            setError(`Could not reconcile table: ${res.status} ${await res.text()}`);
            return;
        }
        await fetchTables();
    }

    if(!password) {
        window.location.href = "/pw?dest=" + encodeURIComponent(window.location.pathname);
        return null;
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
            <tr key={player.id}>
                <td>{player.name}</td>
                <td>{player.paymentApp}</td>
                <td>{player.email}</td>
                <td>${displayCents(player.in)}</td>
                <td>${displayCents(-player.out)}</td>
                <td className={player.amount > 0 ? style.lost : style.won}>${displayCents(-player.amount)}</td>
                <td>{photos}</td>
            </tr>
        )
    });

    const ledgerSum = ledger.reduce((acc, curr) => acc + curr.amount, 0);
    const ledgerSumsToZero = ledgerSum === 0;

    return (
        <div id={style.admin_page}>
            <h1>{blindsText} · {table.gameType} · Table {table.tableNumber}</h1>
            {
                error && <p className={style.error}>{error}</p>
            }
            <div id={style.ledger}>
                <h2>Ledger</h2>
                <span id={style.sum}>
                    {
                        ledgerSumsToZero ? (
                            <span><FontAwesomeIcon icon={faCircleCheck} />Ledger checks out</span>
                        ) : (
                            <span>
                                <FontAwesomeIcon icon={faCircleXmark} /><br />
                                Ledger does not sum to zero.<br />
                                {
                                    ledgerSum > 0 ?
                                        `$${displayCents(ledgerSum)} extra money in the system` :
                                        `$${displayCents(-ledgerSum)} missing money`
                                }
                            </span>
                        )
                    }
                </span>
                <table id={style.ledger_table}>
                    <tr>
                        <th>Name</th>
                        <th>Venmo/Zelle</th>
                        <th>Email</th>
                        <th>In</th>
                        <th>Out</th>
                        <th>Net</th>
                        <th>Chips</th>
                    </tr>
                    {ledgerElems}
                </table>
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
                            (table.bankingMode === "banker") && (
                                <Input
                                    label="Banker Venmo & Zelle"
                                    type="text"
                                    placeholder="@nribeiro1"
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
            {
                !ledgerSumsToZero && (
                    <Button onClick={reconcileTable}>
                        Reconcile ledger
                    </Button>
                )
            }
        </div>
    )
};

export default AdminPage;
