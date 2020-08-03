# Relay

**Relay** is a Node.js wrapper around [LND](https://github.com/lightningnetwork/lnd), handling connectivity and storage for [**Sphinx**](https://sphinx.chat). Communication between Relay nodes takes place entirely on the Lightning Network, so is decentralized, untraceable, and encrypted. Message content is also end-to-end encrypted using client public keys, on the **Sphinx** app itself.

![Relay](https://github.com/stakwork/sphinx-relay/raw/master/public/relay.jpg)

Relay stores:
- Aliases
- Messages
- Recurring payment configurations
- Invites (so you can add your friends)
- Media Keys: keys for decrypting media files, asymetrically encrypted for each contact in a chat

# Run your own sphinx node

## Preparations

* Be able to connect with your node through SSH.
* Make sure you are running LND version `0.10.0` or higher. This can be seen at http://mynode.local/lnd at the right top. Or by inserting the following console command:

```sh
$ lncli getinfo
> "version": "0.10.0-beta commit=v0.10.0-beta"
```

### If you are already operating your LND

If you have some open/funded channels of 100 000 sat+ capacity, you don't need to do anything else regarding Sphinx-Relay operation; if you don't have enough capacity in your channel(s) - add funds or rebalance your channels.

### If you just installed your LND

If you do not have any open/funded channels you might want to open a channel to the sphinx.chat LND. With a direct channel set up to sphinx.chat sending messages to sphinx.chat-hosted recepients is slightly cheaper. Please, make your own judgement regarding your privacy/cost efficiency balance.

- Fund your LND wallet

```bash
$ lncli newaddress p2wkh
{
    "address": "<bech32 bitcoin address>"
}
```

Send 100000 satoshi to the provided bitcoin address.

Check your LND wallet balance with
```bash
$ lncli walletbalance
{
    "total_balance": "100000",
    "confirmed_balance": "0",
    "unconfirmed_balance": "100000"
}
```
until it shows:
```bash
{
    "total_balance": "100000",
    "confirmed_balance": "100000",
    "unconfirmed_balance": "0"
}
```
- Open a channel to sphinx.chat:

```bash
$ lncli connect 023d70f2f76d283c6c4e58109ee3a2816eb9d8feb40b23d62469060a2b2867b77f@54.159.193.149:9735
{

}
$ lncli openchannel 023d70f2f76d283c6c4e58109ee3a2816eb9d8feb40b23d62469060a2b2867b77f --local_amt=90000 --push_amt=5000 --sat_per_byte=35
{
    "funding_txid": "76bc738472545c343ab4eecc733bd26f1493fb512d1921f3f7d863d0f0f0fbca"
}
```
> **_NB_** Set the right amount of bitcoin transaction fee in `sat_per_byte`
> We recommend using [mempool.space](https://mempool.space) to determine the necessary fee.

You can monitor the progress of the channel creation operation with `lncli pendingchannels`/`lncli listchannels` commands; the former whill show your channel while the operation is still in progress, the latter will show your channel once it's successfully completed.

Check the payment delivery by making a small payment to the sphinx.chat LND:

```bash
$ lncli sendpayment --dest=023d70f2f76d283c6c4e58109ee3a2816eb9d8feb40b23d62469060a2b2867b77f --final_cltv_delta=10 --amt=5 --keysend
+------------+--------------+--------------+--------------+-----+----------+----------+-------+
| HTLC_STATE | ATTEMPT_TIME | RESOLVE_TIME | RECEIVER_AMT | FEE | TIMELOCK | CHAN_OUT | ROUTE |
+------------+--------------+--------------+--------------+-----+----------+--------------------+---------+
| HTLC_STATE | ATTEMPT_TIME | RESOLVE_TIME | RECEIVER_AMT | FEE | TIMELOCK | CHAN_OUT           | ROUTE   |
+------------+--------------+--------------+--------------+-----+----------+----+------------+--------------+--------------+--------------+-----+----------+--------------------+---------+
| HTLC_STATE | ATTEMPT_TIME | RESOLVE_TIME | RECEIVER_AMT | FEE | TIMELOCK | CHAN_OUT           | ROUTE   |
+------------+--------------+--------------+--------------+-----+----------+--------------------+---------+
| SUCCEEDED  |        1.544 |        5.188 | 5            | 0   |   642053 | 705537919981322241 | gameb_1 |
+------------+--------------+--------------+--------------+-----+----------+--------------------+---------+
Amount + fee:   5 + 0 sat
Payment hash:   <......>
Payment status: SUCCEEDED, preimage: <.....>
```

## Network connectivity

If you have a permanent public IP on your internet connection and you want your mobile or desktop Sphinx client to connect to it over internet, open port `3001/TCP` on your router and create a port forwarding rule for TCP to port 3001 of your machine running Sphinx-Relay. How to do this is not included in this guide. https://www.yougetsignal.com/tools/open-ports/ is one of the many websites that can be used to check if a port is opened on your network.

If you plan to use your Sphinx clients within the local network, then you do not have to do anything special.

Since none of Sphinx clients support connecting to Sphinx-Relay over Tor as of this moment, you could set up a [Tor2IP tunnel](https://github.com/openoms/bitcoin-tutorials/blob/eaac48a5decb6aef8540de249816d255b310dc3a/tor2ip_tunnel.md) as well (for axtra privacy/security or because of unavailability of a permanent public IP address on your local internet connection).

## Deployment

[Docker deployment](docs/docker_deployment.md)
[Raspberry Pi/myNode deployment](docs/mynode_deployment.md)
[Raspberry Pi/Raspiblitz deployment](docs/raspiblitz_deployment.md)

## Connecting a mobile client

## Connecting a Desktop client

## Troubleshooting

## Known issues

There are several known issues at the time of writing of this document:


you can check their actual status on GitHub


## Using Docker on Raspberry Pi

Install docker-compose: https://medium.com/@techiebouncer/install-docker-and-docker-compose-on-raspberry-pi-4-raspbian-buster-c5b78b9a0d08

Clone this repo.
```
git clone https://github.com/stakwork/sphinx-relay.git
```

Copy your id_rsa to clone the private lnd-lean repo.

```
cp ~/.ssh/id_rsa .
```

Build it.

```
docker-compose build
```

Edit your docker-compose.yml file replacing NODE_IP and NODE_ALIAS.

Relay will run on port 3000 local. You would need to point your router's port forwarding from 80 to 3000 to your docker machine.

Start up LND separately first.

```
docker-compose up lnd
```

- In another terminal, go to the project folder and run.

```
docker-compose exec lnd bash
```

Once you're given a bash, run `ping lnd` and take note of the IP, this is because we need to tell Relay where lnd is via the IP, this is a temporary measure due to the limitation of the grpc connection can only be done via IP and not domain name.

Edit your app.json file inside config and on the `production` key replace `node_ip` with the one from the ping.

Run Relay.

```
docker-compose up node_server
```

Create / Unlock your wallet

```
docker-compose exec lnd lncli create

docker-compose exec lnd lncli unlock
```

NOTE: All lncli commands need to be prepended with `docker-compose exec lnd`, this tells docker to execute **something** on the lnd container.

## Without Docker

You can run your own Sphinx node in order to have full ownership over your communication!

### guide

mynode users: here is a complete guide provided by someone who is running Relay at home: [MyNode Guide](https://github.com/stakwork/sphinx-relay/blob/master/install_guide_myNode_and_Raspiblitz.md)

### download

`git clone https://github.com/stakwork/sphinx-relay`

`cd sphinx-relay`

`npm install`

### dependencies

sqlite3: `apt-get install sqlite3`

### configure

Make sure your LND is running with the `--accept-keysend` flag! If you are using lnd.conf file, add `accept-keysend=1`

Edit the "production" section of config/app.json:
 - Change `macaroon_location` to the location of your LND admin macaroon
 - Change `tls_location` to the location of your LND cert

Edit the "production" section of config/config.json
 - Update "storage" to point to where you want your DB file to live

To connect to your app
 - `export NODE_IP=x.x.x.x` (you can use a domain name instead if you have that set up)
 - For extra security, `export USE_PASSWORD=true`

### run

`npm run prod`

When Relay starts up, it will print a QR in the terminal. You can scan this in your app (Android & iOS) to connect!

# Roadmap

- linking recurring payments to files, to enable use cases such as subscribing to podcasts with BTC!
