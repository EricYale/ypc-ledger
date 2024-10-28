import React from "react";
import style from "./stylesheets/Button.module.scss";

const Button = ({ onClick, children }) => {
    return (
        <button className={style.button} onClick={onClick}>
            {children}
        </button>
    );
}

export default Button;
