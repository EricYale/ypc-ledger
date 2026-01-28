import React from "react";
import style from "./stylesheets/LeaderboardPage.module.scss";
import { API_URL, displayCents, generateHash } from "../helpers/consts";
import { useEffect } from "react";
import SharkImage from "../resources/shark.png";
import FishImage from "../resources/fish.png";
import WhaleImage from "../resources/whale.png";
import WinLossGraph from "./WinLossGraph";

const LeaderboardPage = () => {
    const [users, setUsers] = React.useState(null);
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
        
        const sortedUsers = Object.values(json)
            .map(i => ({
                ...i,
                totalProfit: i.stats.totalBuyOut - i.stats.totalBuyIn
            }))
            .sort((a, b) => a.totalProfit - b.totalProfit);
        setUsers(sortedUsers);
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    if(!users) {
        return (
            <div id={style.leaderboard_page}>
                <div id={style.sky} />
            </div>
        )
    }

    const seaCreatures = users.map((user, i) => {
        const bottomXpercent = (i / users.length) * 100;
        const yPos = (i / users.length) * 95;
        const hueRotate = generateHash(user.email + "color") % 360;
        const xPos = Math.abs(generateHash(user.email + "xpos") % 80) + 5;
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

        const bbProfit = user.stats.totalBuyOutBigBlinds - user.stats.totalBuyInBigBlinds;
        const dailyProfit = user.totalProfit / Math.max(user.stats.daysPlayed, 1);
        const dailyProfitBB = bbProfit / Math.max(user.stats.daysPlayed, 1);

        return (
            <div className={`${style.sea_creature} ${className}`} key={i} style={{
                top: `${yPos}%`,
                left: `${xPos}%`,
                filter: `hue-rotate(${hueRotate}deg)`,
                "--bob-period": `${bobPeriod}s`,
                "--bob-delay": `${bobDelay}s`,
            }} onClick={() => {
                setDisplayedUserModal(user);
            }}>
                <img src={image} alt={`${user.firstName} ${user.lastName}`} />
                <div className={style.info_box}>
                    <h3>{user.firstName} "{user.nickname}" {user.lastName}</h3>
                    <p>
                        ${displayCents(user.totalProfit)} total earnings ({bbProfit.toFixed(2)} BB)
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
            </div>
            <div id={style.ocean}>
                {seaCreatures}
            </div>
        </div>
    )
}

export default LeaderboardPage;
