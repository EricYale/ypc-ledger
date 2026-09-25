import React from "react";
import Modal from "./Modal";
import Button from "./Button";
import JoinTableFields, { validateJoinFields } from "./JoinTableFields";
import { postAdminAction } from "./LedgerActions";
import { toCents } from "../helpers/consts";
import style from "./stylesheets/LedgerActions.module.scss";

const AddPlayerModal = ({ table, onClose, onUpdate }) => {
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [venmo, setVenmo] = React.useState("");
    const [zelle, setZelle] = React.useState("");
    const [buyInAmount, setBuyInAmount] = React.useState(table.bigBlind);
    const [error, setError] = React.useState(null);
    const [saving, setSaving] = React.useState(false);

    const add = async () => {
        if(saving) return;
        const fieldsError = validateJoinFields({ name, email, venmo, zelle });
        if(fieldsError) {
            setError(fieldsError);
            return;
        }
        const buyInCents = toCents(parseFloat(buyInAmount));
        if(isNaN(buyInCents) || buyInCents < 0) {
            setError("Please enter a valid buy-in amount");
            return;
        }
        setError(null);
        setSaving(true);
        try {
            await postAdminAction("/api/admin_add_player", {
                tableId: table.id,
                name,
                email,
                venmo,
                zelle,
                amountIn: buyInCents,
            });
        } catch(e) {
            setError(`Could not add user: ${e.message}`);
            setSaving(false);
            return;
        }
        await onUpdate();
        onClose();
    };

    return (
        <Modal title="Add user" onClose={onClose}>
            <JoinTableFields
                table={table}
                name={name} setName={setName}
                email={email} setEmail={setEmail}
                venmo={venmo} setVenmo={setVenmo}
                zelle={zelle} setZelle={setZelle}
                buyInAmount={buyInAmount} setBuyInAmount={setBuyInAmount}
            />
            {error && <p className={style.error}>{error}</p>}
            <Button onClick={add}>
                {saving ? "Adding..." : "Add user"}
            </Button>
        </Modal>
    );
};

export default AddPlayerModal;
