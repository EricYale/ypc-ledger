import React, { useMemo } from "react";
import style from "./stylesheets/TableCard.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faRefresh } from "@fortawesome/free-solid-svg-icons";

const TableCard = ({ tableData }) => {
    const cardClass = useMemo(() => {
        if(tableData.bigBlind >= 1) return style.high_stakes;
        if(tableData.bigBlind >= 0.5) return style.mid_stakes;
        if(tableData.bigBlind > 0) return style.low_stakes;
        return style.no_stakes;
    }, [tableData]);

    const blindsDisplay = useMemo(() => {
        if(tableData.smallBlind === 0 && tableData.bigBlind === 0) return "Free play";
        if(Math.max(tableData.bigBlind, tableData.smallBlind) < 1) return `${tableData.smallBlind * 100}¢/${tableData.bigBlind * 100}¢`;
        return `$${tableData.smallBlind}/$${tableData.bigBlind}`;
    }, [tableData]);

    return (
        <div className={`${style.table_card} ${cardClass}`}>
            <p className={style.event_name}>
                <FontAwesomeIcon icon={faCircle} />
                {tableData.eventName}
            </p>
            <h2>{blindsDisplay} · {tableData.gameType} · {tableData.tableNumber}</h2>
            <p className={style.date}>October 31, 2024</p>
        </div>
    );
}

export default TableCard;
