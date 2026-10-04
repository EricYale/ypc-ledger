import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { API_URL, createLedgerObject, displayCents } from "../helpers/consts";
import style from "./stylesheets/Ledger.module.scss";
import { faCircleCheck, faImage } from "@fortawesome/free-solid-svg-icons";
import LedgerActions, { postAdminAction } from "./LedgerActions";

const CheckToggle = ({ table, player, onUpdate }) => {
    const [checked, setChecked] = React.useState(!!player.checked);

    React.useEffect(() => setChecked(!!player.checked), [player.checked]);

    const toggle = async () => {
        const next = !checked;
        setChecked(next);
        try {
            await postAdminAction("/api/admin_set_player_checked", { tableId: table.id, playerId: player.id, checked: next });
        } catch(e) {
            setChecked(!next);
            alert(e.message);
            return;
        }
        onUpdate();
    };

    return (
        <button className={`${style.check} ${checked ? style.checked : ""}`} onClick={toggle}>
            <FontAwesomeIcon icon={faCircleCheck} />
        </button>
    );
};

const Ledger = ({ table, admin, onUpdate }) => {
    const ledger = createLedgerObject(table);
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
                {admin && <td><CheckToggle table={table} player={player} onUpdate={onUpdate} /></td>}
                <td>{player.name}</td>
                <td>{player.venmo} {player.zelle}</td>
                <td className={player.email.toLowerCase().includes("@yale.edu") ? "" : style.email_warning}>{player.email}</td>
                <td>${displayCents(player.in)}</td>
                <td>${displayCents(-player.out)}</td>
                <td className={player.amount > 0 ? style.lost : style.won}>${displayCents(-player.amount)}</td>
                <td>{photos}</td>
                {
                    admin && (
                        <td>
                            <LedgerActions table={table} player={player} onUpdate={onUpdate} />
                        </td>
                    )
                }
            </tr>
        )
    });

    return (
        <div id={style.ledger_scroll}>
            <table id={style.ledger_table}>
                <tr>
                    {admin && <th />}
                    <th>Name</th>
                    <th>Venmo/Zelle</th>
                    <th>Email</th>
                    <th>In</th>
                    <th>Out</th>
                    <th>Net</th>
                    <th>Photo</th>
                    {admin && <th>Actions</th>}
                </tr>
                {ledgerElems}
            </table>
        </div>
    );
};

export default Ledger;
