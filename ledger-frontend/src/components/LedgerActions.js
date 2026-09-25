import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCodeMerge, faEye, faImage, faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import Modal from "./Modal";
import Button from "./Button";
import style from "./stylesheets/LedgerActions.module.scss";
import { API_URL, displayCents, isBuyIn, toCents } from "../helpers/consts";
import { getSavedAdminPassword } from "../helpers/localStorage";

export const postAdminAction = async (path, body) => {
    let res;
    try {
        res = await fetch(API_URL + path, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...body, adminPassword: getSavedAdminPassword() }),
        });
    } catch(e) {
        throw new Error(e.message);
    }
    if(!res.ok) throw new Error(`${res.status} ${await res.text()}`);
};

const transactionLabel = (transaction) => {
    if(transaction.adminAction) return `Admin adjustment (${transaction.adjusts})`;
    if(transaction.reconciliation) return "Reconciliation";
    return isBuyIn(transaction) ? "Buy-in" : "Buy-out";
};

const EditModal = ({ table, player, onClose, onUpdate }) => {
    const [amountIn, setAmountIn] = React.useState(displayCents(player.in));
    const [amountOut, setAmountOut] = React.useState(displayCents(-player.out));
    const [error, setError] = React.useState(null);
    const [saving, setSaving] = React.useState(false);
    const [confirmingRemove, setConfirmingRemove] = React.useState(false);

    const inCents = toCents(parseFloat(amountIn));
    const outCents = toCents(parseFloat(amountOut));
    const valid = !isNaN(inCents) && !isNaN(outCents);

    const save = async () => {
        if(saving) return;
        if(!valid) {
            setError("Please enter valid amounts");
            return;
        }
        setError(null);
        setSaving(true);
        try {
            await postAdminAction("/api/admin_adjust_player", {
                tableId: table.id,
                playerId: player.id,
                amountIn: inCents,
                amountOut: outCents,
            });
        } catch(e) {
            setError(`Could not save: ${e.message}`);
            setSaving(false);
            return;
        }
        await onUpdate();
        onClose();
    };

    const remove = async () => {
        if(saving) return;
        setError(null);
        setSaving(true);
        try {
            await postAdminAction("/api/remove_player", {
                tableId: table.id,
                playerId: player.id,
            });
        } catch(e) {
            setError(`Could not remove: ${e.message}`);
            setSaving(false);
            return;
        }
        await onUpdate();
        onClose();
    };

    return (
        <Modal title={`Edit ${player.name}`} onClose={onClose}>
            <label className={style.field}>
                <span className={style.field_label}>In</span>
                <span className={style.money_input}>
                    <span className={style.currency}>$</span>
                    <input
                        type="number"
                        inputMode="decimal"
                        value={amountIn}
                        onChange={e => setAmountIn(e.target.value)}
                    />
                </span>
            </label>
            <label className={style.field}>
                <span className={style.field_label}>Out</span>
                <span className={style.money_input}>
                    <span className={style.currency}>$</span>
                    <input
                        type="number"
                        inputMode="decimal"
                        value={amountOut}
                        onChange={e => setAmountOut(e.target.value)}
                    />
                </span>
            </label>
            <div className={style.net}>
                <span className={style.field_label}>Net</span>
                <span className={valid && outCents - inCents < 0 ? style.lost : style.won}>
                    {valid ? `$${displayCents(outCents - inCents)}` : "—"}
                </span>
            </div>
            {error && <p className={style.error}>{error}</p>}
            <Button onClick={save}>
                {saving ? "Saving..." : "Save"}
            </Button>
            {
                confirmingRemove ? (
                    <div className={style.remove_confirm}>
                        <span>Remove {player.name} and all their transactions?</span>
                        <div className={style.confirm}>
                            <button className={style.confirm_yes} onClick={remove}>
                                {saving ? "Removing..." : "Remove"}
                            </button>
                            <button className={style.confirm_no} onClick={() => setConfirmingRemove(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button className={style.remove_player} onClick={() => setConfirmingRemove(true)}>
                        🗑️ Remove user from table
                    </button>
                )
            }
        </Modal>
    );
};

const MergeModal = ({ table, player, onClose, onUpdate }) => {
    const otherPlayerIds = Object.keys(table.players).filter(id => id !== player.id);
    const [targetId, setTargetId] = React.useState(otherPlayerIds[0] || "");
    const [error, setError] = React.useState(null);
    const [merging, setMerging] = React.useState(false);

    const merge = async () => {
        if(merging || !targetId) return;
        setError(null);
        setMerging(true);
        try {
            await postAdminAction("/api/merge_players", {
                tableId: table.id,
                fromPlayerId: player.id,
                toPlayerId: targetId,
            });
        } catch(e) {
            setError(`Could not merge: ${e.message}`);
            setMerging(false);
            return;
        }
        await onUpdate();
        onClose();
    };

    if(otherPlayerIds.length === 0) {
        return (
            <Modal title={`Merge ${player.name}`} onClose={onClose}>
                <p className={style.explainer}>There is nobody else at this table to merge into.</p>
            </Modal>
        );
    }

    return (
        <Modal title={`Merge ${player.name}`} onClose={onClose}>
            <label className={style.field}>
                <span className={style.field_label}>Merge into</span>
                <select
                    className={style.select}
                    value={targetId}
                    onChange={e => setTargetId(e.target.value)}
                >
                    {
                        otherPlayerIds.map(id => (
                            <option key={id} value={id}>
                                {table.players[id].name} — {table.players[id].email}
                            </option>
                        ))
                    }
                </select>
            </label>
            {error && <p className={style.error}>{error}</p>}
            <Button onClick={merge}>
                {merging ? "Merging..." : "Merge"}
            </Button>
        </Modal>
    );
};

const TransactionsModal = ({ table, player, onClose, onUpdate }) => {
    const [confirmingKey, setConfirmingKey] = React.useState(null);
    const [error, setError] = React.useState(null);
    const [deleting, setDeleting] = React.useState(false);

    const transactions = table.transactions.filter(t => t.player === player.id);

    const deleteTransaction = async (transaction) => {
        if(deleting) return;
        setError(null);
        setDeleting(true);
        try {
            await postAdminAction("/api/delete_transaction", {
                tableId: table.id,
                playerId: player.id,
                timestamp: transaction.timestamp,
                amount: transaction.amount,
            });
        } catch(e) {
            setError(`Could not delete: ${e.message}`);
            setDeleting(false);
            return;
        }
        setConfirmingKey(null);
        setDeleting(false);
        await onUpdate();
    };

    const cards = transactions.map((transaction, index) => {
        const key = `${transaction.timestamp}|${player.id}|${transaction.amount}|${index}`;
        return (
            <div className={style.card} key={key}>
                <div className={style.card_main}>
                    <span className={transaction.amount > 0 ? style.lost : style.won}>
                        {transaction.amount < 0 ? "−" : "+"}${displayCents(Math.abs(transaction.amount))}
                    </span>
                    <span className={style.card_type}>{transactionLabel(transaction)}</span>
                </div>
                <div className={style.card_meta}>
                    <span>{moment(transaction.timestamp).format("MMM D, h:mm:ss a")}</span>
                    {
                        transaction.chipPhoto && (
                            <a
                                className={style.link}
                                href={API_URL + "/chip_porn/" + transaction.chipPhoto}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <FontAwesomeIcon icon={faImage} />
                            </a>
                        )
                    }
                </div>
                {
                    confirmingKey === key ? (
                        <div className={style.confirm}>
                            <button
                                className={style.confirm_yes}
                                onClick={() => deleteTransaction(transaction)}
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                            <button className={style.confirm_no} onClick={() => setConfirmingKey(null)}>
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            className={style.card_delete}
                            onClick={() => setConfirmingKey(key)}
                            aria-label="Delete transaction"
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    )
                }
            </div>
        );
    });

    return (
        <Modal title={player.name} onClose={onClose}>
            <div className={style.summary}>
                <span>In ${displayCents(player.in)}</span>
                <span>Out ${displayCents(-player.out)}</span>
                <span className={player.amount > 0 ? style.lost : style.won}>
                    Net ${displayCents(-player.amount)}
                </span>
            </div>
            {error && <p className={style.error}>{error}</p>}
            {
                cards.length === 0 ?
                    <p className={style.explainer}>No transactions yet.</p> :
                    <div className={style.feed}>{cards}</div>
            }
        </Modal>
    );
};

const LedgerActions = ({ table, player, onUpdate }) => {
    const [openModal, setOpenModal] = React.useState(null);
    const close = React.useCallback(() => setOpenModal(null), []);

    return (
        <>
            <div className={style.actions}>
                <button className={style.action} onClick={() => setOpenModal("edit")} aria-label="Edit">
                    <FontAwesomeIcon icon={faPencil} />
                </button>
                <button className={style.action} onClick={() => setOpenModal("merge")} aria-label="Merge">
                    <FontAwesomeIcon icon={faCodeMerge} />
                </button>
                <button className={style.action} onClick={() => setOpenModal("view")} aria-label="View">
                    <FontAwesomeIcon icon={faEye} />
                </button>
            </div>
            {
                openModal === "edit" &&
                    <EditModal table={table} player={player} onClose={close} onUpdate={onUpdate} />
            }
            {
                openModal === "merge" &&
                    <MergeModal table={table} player={player} onClose={close} onUpdate={onUpdate} />
            }
            {
                openModal === "view" &&
                    <TransactionsModal table={table} player={player} onClose={close} onUpdate={onUpdate} />
            }
        </>
    );
};

export default LedgerActions;
