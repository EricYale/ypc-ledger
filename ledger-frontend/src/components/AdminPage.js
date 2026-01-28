import React, { useEffect } from "react";
import style from "./stylesheets/AdminPage.module.scss";
import Button from "./Button";
import { API_URL, blindsDisplay, createLedgerObject, displayCents } from "../helpers/consts";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { getSavedAdminPassword } from "../helpers/localStorage";
import Ledger from "./Ledger";

const AdminPage = () => {
    const {id} = useParams();
    const [tables, setTables] = React.useState(null);
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

    const sendEmails = async () => {
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

    const postToLeaderboard = async () => {
        setTables(null);
        let res;
        try {
            res = await fetch(API_URL + "/api/update_leaderboard", {
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
            console.error("Could not post to leaderboard:", e);
            setError("Could not post to leaderboard");
            return;
        }
        if(!res.ok) {
            setError(`Could not post to leaderboard: ${res.status} ${await res.text()}`);
            return;
        }
        await fetchTables();
    }

    if(!password) {
        window.location.href = "/pw?dest=" + encodeURIComponent(window.location.pathname);
        return null;
    }

    const ledger = createLedgerObject(table);
    const ledgerSum = ledger.reduce((acc, curr) => acc + curr.amount, 0);
    const ledgerSumsToZero = ledgerSum === 0;
    const mailtoAllAddresses = Object.values(table.players).map(p => p.email).join(",");

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
                <Ledger table={table} />
            </div>
            <a id={style.mailto} href={"mailto:" + mailtoAllAddresses} target="_blank" rel="noreferrer">
                Email all players
            </a>
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
            {
                !table.addedToLeaderboard && (
                    <Button onClick={postToLeaderboard}>
                        Post to leaderboard
                    </Button>
                )
            }
        </div>
    )
};

export default AdminPage;
