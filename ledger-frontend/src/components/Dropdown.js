import React from "react";
import style from "./stylesheets/Dropdown.module.scss";

const Dropdown = ({ options, selected, onSelectedChange, label }) => {
    const optionsElems = options.map((option) => (
        <option key={option.value} value={option.value}>
            {option.label}
        </option>
    ));
    return (
        <div className={style.dropdown_container}>
            <p className={style.label}>{label}</p>
            <select
                value={selected}
                onChange={(e) => onSelectedChange(e.target.value)}
                className={style.dropdown}
            >{optionsElems}</select>
        </div>
    )
};

export default Dropdown;
