import React, { useCallback, useEffect, useMemo } from "react";
import style from "./stylesheets/HomePage.module.scss";
import Logo from "../resources/logo_white.png";
import TableCard from "./TableCard";
import { API_URL } from "../helpers/consts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Input from "./Input";
import Button from "./Button";

const HomePage = () => {
    const [tables, setTables] = React.useState(null);
    const [showingCreateModal, setShowingCreateModal] = React.useState(false);

    useEffect(() => {
        (async () => {
            let res;
            try {
                res = await fetch(API_URL + "/api/get_tables");
            } catch(e) {
                console.error("Could not fetch tables:", e);
                return;
            }
            const json = await res.json();
            setTables(json);
        })();
    }, []);

    const tableElems = useMemo(() => tables && Object.values(tables).filter(t => t.closedAt === null).map(table => (
        <TableCard key={table.id} tableData={table} />
    )), [tables]);

    const showModalButton = (
        <button id={style.create_table_button} onClick={() => setShowingCreateModal(true)}>
            <FontAwesomeIcon icon={faPlus} />
        </button>
    );

    if(!tables) {
        return (
            <div id={style.home_page}>
                Loading...
            </div>
        );
    }

    return (
        <div id={style.home_page}>
            <img src={Logo} alt="Yale Student Poker Club" id={style.logo} />
            <div id={style.tables_container}>
                { tableElems }
                { !showingCreateModal && showModalButton }
                { showingCreateModal && <CreateTableModal /> }
            </div>
        </div>
    )
};

const CreateTableModal = () => {
    const [roomNumber, setRoomNumber] = React.useState("WLH 003");
    const [tableNumber, setTableNumber] = React.useState("1");
    const [loading, setLoading] = React.useState(false);

    const createTable = useCallback(async (blindsString) => {
        if(roomNumber === "" || tableNumber === "") return;
        setLoading(true);
        const weekday = new Date().toLocaleString('en-us', {  weekday: 'long' });
        let res;
        try {
            res = await fetch(API_URL + "/api/create_table", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventName: `${weekday} Night Live`,
                    roomNumber,
                    tableNumber,
                    blinds: blindsString,
                }),
            });
        } catch(e) {
            console.error("Could not create table:", e);
            return;
        }
        const id = await res.text();
        window.location.href = `/table/${id}`;
    });

    if(loading) {
        return (
            <div id={style.create_table_modal}>
                <p>Gathering the chips...</p>
            </div>
        )
    }
    
    return (
        <div id={style.create_table_modal}>
            <h1>Start a table</h1>
            <Input
                label="Room #"
                placeholder="WLH 003"
                value={roomNumber}
                onChange={e => setRoomNumber(e.target.value)}
            />
            <Input
                label="Table #"
                placeholder="1"
                value={tableNumber}
                onChange={e => setTableNumber(e.target.value)}
            />
            <Button onClick={() => createTable("free")}>
                Create free table
            </Button>
            <Button onClick={() => createTable(".05/.10")}>
                Create 5¢/10¢ table
            </Button>
            <Button onClick={() => createTable(".10/.20")}>
                Create 10¢/20¢ table
            </Button>
            <Button onClick={() => createTable(".25/.50")}>
                Create 25¢/50¢ table
            </Button>
            <Button onClick={() => createTable("1/2")}>
                Create $1/$2 table
            </Button>
        </div>
    );
};

export default HomePage;
