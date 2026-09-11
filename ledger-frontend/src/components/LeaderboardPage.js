import React from "react";
import style from "./stylesheets/LeaderboardPage.module.scss";
import { API_URL, displayCents, generateHash } from "../helpers/consts";
import { useEffect, useMemo } from "react";
import SharkImage from "../resources/shark.png";
import FishImage from "../resources/fish.png";
import WhaleImage from "../resources/whale.png";
import WinLossGraph from "./WinLossGraph";

const GOLDEN_RATIO_CONJUGATE = 0.618033988749895;
const OCEAN_BASE_HEIGHT = "1950vh";
const ROW_HEIGHT_PX = 340;

const SORT_MODES = {
    bb: { label: "Big blinds", compare: (a, b) => a.bbProfit - b.bbProfit },
    dollars: { label: "Dollars", compare: (a, b) => a.totalProfit - b.totalProfit },
};

const LeaderboardPage = () => {
    const [users, setUsers] = React.useState(null);
    const [sortMode, setSortMode] = React.useState("bb");
    const [displayedUserModal, setDisplayedUserModal] = React.useState(null);

    const fetchLeaderboard = async () => {
        let json;
        try {
            const res = await fetch(API_URL + "/api/get_leaderboard");
            if(!res.ok) throw new Error(`Error ${res.status}`);
            json = await res.json();
        } catch(e) {
            console.error("Could not fetch leaderboard:", e);
            return null;
        }
        
        setUsers(Object.values(json).map(i => ({
            ...i,
            totalProfit: i.stats.totalBuyOut - i.stats.totalBuyIn,
            bbProfit: i.stats.totalBuyOutBigBlinds - i.stats.totalBuyInBigBlinds,
        })));
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const sortedUsers = useMemo(
        () => users && [...users].sort(SORT_MODES[sortMode].compare),
        [users, sortMode]
    );

    const sortControl = (
        <div id={style.sort_control}>
            <label htmlFor={style.sort_select}>Sort by</label>
            <select
                id={style.sort_select}
                value={sortMode}
                onChange={e => setSortMode(e.target.value)}
            >
                {Object.entries(SORT_MODES).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                ))}
            </select>
        </div>
    );

    if(!users) {
        return (
            <div id={style.leaderboard_page}>
                <div id={style.sky} />
            </div>
        )
    }

    const seaCreatures = sortedUsers.map((user, i) => {
        const bottomXpercent = (i / sortedUsers.length) * 100;
        const yPos = (i / sortedUsers.length) * 95;
        const hueRotate = generateHash(user.email + "color") % 360;
        // Successive terms of the golden-ratio sequence are always far apart, so
        // neighbouring ranks never bunch up on the same side of the ocean.
        const xJitter = (Math.abs(generateHash(user.email + "xpos")) % 61 - 30) / 1000;
        const xFraction = (i * GOLDEN_RATIO_CONJUGATE + xJitter + 1) % 1;
        const bobPeriod = (Math.abs(generateHash(user.email + "bob") % 300) + 200) / 100;
        const bobDelay = (Math.abs(generateHash(user.email + "bob_delay") % 500) / 100);
        let image;
        let className;

        if(bottomXpercent < 10) {
            image = WhaleImage;
            className = style.whale;
        } else if(bottomXpercent < 80) {
            image = FishImage;
            className = style.fish;
        } else {
            image = SharkImage;
            className = style.shark;
        }

        const dailyProfit = user.totalProfit / Math.max(user.stats.daysPlayed, 1);
        const dailyProfitBB = user.bbProfit / Math.max(user.stats.daysPlayed, 1);

        return (
            <div className={`${style.sea_creature} ${className}`} key={user.email} style={{
                top: `${yPos}%`,
                filter: `hue-rotate(${hueRotate}deg)`,
                "--x-fraction": xFraction,
                "--bob-period": `${bobPeriod}s`,
                "--bob-delay": `${bobDelay}s`,
            }} onClick={() => {
                setDisplayedUserModal(user);
            }}>
                <img src={image} alt={`${user.firstName} ${user.lastName}`} />
                <div className={style.info_box}>
                    <h3>{user.firstName} "{user.nickname}" {user.lastName}</h3>
                    <p>
                        ${displayCents(user.totalProfit)} total earnings ({user.bbProfit.toFixed(2)} BB)
                    </p>
                    <p>
                        ${displayCents(dailyProfit)} per day ({dailyProfitBB.toFixed(2)} BB)
                    </p>
                </div>
            </div>
        )
    });

    const modal = displayedUserModal && (
        <div id={style.user_modal_shade} onClick={() => setDisplayedUserModal(null)}>
            <div id={style.user_modal} onClick={e => e.stopPropagation()}>
                <h1>{displayedUserModal.firstName} "{displayedUserModal.nickname}" {displayedUserModal.lastName}</h1>
                <WinLossGraph user={displayedUserModal} />
            </div>
        </div>
    );


    return (
        <div id={style.leaderboard_page}>
            {modal}
            <div id={style.sky}>
                <h1>YPC's Biggest Sharks</h1>
                {sortControl}
            </div>
            <div id={style.ocean} style={{
                height: `max(${OCEAN_BASE_HEIGHT}, ${sortedUsers.length * ROW_HEIGHT_PX}px)`,
            }}>
                {seaCreatures}
            </div>
        </div>
    )
}

export default LeaderboardPage;
