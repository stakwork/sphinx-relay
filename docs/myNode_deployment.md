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

**note:** Sphinx client uses HTTP to communicate with **sphinx-relay**. Since setting up SSL on a local network is problematic (you don't have any domain names to authenticate with certificates), you have to rely on your local network security. Below is an example of how Sphinx/sphinx-relay communications look like in **tcpdump**:

```
{"success":true,"response":{"seen":false,"id":393,"chat_id":1,"uuid":"iJ8xow2hhR4AvLj8SGg3Eu","type":0,"sender":1,"amount":0,"date":"2020-09-15T20:49:36.000Z","message_content":"edNsPx6GmrXlM2jPwphOMaGPblpRxvkrYJcvuK2TEZDCTdFp3dFqKeZaWZS64vd/AlQCK9NQ754PWqwQHON1Ox3MMIb8SiD87WRlYSIWqAKy3PsipGiq99qDr/U5Cky7T+VKbAQyjGl4KtFo0ZWNJmzSykkjeaqj1xtsipHCAlcDIzE5KV1bomUh6z9/P22nxRfxXALCKQ7TANU0yAVqnoocvVrXNaFC77Q7t9G/zxbnf+fGU8gBEt9R/3AncpTvY7xd/bCe0EjTASj13/P9ZzZBb60LM+MEp4vxMpEwLkLCwREVBUYbac+gtznNOCoYb8u15zz9DwP9qZ49/xZwCw==","remote_message_content":"{\"3\":\"EUlLtTGQToo5MsUxsbyLDnC7jzrDX3vZjLxH48r2Fnqnyi1XWZyf9+PA84934KzqOtUXvmqmV8E5QlNtTXh1pYpOWVuO1yX+0by03BQOuoJaoHRWrRTIHZP2xOff8VufcNmb57M4PgXQaH38V+iFWQkQaBaKmagh74jVfg7kH+ZsqdTBYw7CnFSUKXdc6E8JYeEwIRuCMOHdDB9STyUVdVTm8WtEa2pB6Yagkcx4rsWJY/vbEkjYhSRGb8dO2DESB3KtYtO+J7Xs/Z/Djolk3iFcMb59XVKoIqBbxg+KZPK7Vrv06TtSr4OFSgiSnkyxm+r6TDxiNxVaisAXFWB9cg==\"}","status":0,"created_at":"2020-09-15T20:49:36.000Z","updated_at":"2020-09-15T20:49:36.555Z","status_m
```
*Message payloads are encrypted with **sphinx cypher**, but all metadata is transmitted in cleartext.*


#### If you want to connect to your Sphinx-Relay from outside of your local network

**note:** it is recommended to use SSL encryption for any communications between **Sphinx** and **sphinx-relay** outside of a trusted network. [**Docker deployment guide**](docs/docker-deployment.md) sets up SSL encryption for you automatically, you only have to obtain your domain and certificates. If you still want to set up **sphinx-relay** manually, the instructions to set up the SSL are below.

```sh 
$ cd
$ cd sphinx-relay/config/
$ export NODE_IP=x.x.x.x:53001
```
where `x.x.x.x` is the permanent public IP address of your router.

Make sure that port 53001 forwarding is properly set up.

For extra security:
```sh
$ export USE_PASSWORD=true
```
As noted in the previous section, you might want to protect communications between your Sphinx client and **sphinx-relay** with SSL.

In order to do that, obtain a domain and an SSL certificate for your **sphinx-relay** server and set up a reverse proxy with NGINX (or a more lightweight alternative).

We recommend using Let's Encrypt service to obtain a free SSL certificate and [**acme.sh**](https://acme.sh) for setting it up and renewals.

To configure NGINX as an SSL reverse proxy:

```sh
$ sudo apt install nginx

sudo nano /etc/nginx/sites-available/YOUR-DOMAIN
```
Use the following NGINX config:
```
server {
  listen 53001 ssl;

  server_name YOUR-DOMAIN;                                               
  # Edit the above _YOUR-DOMAIN_ to your domain name
   
  ssl_certificate /etc/letsencrypt/live/YOUR-DOMAIN/fullchain.pem;       
  # If you use Lets Encrypt, you should just need to change the domain. 
  # Otherwise, change this to the path to full path to your domains public certificate file.
   
  ssl_certificate_key /etc/letsencrypt/live/YOUR-DOMAIN/privkey.pem;     
  # If you use Let's Encrypt, you should just need to change the domain.
  # Otherwise, change this to the direct path to your domains private key certificate file.
   
  ssl_session_cache builtin:1000 shared:SSL:10m;                        
  # Defining option to share SSL Connection with Passed Proxy
   
  ssl_protocols TLSv1 TLSv1.1 TLSv1.2;                                  
  # Defining used protocol versions. 
   
  ssl_ciphers HIGH:!aNULL:!eNULL:!EXPORT:!CAMELLIA:!DES:!MD5:!PSK:!RC4; 
  # Defining ciphers to use. 
   
  ssl_prefer_server_ciphers on;                                         
  # Enabling ciphers
   
  access_log /var/log/nginx/access.log;                                 
  # Log Location. the Nginx User must have R/W permissions. Usually by ownership.

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://localhost:53001;
    proxy_read_timeout 90;
  }

} # Don't leave this out! It "closes" the server block we started this file with.
```
Save and exit:
`Ctrl + X`

`Y`

`Enter`

To test your NGINX configuration:
```sh
$ nginx -t
```

To start your new NGINX SSL proxy:

```sh
$ sudo systemctl restart nginx
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
