import Input from "./Input";
import { displayCents } from "../helpers/consts";

export const validateJoinFields = ({ name, email, venmo, zelle }) => {
    if(!name || !email) return "Please enter name and email";
    if(!venmo && !zelle) return "Please enter Venmo and/or Zelle";
    return null;
};

const JoinTableFields = ({ table, name, setName, email, setEmail, venmo, setVenmo, zelle, setZelle, buyInAmount, setBuyInAmount }) => (
    <>
        <Input
            largeInput
            label="Name"
            placeholder="Phil Hellmuth"
            value={name}
            onChange={e => setName(e.target.value)}
        />
        <Input
            largeInput
            label="Yale email"
            placeholder="phil.hellmuth@yale.edu"
            value={email}
            onChange={e => setEmail(e.target.value)}
        />
        <Input
            largeInput
            label="Venmo"
            placeholder="@philhellmuth"
            value={venmo}
            onChange={e => setVenmo(e.target.value)}
        />
        <Input
            largeInput
            label="Zelle"
            placeholder="1-800-PRE-FLOP"
            value={zelle}
            onChange={e => setZelle(e.target.value)}
        />
        <Input
            largeInput
            label="Buy-in ($)"
            placeholder={displayCents(table.bigBlind * 100)}
            value={buyInAmount}
            onChange={e => setBuyInAmount(e.target.value)}
        />
    </>
);

export default JoinTableFields;
