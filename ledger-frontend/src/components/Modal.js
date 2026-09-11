import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import style from "./stylesheets/Modal.module.scss";

const Modal = ({ title, onClose, children }) => {
    useEffect(() => {
        const onKeyDown = (e) => {
            if(e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    return (
        <div className={style.backdrop} onClick={onClose}>
            <div className={style.modal} onClick={e => e.stopPropagation()}>
                <div className={style.header}>
                    <h2 className={style.title}>{title}</h2>
                    <button className={style.close} onClick={onClose} aria-label="Close">
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
                <div className={style.body}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
