import React, { useEffect, useMemo } from "react";
import style from "./stylesheets/TablePage.module.scss";
import { API_URL } from "../helpers/consts";
import { useParams } from "react-router-dom";
import { getUID } from "../helpers/localStorage";
import Button from "./Button";
import Input from "./Input";

const TablePage = () => {
    const {id} = useParams();
    const [tables, setTables] = React.useState(null);
    const [name, setName] = React.useState("");
    const [paymentApp, setPaymentApp] = React.useState("");
    const [email, setEmail] = React.useState("");
    const uid = getUID();

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

    const addUserToTable = async () => {
        if(!name || !paymentApp || !email) return;
        try {
            await fetch(API_URL + "/api/join_table", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: uid,
                    tableId: id,
                    name,
                    paymentApp,
                    email,
                }),
            });
        } catch(e) {
            console.error("Could not join table:", e);
            return;
        }
        await fetchTables();
    };

    const buyIn = async () => {
        setTables(null);
        try {
            await fetch(API_URL + "/api/buy_in", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: uid,
                    tableId: id,
                    name,
                    paymentApp,
                    email,
                }),
            });
        } catch(e) {
            console.error("Could not join table:", e);
            return;
        }
        await fetchTables();
    };

    const buyOut = async () => {

    };

    useEffect(() => {
        fetchTables();
    }, []);

    if(!tables) {
        return (
            <div id={style.table_page}>
                Loading...
            </div>
        )
    }
    const table = tables[id];
    if(!table) {
        return (
            <div id={style.table_page}>
                Table not found
            </div>
        )
    }

    if(!(uid in table.players)) {
        return (
            <div id={style.table_page}>
                <h1>Welcome to the table!</h1>
                <p>Integrity and fair play keep YPC fun. By joining this table, you agree to follow all standard rules and report buy ins/outs honestly.</p>
                <Input
                    largeInput
                    label="Name"
                    placeholder="Phil Hellmuth"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <Input
                    largeInput
                    label="Yale email"
                    placeholder="phil.hellmuth@yale.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <Input
                    largeInput
                    label="Venmo/Zelle"
                    placeholder="@philhellmuth"
                    value={paymentApp}
                    onChange={e => setPaymentApp(e.target.value)}
                />
                <Button onClick={addUserToTable}>
                    Let's play!
                </Button>
            </div>
        )
    }

    const currentMoneyIn = table.transactions
        .filter(i => i.player === uid)
        .reduce( (acc, curr) => acc + curr.amount, 0);

    const blindsDisplay = (() => {
        if(table.smallBlind === 0 && table.bigBlind === 0) return "Free play";
        if(Math.max(table.bigBlind, table.smallBlind) < 1) return `${table.smallBlind * 100}¢/${table.bigBlind * 100}¢`;
        return `$${table.smallBlind}/$${table.bigBlind}`;
    })();

    return (
        <div id={style.table_page}>
            <h1>{blindsDisplay} · {table.gameType} · {table.tableNumber}</h1>
            <h2>You're in for ${currentMoneyIn}</h2>
            {
                currentMoneyIn === 0 ? (
                    <Button onClick={buyIn}>
                        Buy in for ${table.bigBlind * 100}
                    </Button>
                ) : (
                    <>
                        <Button onClick={buyIn}>
                            Top up for ${table.bigBlind * 100}
                        </Button>
                        <Button onClick={buyOut}>
                            Buy out
                        </Button>
                    </>
                )
            }
        </div>
    )
};

export default TablePage;
