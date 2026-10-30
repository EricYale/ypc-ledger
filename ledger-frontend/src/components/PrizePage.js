import React, { useEffect, useMemo, useRef, useState } from "react";
import style from "./stylesheets/PrizePage.module.scss";
import { API_URL, displayCents, generateHash, isBuyIn, isBuyOut } from "../helpers/consts";
import QuarterZipImage from "../resources/quarterzip.png";
import FishImage from "../resources/fish.png";

const POLL_INTERVAL_MS = 5000;
const TONIGHT_WINDOW_MS = 12 * 60 * 60 * 1000;
const CONTENDER_COUNT = 4;
const BANNER_DURATION_MS = 4500;
const FISH_ANIMATION_MS = 2000;
const GOLDEN_RATIO_CONJUGATE = 0.618033988749895;

const BANNER_TEXT = {
    in: e => `${e.name} bought in for $${displayCents(e.amount)}`,
    topup: e => `${e.name} topped up $${displayCents(e.amount)}`,
    out: e => `${e.name} bought out for $${displayCents(e.amount)}`,
};

const BANNER_STYLES = {
    in: style.buy_in,
    topup: style.top_up,
    out: style.buy_out,
};

const FISH_ANIMATION_STYLES = {
    in: style.dropping,
    topup: style.topping_up,
};

const transactionKey = (tableId, transaction) =>
    `${tableId}|${transaction.player}|${transaction.timestamp}|${transaction.amount}`;

const playerKey = info => info.email.trim().toLowerCase();

const formatBB = bb => `${bb >= 0 ? "+" : ""}${bb.toFixed(1)} BB`;

function getTonightsTables(tables) {
    const cutoff = Date.now() - TONIGHT_WINDOW_MS;
    return Object.values(tables).filter(table => new Date(table.createdAt).getTime() >= cutoff);
}

function computeStandings(tables) {
    const players = {};
    for(const table of tables) {
        for(const [playerId, info] of Object.entries(table.players)) {
            const transactions = table.transactions.filter(t => t.player === playerId);
            if(!transactions.some(isBuyIn)) continue;

            const key = playerKey(info);
            players[key] ??= { key, name: info.name, bb: 0, cashedOut: false, firstBuyIn: transactions[0].timestamp };
            if(transactions[0].timestamp < players[key].firstBuyIn) players[key].firstBuyIn = transactions[0].timestamp;

            const hasCashedOut = isBuyOut(transactions[transactions.length - 1]);
            if(!hasCashedOut || !table.bigBlind) continue;
            const net = -transactions.reduce((acc, t) => acc + t.amount, 0);
            players[key].bb += net / table.bigBlind;
            players[key].cashedOut = true;
        }
    }

    const ranked = Object.values(players)
        .filter(p => p.cashedOut)
        .sort((a, b) => b.bb - a.bb || a.name.localeCompare(b.name));
    const podiumKeys = new Set(ranked.slice(0, CONTENDER_COUNT + 1).map(p => p.key));

    return {
        winner: ranked[0] ?? null,
        contenders: ranked.slice(1, CONTENDER_COUNT + 1),
        pond: Object.values(players)
            .filter(p => !podiumKeys.has(p.key))
            .sort((a, b) => a.firstBuyIn.localeCompare(b.firstBuyIn)),
    };
}

function findNewTransactions(tables, seenKeys) {
    const events = [];
    const boughtInBefore = new Set();
    for(const table of tables) {
        for(const transaction of table.transactions) {
            const info = table.players[transaction.player];
            if(!info) continue;
            const id = transactionKey(table.id, transaction);
            if(seenKeys.has(id)) {
                if(isBuyIn(transaction)) boughtInBefore.add(playerKey(info));
                continue;
            }
            events.push({
                id,
                playerKey: playerKey(info),
                name: info.name,
                isBuyIn: isBuyIn(transaction),
                amount: Math.abs(transaction.amount),
                timestamp: transaction.timestamp,
            });
        }
    }
    return events
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        .map(({ isBuyIn, ...event }) => {
            if(!isBuyIn) return { ...event, type: "out" };
            const type = boughtInBefore.has(event.playerKey) ? "topup" : "in";
            boughtInBefore.add(event.playerKey);
            return { ...event, type };
        });
}

function allTransactionKeys(tables) {
    return new Set(tables.flatMap(table => table.transactions.map(t => transactionKey(table.id, t))));
}

