# Yale Poker Club Ledger App

Node Express backend in `ledger-backend`, React frontend in `ledger-frontend`.

Data lives in `.json` files in `ledger-backend/data`. This is a small-scale project for a small college club, so we aren't using a full-on SQL database; we don't need to consider scalability, reliability, etc.

Server is deployed to a small Linux Cloud VM (see `deploy-oracle.sh`). NEVER DEPLOY WITHOUT USER'S PERMISSION.


Users can "buy in" to poker ledgers ("Table A", "Table B", etc). They can also "buy out" by submitting a photo of their chips. No user accounts or email auth—the poker club is an honor system anyways. Session data stays in browser cookies.

An admin page allows club officers to manage tables, send emails, and modify the leaderboard.
Admin authentication is a simple password scheme; no user tokens, nothing fancy. Simple by design.

Ledger emails are sent after a table is closed and chip photos are reviewed by a human. (See `ledger-backend/helpers/emails.js`).
Key feature: to avoid Venmo shadowbans, admin can set a table mode to "direct transfers" which uses an algorithm to have players transfer money to each other depending on net gains/losses, rather than pooling money in a central "banker" account.

Running the app: in `ledger-backend`, run `npm dev`. At the same time, in another terminal, in `ledger-frontend`, run `npm start`.
