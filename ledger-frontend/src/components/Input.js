import React, { forwardRef } from "react";
import style from "./stylesheets/Input.module.scss";

const Input = forwardRef(({ type, placeholder, value, onChange, label, largeInput }, ref) => {
    return (
        <div className={style.input_container}>
        <p className={style.label}>{label}</p>
        <input
            className={`${style.input} ${largeInput ? style.large : ""} ${type === "file" ? style.file : ""}`}
            type={type || "text"}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            ref={ref}
        />
        </div>
    )
});

export default Input;
