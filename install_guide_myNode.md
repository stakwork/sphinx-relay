# Guide: install Sphinx-relay on myNode.

This guide is focused on installing Sphinx-relay on top of myNode. Information about myNode can be found at: https://mynodebtc.com/.

### Preparations

* Be able to connect with your node through SSH.
* Make sure you are running LND version `0.9.0` or higher. This can be seen at http://mynode.local/lnd at the right top. Or by inserting the following console command:

```sh
$ lncli getinfo
> "version": "0.9.0-beta commit=v0.9.0-beta"
```
* Open port `3001/TCP` on your router. How to do this is not included in this guide. https://www.yougetsignal.com/tools/open-ports/ is one of the many websites that can be used to check if a port is opened on your network.
---
## Let's Start

### Open port 3001 on myNode

Open up a console window with SSH. And log in as root
```sh
$ sudo su
```
Open up port 3001 on your machine and make sure it has been added to the list.
```sh 
$ ufw allow 3001 comment 'allow Sphinx-Chat'
$ ufw status

> Status: active
>
> To                         Action      From
> --                         ------      ----
> 3001 (v6)                  ALLOW       Anywhere (v6)              # Sphinx-Chat
```

### Download

login as user bitcoin.
```sh
$ sudo su bitcoin
$ cd
```
Clone the repository from Github and install the package.
```sh 
$ git clone https://github.com/stakwork/sphinx-relay
$ cd sphinx-relay
$ npm install
```
### Dependencies
sqlite3: `$ apt-get install sqlite3`

### Configure
Edit the "production" section of config/app.json.
```sh 
$ cd
$ cd sphinx-relay/config/
$ nano app.json
```
Change the following 4 lines to:
``` 
"macaroon_location": "/home/bitcoin/.lnd/data/chain/bitcoin/mainnet/admin.macaroon",
"tls_location": "/mnt/hdd/mynode/lnd/tls.cert",
"lnd_log_location": "/home/bitcoin/.lnd/logs/bitcoin/mainnet/lnd.log",
"lncli_location": "/home/bitcoin/go/bin",
```
Save and exit:
`Ctrl + X`

`Y`

`Enter`

Edit the "production" section of config/config.json
```sh 
$ nano config.json
```
Change to following line to:
``` 
"storage": "/home/bitcoin/sphinx.db"
```
Save and exit:
`Ctrl + X`

`Y`

`Enter`

To connect to your app:
(replace x.x.x.x with your IP - NOTE: This is your external IP)
```sh 
$ cd
$ cd sphinx-relay/config/
$ export NODE_IP=x.x.x.x:3001
```
For extra security:
```sh
$ export USE_PASSWORD=true
```
### Activate keysend
We need LND to run with keysend activated. First we check if it is already activated on your node. To do that. Go to http://mynode.local/lnd/config and check if the line `accept-keysend=1` is included somewhere in the text.

If `accept-keysend=1` is already included you can continue without changing anything. If `accept-keysend=1` is not included, add it to a new line and click the `Save` button. This will restart your device. (Restarting could take up to several minutes but also hours, so be patient.)

### Run
Now it's time to run the software.

```sh 
$ cd
$ cd sphinx-relay/config/
$ npm run prod
```
When Relay starts up, it will print a QR in the terminal. You can scan this in your app (Android or iOS) to connect!
