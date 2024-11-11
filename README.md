# ypc-ledger
Yale Poker Club ledger app

## How to run
1. Copy `ledger-backend/.env.template` to `ledger-backend/.env` and fill in the required environment variables
2. Download your AWS config file into `ledger-backend/aws-config.json`
3. `cd ledger-frontend`, `npm install`, `npm start`
4. `cd ledger-backend`, `npm install`, `npm run dev`

## Deployment instructions
- To successfully run on port 80, you'll have to follow [these instructions](https://stackoverflow.com/questions/60372618/nodejs-listen-eacces-permission-denied-0-0-0-080)
- Use [pm2](https://pm2.keymetrics.io/) to keep your server alive
- To make it so your backend serves your compiled React app, run `npm run build` in `ledger-frontend`


# Banking Algorithm Details:

1. **Group players by payment method**
  - Separate players who only use Venmo
  - Separate players who only use Zelle
  - Identify those who have both (middlemen)

2. **Sort players by balance within each payment method group**
  - Within each group, sort players with positive and negative balances

3. **Match players within the same payment method group first**
  - Attempt to settle transactions directly between players in the same group
  - Minimize the need for a middleman

4. **Use middlemen only when necessary**
  - If cross-platform transactions are required (e.g., Venmo to Zelle)
  - Use the middlemen to facilitate these

5. **Track the middleman's usage carefully**
  - If there are multiple middlemen, choose the one with the least "net balance change" after each transaction

This algorithm ensures that:
* Players settle transactions directly whenever possible
* Middlemen are only used for cross-platform transactions
* Middlemen are optimally chosen to minimize the total amount they handle