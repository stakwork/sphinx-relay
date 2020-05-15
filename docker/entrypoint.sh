#!/bin/bash

# turn on bash's job control
set -m

echo "Setting ENV vars..."
export NODE_DOMAIN=$(curl $ECS_CONTAINER_METADATA_URI | echo $(jq -r .DockerName).$NODE_DOMAIN)
# export NODE_DOMAIN=lvh.me
export NODE_ALIAS=$HOSTNAME
export NODE_IP=$NODE_SCHEME://$NODE_DOMAIN

echo "Starting supervisor..."
# Start the primary process and put it in the background
/usr/bin/supervisord &

sleep 5

echo "Creating wallet..."
WALLET_PASSWORD=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c20)
WALLET_PASSPHRASE=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c20)

echo $WALLET_PASSWORD >> /relay/.lnd/.lndpwd
echo $WALLET_PASSPHRASE >> /relay/.lnd/.lndpwd

expect /relay/docker/create_wallet.sh $WALLET_PASSWORD $WALLET_PASSPHRASE >> /relay/.lnd/.tempseed

sed -e '2,14d' < /relay/.lnd/.tempseed >> /relay/.lnd/.lndseed

rm /relay/.lnd/.tempseed

sleep 5

echo "Starting relay..."
supervisorctl start relay

# now we bring the primary process back into the foreground
# and leave it there
fg %1