async function fetchTables() {
    try {
        const res = await fetch(API_URL + "/api/get_tables");
        if(!res.ok) throw new Error(`Error ${res.status}`);
        return await res.json();
    } catch(e) {
        console.error("Could not fetch tables:", e);
        return null;
    }
}

const PrizePage = () => {
    const [tables, setTables] = useState(null);
    const [banners, setBanners] = useState([]);
    const [fishAnimations, setFishAnimations] = useState({});
    const seenKeysRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        let pollTimeout;

        const animateFish = event => {
            setFishAnimations(prev => ({ ...prev, [event.playerKey]: event }));
            setTimeout(() => {
                setFishAnimations(prev => {
                    if(prev[event.playerKey] !== event) return prev;
                    const { [event.playerKey]: _, ...rest } = prev;
                    return rest;
                });
            }, FISH_ANIMATION_MS);
        };

        const poll = async () => {
            const allTables = await fetchTables();
            if(cancelled) return;
            if(allTables) {
                const tonight = getTonightsTables(allTables);
                if(seenKeysRef.current) {
                    const events = findNewTransactions(tonight, seenKeysRef.current);
                    events.filter(e => e.type !== "out").forEach(animateFish);
                    if(events.length) setBanners(prev => [...prev, ...events]);
                }
                seenKeysRef.current = allTransactionKeys(tonight);
                setTables(tonight);
            }
            pollTimeout = setTimeout(poll, POLL_INTERVAL_MS);
        };

        poll();
        return () => {
            cancelled = true;
            clearTimeout(pollTimeout);
        };
    }, []);

    useEffect(() => {
        if(!banners.length) return;
        const timeout = setTimeout(() => setBanners(prev => prev.slice(1)), BANNER_DURATION_MS);
        return () => clearTimeout(timeout);
    }, [banners]);

    const standings = useMemo(() => tables && computeStandings(tables), [tables]);

    if(!standings) return <div id={style.prize_page} />;

    const { winner, contenders, pond } = standings;
    const banner = banners[0];

    return (
        <div id={style.prize_page}>
            <div id={style.top}>
                <div id={style.hero}>
                    <div id={style.prize_image}>
                        <img src={QuarterZipImage} alt="YPC quarter zip" />
                    </div>
                    <div id={style.winner}>
                        <p className={style.eyebrow}>Future quarter zip owner</p>
                        {winner ? (
                            <div key={winner.key} className={style.winner_details}>
                                <h1>{winner.name}</h1>
                                <p className={style.winner_bb}>{formatBB(winner.bb)}</p>
                            </div>
                        ) : (
                            <div className={style.winner_details}>
                                <h1>???</h1>
                                <p className={style.winner_label}>Nobody has cashed out yet...</p>
                            </div>
                        )}
                    </div>
                </div>
                <div id={style.leaderboard}>
                    {contenders.map((player, i) => (
                        <div
                            key={player.key}
                            className={style.leaderboard_row}
                            style={{ top: `${i * (100 / CONTENDER_COUNT)}%` }}
                        >
                            <span className={style.rank}>{i + 2}</span>
                            <span className={style.name}>{player.name}</span>
                            <span className={style.score}>{formatBB(player.bb)}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div id={style.pond}>
                {pond.map((player, i) => (
                    <Fish key={player.key} player={player} lane={i} animation={fishAnimations[player.key]} />
                ))}
            </div>
            {banner && (
                <div key={banner.id} className={`${style.banner} ${BANNER_STYLES[banner.type]}`}>
                    {BANNER_TEXT[banner.type](banner)}
                </div>
            )}
        </div>
    );
};

const Fish = ({ player, lane, animation }) => {
    const hash = seed => Math.abs(generateHash(player.key + seed));
    return (
        <div className={style.fish} style={{
            "--lane": `${((lane * GOLDEN_RATIO_CONJUGATE) % 1) * 70}%`,
            "--swim-period": `${18 + (hash("swim") % 16)}s`,
            "--swim-delay": `-${hash("delay") % 30}s`,
            "--bob-period": `${(200 + (hash("bob") % 200)) / 100}s`,
        }}>
            <div key={animation?.id} className={animation && FISH_ANIMATION_STYLES[animation.type]}>
                {animation?.type === "topup" && (
                    <span className={style.topup_amount}>+${displayCents(animation.amount)}</span>
                )}
                <div className={style.bob}>
                    <img
                        src={FishImage}
                        alt={player.name}
                        style={{ filter: `hue-rotate(${generateHash(player.key + "color") % 360}deg)` }}
                    />
                    <p>{player.name}</p>
                </div>
            </div>
        </div>
    );
};

export default PrizePage;
