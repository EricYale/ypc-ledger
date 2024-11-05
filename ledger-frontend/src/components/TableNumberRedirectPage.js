import React, { useEffect } from "react";
import { API_URL } from "../helpers/consts";
import { useParams } from "react-router-dom";

const TableNumberRedirectPage = () => {
    const { tableNumber } = useParams();

    useEffect(() => {
        (async () => {
            let res;
            try {
                res = await fetch(API_URL + "/api/get_tables");
            } catch(e) {
                console.error("Could not fetch tables:", e);
                window.location.href = "/";
                return;
            }
            if(!res.ok) {
                console.error("Error response");
                window.location.href = "/";
                return;
            }
            const json = await res.json();
            console.log(json)
            const table = Object.values(json).find(t => (
                t.closedAt === null &&
                t.tableNumber.toLowerCase() === tableNumber.toLowerCase()
            ));
            if(!table) {
                console.error("Did not find table");
                window.location.href = "/";
                return;
            }
            window.location.href = `/table/${table.id}`;
        })();
    }, [tableNumber]);
    
    return (
        <h3>Redirecting...</h3>
    );
};

export default TableNumberRedirectPage;
