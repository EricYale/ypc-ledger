I just implemented a "leaderboard" feature for my poker ledger app. However, I need your help importing historical data from previous games into this format.

First, read my backend code relating to the leaderboard feature. Pay special attention to the comment defining the data schema for a user in localStorage.js. Also look at updateLeaderboard.js and user-helper.js, which work together to update leaderboard from in-memory tables.

Then, write a one-off NodeJS script to update user files based on historical CSVs.

On startup, the backend should list all .csv files from data/historical. Then, it needs to make inference on some attributes of the table.
- Infer the date. The day the ledger was reconciled is in the filename in the format "YPC historical records - YYYY-MM-DD-a". So, extract this date, but the date of the table should be the most recent friday that occurred before this date.
- Infer the blinds from the most popular buy-in amount. Find the amount that the most players bought in for, then round down to the nearest $5 increment. For example, if most players bought in for $20.17, round down to $20. The blinds are 1/100th of the buy-in, so here the blind would be set to 20 (always given in cents).

Finally, replicate the behavior of addTableToUserHistory, but for these CSVs. You should use the createUser I already wrote in localStorage.js. You should add each user that appears in any of the CSVs. (If the Yalies API call fails just skip them)

Quarantine your code to historicalDataImport.js, do NOT modify any other files. If you need to duplicate code by bringing it into the file that is better than modifying my other code.

You can look at one of the CSV files in data/historical for reference of what the data looks like.
