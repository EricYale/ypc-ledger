export const API_URL = process.env.NODE_ENV === "development" ?
    "http://localhost:1337" :
    window.location.origin;

export const CHIP_COLOR_FILTERS = {
    "white": "contrast(0.3) saturate(0) brightness(1.5)",
    "red": "inherit",
    "blue": "hue-rotate(240deg)",
    "green": "hue-rotate(125deg) brightness(75%)",
    "black": "contrast(100) saturate(0)",
}

export function toCents(dollars){
    return Math.round((Math.abs(dollars) / 100) * 10000);
}

export function displayCents(cents) {
    if(cents % 100 === 0) return (cents / 100).toFixed(0);
    return (cents / 100).toFixed(2);
}

export function blindsDisplay({smallBlind, bigBlind}) {
    if(smallBlind === 0 && bigBlind === 0) return "Free play";
    if(Math.max(bigBlind, smallBlind) < 100) return `${smallBlind}¢/${bigBlind}¢`;
    return `$${displayCents(smallBlind)}/$${displayCents(bigBlind)}`;
};

export function createLedgerObject(table) {
    return Object.keys(table.players)
        .map(playerId => {
            return {
                ...table.players[playerId],
                id: playerId,
                amount: table.transactions
                    .filter(i => i.player === playerId)
                    .reduce((acc, curr) => acc + curr.amount, 0),
                in: table.transactions
                    .filter(i => i.player === playerId)
                    .filter(i => i.amount > 0)
                    .reduce((acc, curr) => acc + curr.amount, 0),
                out: table.transactions
                    .filter(i => i.player === playerId)
                    .filter(i => i.amount < 0)
                    .reduce((acc, curr) => acc + curr.amount, 0),
            }
        })
        .sort((a, b) => a.amount - b.amount);
}

// https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
export const generateHash = (string) => {
    let hash = 0;
    for (const char of string) {
        hash = (hash << 5) - hash + char.charCodeAt(0);
        hash |= 0;
    }
    return hash;
};
