import React, { useEffect } from "react";
import style from "./stylesheets/AdminPage.module.scss";
import { API_URL } from "../helpers/consts";
import { getSavedAdminPassword } from "../helpers/localStorage";

const EmailsPage = () => {
    const [emails, setEmails] = React.useState(null);
    const [error, setError] = React.useState("");
    const password = getSavedAdminPassword();

    const fetchEmails = async () => {
        let json;
        try {
            const res = await fetch(API_URL + "/api/get_player_emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    adminPassword: password,
                }),
            });
            if(!res.ok) throw new Error(`Error ${res.status}`);
            json = await res.json();
        } catch(e) {
            console.error("Could not fetch emails:", e);
            setError(`Could not fetch emails: ${e.message}`);
            return;
        }
        setEmails(json);
    };

    useEffect(() => {
        if(password) {
            fetchEmails();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [password]);

    if(!password) {
        window.location.href = "/pw?dest=" + encodeURIComponent(window.location.pathname);
        return null;
    }

    if(!emails) {
        return (
            <div id={style.admin_page}>
                Loading...
                {
                    error && <p className={style.error}>{error}</p>
                }
            </div>
        )
    }

    return (
        <div id={style.admin_page}>
            <h1>Player Emails</h1>
            <p>Displaying {emails.length} emails of players who have joined any ledger table that was posted to the leaderboard.</p>
            {
                error && <p className={style.error}>{error}</p>
            }
            <textarea 
                disabled 
                value={emails.join("\n")} 
                style={{ width: "100%", height: "500px", padding: "10px", marginTop: "20px", fontSize: "16px", resize: "vertical" }}
            />
        </div>
    );
};

export default EmailsPage;
