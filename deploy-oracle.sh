#!/bin/bash

ssh -t ubuntu@193.122.147.106 << HERE
    cd ypc
    git pull
    rm -rf ledger-backend/public
HERE

scp -r public ubuntu@193.122.147.106:~/ypc/ledger-backend/public

ssh -t ubuntu@193.122.147.106 << HERE
    pm2 restart ypc
HERE