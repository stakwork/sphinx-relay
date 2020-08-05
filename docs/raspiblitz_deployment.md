# Deployment to Raspiblitz

This guide is focused on installing Sphinx-relay on top of ***raspiblitz***. Information about myNode can be found at: https://raspiblitz.com/.

### Preparations

* Be able to connect with your node through SSH.
* Connect to **raspiblitz** as `admin`:
```sh
$ ssh admin@mynode.local
```
Use password `raspiblitz` unless you have already changed it.

### Install dependencies

sqlite3: `$ sudo apt install sqlite3`

python2 (if not present): `$ sudo apt install python2`

### Open port 3001 on Raspiblitz

Open up a console window with SSH. And log in as root
```sh
$ sudo su
```
Open up port 3001 on your machine and make sure it has been added to the list.
```sh 
# ufw allow 3001 comment 'allow Sphinx-Chat'
# ufw status

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
"tls_location": "/mnt/hdd/lnd/tls.cert",
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

> Make sure that port 3001 forwarding is properly set up.

For extra security:
```sh
$ export USE_PASSWORD=true
```

### Activate keysend

We need LND to run with keysend activated. First, we check if it is already enabled on your node. 

Go to raspiblitz menu, or:

```sh
$ raspiblitz
```

Find menu "Services" item and activate Keysend.

### Run

Now it's time to run the software.

```sh 
$ cd
$ cd sphinx-relay/config/
$ npm run prod
```
When Relay starts up, it will print a QR in the terminal. You can scan this in your app (Android or iOS) to connect!

### To make relay run continuously (also after a restart).
Before you start this part, make sure your app is connected and that you are able to send & receive messages.

Login as admin.
```sh 
$ sudo su admin
```
Create a file named sphinx-relay.service
```sh 
$ sudo nano /etc/systemd/system/sphinx/sphinx-relay.service
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

Let's run!
```sh 
$ sudo systemctl enable sphinx-relay.service
$ sudo systemctl start sphinx-relay.service
```
Check if Relay successfully started.
```sh 
$ sudo systemctl status sphinx-relay.service
```
### To stop the program
```sh 
$ sudo systemctl stop sphinx-relay.service
```

# To update Sphinx-Relay

> This probably is not the most efficient way to update. But it works, so we got that going, which is nice. Feel free to optimize the process and contribute. :) 

Login as `admin` and stop the program.
```sh 
$ sudo systemctl stop sphinx-relay.service
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
"tls_location": "/mnt/hdd/lnd/tls.cert",
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
$ sudo systemctl enable sphinx-relay.service
$ sudo systemctl start sphinx-relay.service
```

### tail logs 

`journalctl -u sphinx-relay -f`


[Back to README](https://github.com/dimaatmelodromru/sphinx-relay/tree/docs-edit#connecting-a-mobile-client)