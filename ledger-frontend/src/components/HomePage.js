import React, { useEffect, useMemo } from "react";
import style from "./stylesheets/HomePage.module.scss";
import Logo from "../resources/ypc_logo_white.png";
import TableCard from "./TableCard";
import { API_URL } from "../helpers/consts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Button from "./Button";
import { getSavedAdminPassword } from "../helpers/localStorage";
import Dropdown from "./Dropdown";
import Input from "./Input";

const HomePage = () => {
    const [tables, setTables] = React.useState(null);
    const [error, setError] = React.useState(null);
    const [showingCreateModal, setShowingCreateModal] = React.useState(false);
    const password = getSavedAdminPassword();

    useEffect(() => {
        (async () => {
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
        })();
    }, []);

    const tableElems = useMemo(() => 
        tables && Object.values(tables)
            .filter(t => t.closedAt === null)
            .sort((a, b) => a.tableNumber.localeCompare(b.tableNumber))
            .map(table => (
                <TableCard key={table.id} tableData={table} />
            )
    ), [tables]);

    const showModalButton = password && (
        <button id={style.create_table_button} onClick={() => setShowingCreateModal(true)}>
            <FontAwesomeIcon icon={faPlus} />
        </button>
    );

    const usedTableNumbers = useMemo(
        () => tables && Object.values(tables).filter(t => t.closedAt === null).map(t => t.tableNumber)
    , [tables]);

    if(!tables) {
        return (
            <div id={style.home_page}>
                Loading...
                {
                    error && <p className={style.error}>{error}</p>
                }
            </div>
        );
    }

    return (
        <div id={style.home_page}>
            <img src={Logo} alt="Yale Student Poker Club" id={style.logo} />
            {
                error && <p className={style.error}>{error}</p>
            }
            <div id={style.tables_container}>
                { tableElems }
                { !showingCreateModal && showModalButton }
                { showingCreateModal && (
                    <CreateTableModal setError={setError} usedTableNumbers={usedTableNumbers} />
                )}
            </div>
        </div>
    )
};

const CreateTableModal = ({ setError, usedTableNumbers }) => {
    const TABLE_NUMBER_OPTIONS = [
        {value: "", label: "Select..."},
        { value: "A", label: "Table A" },
        { value: "B", label: "Table B" },
        { value: "C", label: "Table C" },
        { value: "D", label: "Table D" },
        { value: "E", label: "Table E" },
        { value: "F", label: "Table F" },
        { value: "G", label: "Table G" },
        { value: "H", label: "Table H" },
        { value: "I", label: "Table I" },
        { value: "J", label: "Table J" },
        { value: "K", label: "Table K" },
        { value: "L", label: "Table L" },
    ];
    const BLINDS_OPTIONS = [
        { value: ".02/.05", label: "2¢/5¢" },
        { value: ".05/.10", label: "5¢/10¢" },
        { value: ".10/.20", label: "10¢/20¢" },
        { value: ".25/.50", label: "25¢/50¢" },
        { value: "1/2", label: "$1/$2" },
    ];
    const BANKING_OPTIONS = [
        { value: "banker-prepay", label: "Banker (prepay)" },
        // { value: "banker", label: "Banker (pay after)" },
        { value: "transfer", label: "Direct transfers" },
    ];

    const tableNumberOptionsFiltered = TABLE_NUMBER_OPTIONS.filter(
        tn => !usedTableNumbers.includes(tn.value)
    );

    const [tableNumber, setTableNumber] = React.useState("");
    const [blinds, setBlinds] = React.useState(".05/.10");
    const [bankingMode, setBankingMode] = React.useState("banker-prepay");
    const [bankerVenmo, setBankerVenmo] = React.useState("");
    const [bankerZelle, setBankerZelle] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const password = getSavedAdminPassword();

    const createTable = async () => {
        if(!tableNumber || !blinds || !bankingMode) return;
        if(!bankerVenmo && !bankerZelle && bankingMode === "banker-prepay") return;
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
                    tableNumber,
                    blinds,
                    bankingMode,
                    bankerVenmo,
                    bankerZelle,
                    adminPassword: password,
                }),
            });
        } catch(e) {
            console.error("Could not create table:", e);
            setError(`Could not create table: ${e.message}`);
            return;
        }
        if(!res.ok) {
            setError(`Could not create table: ${res.status} ${await res.text()}`);
            return;
        }
        const id = await res.text();
        window.location.href = `/table/${id}`;
    };

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
            <Dropdown
                label="Table #"
                options={tableNumberOptionsFiltered}
                selected={tableNumber}
                onSelectedChange={setTableNumber}
            />
            <Dropdown
                label="Blinds"
                options={BLINDS_OPTIONS}
                selected={blinds}
                onSelectedChange={setBlinds}
            />
            <Dropdown
                label="Banking mode"
                options={BANKING_OPTIONS}
                selected={bankingMode}
                onSelectedChange={setBankingMode}
            />
            {
                bankingMode === "banker-prepay" && (
                    <>
                        <Input
                            label="Banker Venmo"
                            valiue={bankerVenmo}
                            onChange={e => setBankerVenmo(e.target.value)}
                            placeholder="@nickribs"
                        />
                        <Input
                            label="Banker Zelle"
                            valiue={bankerZelle}
                            onChange={e => setBankerZelle(e.target.value)}
                            placeholder="1-800-NICK-RIBS"
                        />
                    </>
                )
            }
            <Button onClick={createTable}>
                Create table
            </Button>
        </div>
    );
};

export default HomePage;
