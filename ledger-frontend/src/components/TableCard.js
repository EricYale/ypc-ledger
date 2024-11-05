import React, { useMemo } from "react";
import style from "./stylesheets/TableCard.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { blindsDisplay } from "../helpers/consts";

const TableCard = ({ tableData }) => {
    const cardClass = useMemo(() => {
        if(tableData.bigBlind >= 100) return style.high_stakes;
        if(tableData.bigBlind >= 50) return style.mid_stakes;
        if(tableData.bigBlind > 0) return style.low_stakes;
        return style.no_stakes;
    }, [tableData]);

    const blindsText = blindsDisplay(tableData);

    return (
        <Link to={`/table/${tableData.id}`} className={style.link}>
            <div className={`${style.table_card} ${cardClass}`}>
                <p className={style.event_name}>
                    <FontAwesomeIcon icon={faCircle} />
                    {tableData.eventName}
                </p>
                <h2>{blindsText} · {tableData.gameType} · Table {tableData.tableNumber}</h2>
                <p className={style.date}>October 31, 2024</p>
            </div>
        </Link>
    );
}

export default TableCard;
