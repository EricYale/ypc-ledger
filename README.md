# ypc-ledger
Yale Poker Club ledger app

## How to run
1. Copy `ledger-backend/.env.template` to `ledger-backend/.env` and fill in the required environment variables
2. `cd ledger-frontend`, `npm install`, `npm start`
3. `cd ledger-backend`, `npm install`, `npm run dev`

## Deployment instructions
- To successfully run on port 80, you'll have to follow [these instructions](https://stackoverflow.com/questions/60372618/nodejs-listen-eacces-permission-denied-0-0-0-080)
- Use [pm2](https://pm2.keymetrics.io/) to keep your server alive
- To make it so your backend serves your compiled React app, run `npm run build` in `ledger-frontend`
