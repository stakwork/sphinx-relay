# Relay

**Relay** is a Node.js wrapper around [LND](https://github.com/lightningnetwork/lnd), handling connectivity and storage for [**Sphinx**](https://sphinx.chat). Communication between Relay nodes takes place entirely on the Lightning Network, so it is decentralized, untraceable, and encrypted. Message content is also end-to-end encrypted using client public keys, on the **Sphinx** app itself.

![Relay](https://github.com/stakwork/sphinx-relay/raw/master/public/relay.jpg)

Relay stores:

- Aliases
- Messages
- Recurring payment configurations
- Invites (so you can add your friends)
- Media Keys: keys for decrypting media files, asymmetrically encrypted for each contact in a chat

# Run your own Sphinx node

## Preparations

- Be able to connect with your node through SSH.
- Make sure you are running LND version `0.10.0` or higher. This can be seen at http://mynode.local/lnd at the right top. Or by inserting the following console command:

```sh
$ lncli getinfo
> "version": "0.10.0-beta commit=v0.10.0-beta"
```

### If you are already operating your LND

If you have some open/funded channels of 100 000 sat+ capacity, you don't need to do anything else regarding Sphinx-Relay operation; if you don't have enough capacity in your channel(s) - add funds or rebalance your channel(s).

### If you just installed your LND

If you do not have any open/funded channels, you might want to open a channel to the Sphinx.chat LND. With a direct channel set up to sphinx.chat, sending messages to sphinx.chat-hosted recipients is slightly cheaper. Please, make your own judgment regarding your privacy/cost efficiency balance.

- Fund your LND wallet

```bash
$ lncli newaddress p2wkh
{
    "address": "<bech32 bitcoin address>"
}
```

Send 100000 sats to the provided bitcoin address.

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

You can monitor the progress of the channel creation operation with `lncli pendingchannels`/`lncli listchannels` commands; the former will show your channel while the operation is still in progress, the latter will show your channel once it's successfully completed.

Check the payment delivery by making a small payment to the Sphinx.chat LND:

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

If you are using the Docker file, the port is `3300` ([1](https://github.com/stakwork/sphinx-relay/blob/master/Dockerfile#L31), [2](https://github.com/stakwork/sphinx-relay/blob/master/Dockerfile#L35))

## Deployment

- [Docker deployment](docs/docker_deployment.md)
- [Raspberry Pi/myNode deployment](docs/myNode_deployment.md)
- [Raspberry Pi/Raspiblitz deployment](docs/raspiblitz_deployment.md)

## Connecting a mobile client

Scan the generated QR code with your iOS or Android Sphinx client.

> You should see `[socket.io] connected!` in your Relay console output.

Add some friends' addresses and start chatting!

## Connecting a Desktop client

As of this writing, neither of the Desktop Sphinx clients can scan Relay QR codes, nor directly import the connection string (printed by Relay just above the QR code).

To connect your Desktop Sphinx to your Relay:

- connect a mobile Sphinx client;
- open Profile in your mobile client;
- Export Private Key (key is stored in your device clipboard);
- send the private key to your Desktop and paste it to the connection input field.

> You should see `[socket.io] connected!` in your Relay console output.

## Troubleshooting

### Mobile Sphinx does not scan the generated QR code

- restart the Relay machine;
- connect as `admin`;
- switch to user `bitcoin` with `sudo su bitcoin`;
- `cd ~/sphinx-relay; npm run prod`

Then try again.

### Messages sent with your Relay are delivered empty or not delivered at all

Make small manual lightning payments to the Sphinx.chat LND (or the node you are connected to)

```bash
$ lncli sendpayment --dest=023d70f2f76d283c6c4e58109ee3a2816eb9d8feb40b23d62469060a2b2867b77f --final_cltv_delta=10 --amt=5 --keysend
```

Then make manual payments to your destination address.

Make sure all payments complete successfully.

Try messaging again in both directions. Usually, as the first messages is successfully delivered, there are no futher issues.

## Known issues

There are several known issues at the time of the writing of this document.
You can [check their actual status on GitHub](https://github.com/stakwork/sphinx-relay/issues)

# Roadmap

- linking recurring payments to files, to enable use cases such as subscribing to podcasts with BTC!
