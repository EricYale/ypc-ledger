import React, { useEffect, useMemo, useRef } from "react";
import style from "./stylesheets/TablePage.module.scss";
import { API_URL } from "../helpers/consts";
import { useParams } from "react-router-dom";
import { getUID, getToken } from "../helpers/localStorage";
import Button from "./Button";
import Input from "./Input";
import confetti from "canvas-confetti";
import ChipDenoms from "./ChipDenoms";

const TablePage = () => {
    const {id} = useParams();
    const [tables, setTables] = React.useState(null);
    const [name, setName] = React.useState("");
    const [paymentApp, setPaymentApp] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [showBuyOutUI, setShowBuyOutUI] = React.useState(false);
    const [buyOutAmount, setBuyOutAmount] = React.useState(0);
    const [successChipUrl, setSuccessChipUrl] = React.useState(null);
    const [error, setError] = React.useState(null);
    const uid = getUID();
    const token = getToken();

    const fetchTables = async () => {
        let res;
        try {
            res = await fetch(API_URL + "/api/get_tables");
        } catch(e) {
            console.error("Could not fetch tables:", e);
            setError(`Could not fetch tables: ${e.message}`);
            return;
        }
        if(!res.ok) {
            setError(`Could not fetch tables: ${res.status} ${await res.text()}`);
            return;
        }
        const json = await res.json();
        setTables(json);
    };

    const addUserToTable = async () => {
        if(!name || !paymentApp || !email) return;
        let res;
        try {
            res = await fetch(API_URL + "/api/join_table", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: uid,
                    userToken: token,
                    tableId: id,
                    name,
                    paymentApp,
                    email,
                }),
            });
        } catch(e) {
            console.error("Could not join table:", e);
            setError("Could not join table: " + e.message);
            return;
        }
        if(!res.ok) {
            setError("Could not join table: " + await res.text());
            return;
        }
        await fetchTables();
    };

    const buyIn = async () => {
        setTables(null);
        let res;
        try {
            res = await fetch(API_URL + "/api/buy_in", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: uid,
                    userToken: token,
                    tableId: id,
                    name,
                    paymentApp,
                    email,
                }),
            });
        } catch(e) {
            console.error("Could not buy in:", e);
            setError("Could not buy in: " + e.message);
            return;
        }
        if(!res.ok) {
            setError("Could not buy in: " + await res.text());
            return;
        }
        await fetchTables();
    };

    const buyOut = async () => {
        const chipPhoto = fileRef.current.files[0];
        if(!chipPhoto) return;
        const formData = new FormData();
        formData.append("chipImage", chipPhoto);

        setTables(null);
        let chipResp;
        try {
            chipResp = await fetch(API_URL + "/api/upload_chip_image", {
                method: "POST",
                body: formData,
            });
        } catch(e) {
            console.error("Could not upload chip photo:", e);
            setError("Could not upload chip photo: " + e.message);
            return;
        }
        if(!chipResp.ok) {
            setError("Could not upload chip photo: " + await chipResp.text());
            await fetchTables();
            return;
        }
        const chipUrl = await chipResp.text();

        let buyOutResp;
        try {
            buyOutResp = await fetch(API_URL + "/api/buy_out", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: uid,
                    userToken: token,
                    tableId: id,
                    amount: parseFloat(buyOutAmount),
                    chipPhoto: chipUrl,
                }),
            });
        } catch(e) {
            console.error("Could not buy out:", e);
            setError("Could not buy out: " + e.message);
            return;
        }
        if(!buyOutResp.ok) {
            setError("Could not buy out: " + await buyOutResp.text());
            await fetchTables();
            return;
        }
        setSuccessChipUrl(chipUrl);
        confetti({
            particleCount: 200,
            spread: 200,
            scalar: 1.5,
            ticks: 500,
            disableForReducedMotion: true,
        });
    };

    useEffect(() => {
        fetchTables();
    }, []);

    const fileRef = useRef(null);

    if(successChipUrl) {
        return (
            <div id={style.table_page}>
                <h1>Thanks for playing!</h1>
                <h2>You bought out for ${buyOutAmount}</h2>
                <img src={API_URL + "/chip_porn/" + successChipUrl} id={style.chip_image} alt="Your chips" />
            </div>
        )
    }
    if(!tables) {
        return (
            <div id={style.table_page}>
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
            <div id={style.table_page}>
                Table not found
                {
                    error && <p className={style.error}>{error}</p>
                }
            </div>
        )
    }
    if(table.closedAt !== null) {
        return (
            <div id={style.table_page}>
                Table is closed
                {
                    error && <p className={style.error}>{error}</p>
                }
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
                {
                    error && <p className={style.error}>{error}</p>
                }
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

    const buyOutUI = (
        <div id={style.buy_out_modal}>
            <h2>Buy out</h2>
            <Input
                label="Chip stack ($)"
                placeholder="25"
                value={buyOutAmount}
                onChange={e => setBuyOutAmount(e.target.value)}
            />
            <Input
                label="Photo of your chips"
                type="file"
                ref={fileRef}
            />
            <Button onClick={buyOut}>
                Confirm
            </Button>
            <Button onClick={() => setShowBuyOutUI(false)}>
                Cancel
            </Button>
        </div>
    );

    return (
        <div id={style.table_page}>
            <h1>{blindsDisplay} · {table.gameType} · {table.tableNumber}</h1>
            <h2>You're in for ${currentMoneyIn}</h2>
            <ChipDenoms denoms={table.denominations} startingStack={table.startingStack} />
            {
                error && <p className={style.error}>{error}</p>
            }
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
                        {
                            !showBuyOutUI && (
                                <Button onClick={() => setShowBuyOutUI(true)}>
                                    Buy out
                                </Button>
                            )
                        }
                        {showBuyOutUI && buyOutUI}
                    </>
                )
            }
        </div>
    )
};

export default TablePage;
