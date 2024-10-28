import React from "react";
import style from "./stylesheets/Input.module.scss";

const Input = ({ type, placeholder, value, onChange, label }) => {
    return (
        <div className={style.input_container}>
        <p className={style.label}>{label}</p>
        <input
            className={style.input}
            type={type || "text"}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
        />
        </div>
    )
};

export default Input;
