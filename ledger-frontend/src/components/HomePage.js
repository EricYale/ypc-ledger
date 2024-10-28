import React, { useEffect, useMemo } from "react";
import style from "./stylesheets/HomePage.module.scss";
import Logo from "../resources/logo_white.png";
import TableCard from "./TableCard";
import { API_URL } from "../helpers/consts";

const HomePage = () => {
    const [tables, setTables] = React.useState([]);

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

    const tableElems = useMemo(() => Object.values(tables).map(table => (
        <TableCard key={table.id} tableData={table} />
    )), [tables]);

    return (
        <div id={style.home_page}>
            <img src={Logo} alt="Yale Student Poker Club" id={style.logo} />
            <div id={style.tables_container}>
                { tableElems }
            </div>
        </div>
    )
};

export default HomePage;
