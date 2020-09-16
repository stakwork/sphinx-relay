# Deployment to myNode

This guide is focused on installing Sphinx-relay on top of myNode. Information about myNode can be found at: https://mynodebtc.com/.

### Preparations

* Be able to connect with your node through SSH.
* Connect to myNode as `admin`:
```sh
$ ssh admin@mynode.local
```
Use password `bolt` unless you have already changed it.

### Install dependencies

sqlite3: `$ sudo apt install sqlite3`

python2 (if not present): `$ sudo apt install python2`

### Open port 53001 on myNode

**note**: Port 3001 is now taken by one of myNode apps. In this document we use port 53001, but this port can be whatever number you want. Just add PORT to your environment like `export PORT=55005`.

Open up a console window with SSH. And login as root
```sh
$ sudo su
```
Open up port 53001 on your machine and make sure it has been added to the list.
```sh 
# ufw allow 53001 comment 'allow Sphinx-Chat'
# ufw status

> Status: active
>
> To                         Action      From
> --                         ------      ----
> 53001 (v6)                  ALLOW       Anywhere (v6)              # Sphinx-Chat
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

### Configure

Edit the "production" section of config/app.json.
```sh 
$ cd
$ cd sphinx-relay/config/
$ nano app.json
```
Change the following 4 lines:

``` 
"macaroon_location": "/home/bitcoin/.lnd/data/chain/bitcoin/mainnet/admin.macaroon",
"tls_location": "/mnt/hdd/mynode/lnd/tls.cert",
"lnd_log_location": "/home/bitcoin/.lnd/logs/bitcoin/mainnet/lnd.log",
```

Save and exit:
`Ctrl + X`

`Y`

`Enter`

Edit the "production" section of config/config.json
```sh 
$ nano config.json
```
Change the following line to:
``` 
"storage": "/home/bitcoin/sphinx.db"
```
Save and exit:
`Ctrl + X`

`Y`

`Enter`

#### If you want to use your Sphinx client within the same local network

```sh 
$ cd
$ cd sphinx-relay/config/
$ export NODE_IP=x.x.x.x:3001
```
where `x.x.x.x` is the local IP address of the machine running your Sphinx-Relay on your local network.

#### If you want to connect to your Sphinx-Relay from outside of your local network

```sh 
$ cd
$ cd sphinx-relay/config/
$ export NODE_IP=x.x.x.x:3001
```
where `x.x.x.x` is the permanent public IP address of your router.

Make sure that port 3001 forwarding is properly set up.

For extra security:
```sh
$ export USE_PASSWORD=true
```

### Activate keysend

We need LND to run with keysend activated. First, we check if it is already enabled on your node. 

Go to http://mynode.local/lnd/config and check if the line `accept-keysend=True` (or `accept-keysend=1`) is included somewhere in the text.

If `accept-keysend=True` is already included you can continue without changing anything. If `accept-keysend=True` is not included, add it to a new line and click the `Save` button. This will restart your device. (Restarting could take up to several minutes but also hours, so be patient.)

### Run

Now it's time to run the software.

```sh 
$ cd
$ cd sphinx-relay/config/
$ npm run prod
```
When Relay starts up, it will print a QR in the terminal. You can scan this in your app (Android or iOS) to connect!

### To make Relay run continuously (also after a restart).

Before you start this part, make sure your app is connected and that you are able to send & receive messages.

Login as admin.
```sh 
$ sudo su admin
```
Create a file named sphinx-relay.service
```sh 
$ sudo nano /etc/systemd/system/sphinx-relay.service
```
Copy and paste the following text to add it to the file:
```sh 
[Unit]
Description=Sphinx Relay Service
After=network.target

[Service]
Type=simple
User=bitcoin
WorkingDirectory=/home/bitcoin/sphinx-relay/config/
ExecStart=npm run prod
Restart=always
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=sphinx-relay

[Install]
WantedBy=multi-user.target
```
Save and exit:
`Ctrl + X`

`Y`

`Enter`

Now we have to set the environment variables `PORT` and `NODE_IP` for the new `sphinx-relay.service`:

`sudo systemctl edit sphinx-relay`

This opens `nano` editor with an empty configuration file that you should type the following text into:

```
[Service]
Environment="PORT=53001"
Environment="NODE_IP=x.x.x.x:53001"
```
Save and exit:
`Ctrl + X`

`Y`

`Enter`

Let's run!
```sh 
$ sudo systemctl enable sphinx-relay
$ sudo systemctl start sphinx-relay
```
Check if Relay successfully started.
```sh 
$ sudo systemctl status sphinx-relay
```
### To stop the program

```sh 
$ sudo systemctl stop sphinx-relay
```

# To update Sphinx-Relay

### fast method:
You can pull directly from git to update your relay. If you have only changed your config files, the following should work:
- `systemctl stop sphinx-relay`
- cd into your sphinx-relay directory (`cd sphinx-relay`)
- `git stash && git checkout master && git pull && git stash pop`
- [OPTIONAL, ONLY IF A NEW NPM DEPENDENCY HAS BEEN ADDED]: `npm i`
- `systemctl start sphinx-relay`

### full reset method:

> This probably is not the most efficient way to update. But it works, so we got that going, which is nice. Feel free to optimize the process and contribute. :) 

Login as `admin` and stop the program.
```sh 
$ sudo systemctl stop sphinx-relay
```
login as user `bitcoin`.

```sh
$ sudo su bitcoin
$ cd
```
## Remove the old version

```sh
$ rm -rf sphinx-relay
```
## Download the new version

Clone the repository from Github and install the package.
```sh 
$ git clone https://github.com/stakwork/sphinx-relay
$ cd sphinx-relay
$ npm install
```
### Configure

Edit the "production" section of config/app.json.
```sh 
$ cd
$ cd sphinx-relay/config/
$ nano app.json
```
Change the following 4 lines:

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
Change the following line to:
``` 
"storage": "/home/bitcoin/sphinx.db"
```
Save and exit:
`Ctrl + X`

`Y`

`Enter`

#### If you want to use your Sphinx client within the same local network

```sh 
$ cd
$ cd sphinx-relay/config/
$ export NODE_IP=x.x.x.x:53001
```
where `x.x.x.x` is the local IP address of the machine running your Sphinx-Relay on your local network.

#### If you want to connect to your Sphinx-Relay from outside of your local network

```sh 
$ cd
$ cd sphinx-relay/config/
$ export NODE_IP=x.x.x.x:53001
```
where `x.x.x.x` is the permanent public IP address of your router.

> Make sure that port 53001 forwarding is properly set up.

For extra security:
```sh
$ export USE_PASSWORD=true
```
### Turn on the service.
Login as admin.
```sh 
$ su admin
```
Or
```sh 
$ exit
```
Turn the service on and check the status.
```sh 
$ sudo systemctl enable sphinx-relay
$ sudo systemctl start sphinx-relay
```

### tail logs 

`journalctl -u sphinx-relay -f`


[Back to README](https://github.com/dimaatmelodromru/sphinx-relay/tree/docs-edit#connecting-a-mobile-client)
