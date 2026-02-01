#!/bin/bash
pm2 stop ypc
sudo certbot renew
rm -f ledger-backend/*.pem
sudo cp /etc/letsencrypt/live/play.yalepokerclub.com/fullchain.pem ledger-backend
sudo cp /etc/letsencrypt/live/play.yalepokerclub.com/privkey.pem ledger-backend
pm2 start ypc

