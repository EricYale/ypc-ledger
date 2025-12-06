import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { API_URL, createLedgerObject, displayCents } from "../helpers/consts";
import style from "./stylesheets/Ledger.module.scss";
import { faImage } from "@fortawesome/free-solid-svg-icons";

const Ledger = ({ table }) => {
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
                <td>{player.name}</td>
                <td>{player.venmo} {player.zelle}</td>
                <td className={player.email.includes("@yale.edu") ? "" : style.email_warning}>{player.email}</td>
                <td>${displayCents(player.in)}</td>
                <td>${displayCents(-player.out)}</td>
                <td className={player.amount > 0 ? style.lost : style.won}>${displayCents(-player.amount)}</td>
                <td>{photos}</td>
            </tr>
        )
    });

    return (
        <table id={style.ledger_table}>
            <tr>
                <th>Name</th>
                <th>Venmo/Zelle</th>
                <th>Email</th>
                <th>In</th>
                <th>Out</th>
                <th>Net</th>
                <th>Chips</th>
            </tr>
            {ledgerElems}
        </table>
    );
};

export default Ledger;
