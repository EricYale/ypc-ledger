import React from "react";
import style from "./stylesheets/ChipDenoms.module.scss";
import ChipImg from "../resources/redchip.png";
import { CHIP_COLOR_FILTERS, displayCents } from "../helpers/consts";

const ChipDenoms = ({ denoms, startingStack }) => {

    if(!denoms || !startingStack) return null;

    const chips = Object.keys(denoms).map(color => {
        const denom = denoms[color];
        const denomDisplay = denom < 100 ? `${denom}¢` : `$${displayCents(denom)}`;
        const stack = startingStack[color];
        const filterStyle = { filter: CHIP_COLOR_FILTERS[color] || "opacity(0%)" };
        return (
            <div key={color} className={style.chip}>
                <img src={ChipImg} alt={color + " chip"} className={style.chip_image} style={filterStyle} />
                <p className={style.denom}>{denomDisplay}</p>
                <p className={style.stack}>x{stack}</p>
            </div>
        );
    });
    
    return (
        <div className={style.chip_denoms}>
            {chips}
        </div>
    );
}

export default ChipDenoms;
