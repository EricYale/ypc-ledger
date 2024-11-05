import React from "react";
import style from "./stylesheets/AdminPasswordEntryPage.module.scss";
import { useSearchParams } from "react-router-dom";
import Input from "./Input";
import Button from "./Button";
import { saveAdminPassword } from "../helpers/localStorage";

const AdminPasswordEntryPage = () => {
    const [searchParams] = useSearchParams();
    const destParam = searchParams.get("dest");
    const destURL = destParam ? decodeURIComponent(destParam) : "/";
    const [password, setPassword ] = React.useState("");
    
    const passwordEntered = () => {
        if(!password) return;
        saveAdminPassword(password);
        window.location.href = destURL;
    }

    return (
        <div id={style.admin_pw_page}>
            <h1>Enter admin password</h1>
            <Input
                label="Password"
                type="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="foobar"
            />
            <Button onClick={passwordEntered}>
                Enter
            </Button>
        </div>
    )
};

export default AdminPasswordEntryPage;
