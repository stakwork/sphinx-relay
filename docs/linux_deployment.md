# Deployment on Linux

This guide is focused on installing Sphinx-relay on top of LND on Linux.
This guide assumes that you have LND up and running.
If that's not the case, do it first.

[LND install docs](https://github.com/lightningnetwork/lnd/blob/master/docs/INSTALL.md)

### Preparations

- Connect to your node via SSH to the user account where your LND runs (most people use `bitcoin`).
- Substitute `ip` with the ip address of your node on your local network.

```sh
$ ssh bitcoin@ip
```

### Install dependencies

Install sqlite3 and python2 with your distro's package manager.

For example:
Arch based distros:
```sh
sudo pacman -S sqlite python2
```

Ubuntu based distros:
```sh
sudo apt install sqlite3 python2
```

### Open port 3001 if you have a firewall

If not, skip this part. The port is ready to use.

This example is for `ufw`. Consult docs of your firewall if you use a different one.

Open up a console window with SSH. And login as root

```sh
$ sudo su
```

Open up port 3001 on your machine and make sure it has been added to the list.

```sh
ufw allow 3001 comment 'allow Sphinx-Chat'
```

To check: `ufw status` should print something like:

```
> Status: active
>
> To                         Action      From
> --                         ------      ----
> 3001 (v6)                   ALLOW       Anywhere (v6)              # Sphinx-Chat
```

If you plan on setting up forwarding from an external domain using nginx (following instructions further down), we'll want to open the port that nginx will be listening on, which we'll set to 54001 for the rest of this walk-thru.

```sh
ufw allow 54001 comment 'allow nginx'
```

To check: `ufw status` should print something like:

```
> Status: active
>
> To                         Action      From
> --                         ------      ----
> 54001 (v6)                  ALLOW       Anywhere (v6)              # nginx
```

### Download

login as user bitcoin.

```sh
$ sudo su bitcoin
$ cd
```

Clone the repository from Github and install the package.

**Note**: `npm install` will most likely fail on node v17 because of the grpc dependency.
A downgrade to node v16 is recommended.

```sh
$ git clone https://github.com/stakwork/sphinx-relay
$ cd sphinx-relay
$ npm install
```

### Configure

Edit the "production" section of config/app.json.

```sh
$ cd config
$ nano app.json
```

Change the following 3 lines:

```
"macaroon_location": "/home/bitcoin/.lnd/data/chain/bitcoin/mainnet/admin.macaroon",
"tls_location": "/home/bitcoin/.lnd/tls.cert",
"lnd_log_location": "/home/bitcoin/.lnd/logs/bitcoin/mainnet/lnd.log",
```

Edit the `public_url` in config/app.json to equal your public IP or fully qualified domain name

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

Edit the `public_url` in config/app.json to equal your public IP or fully qualified domain name

**note:** Sphinx client uses HTTP to communicate with **sphinx-relay**. Since setting up SSL on a local network is problematic (you don't have any domain names to authenticate with certificates), you have to rely on your local network security. Below is an example of how Sphinx/sphinx-relay communications look like in **tcpdump**:

```
{"success":true,"response":{"seen":false,"id":393,"chat_id":1,"uuid":"iJ8xow2hhR4AvLj8SGg3Eu","type":0,"sender":1,"amount":0,"date":"2020-09-15T20:49:36.000Z","message_content":"edNsPx6GmrXlM2jPwphOMaGPblpRxvkrYJcvuK2TEZDCTdFp3dFqKeZaWZS64vd/AlQCK9NQ754PWqwQHON1Ox3MMIb8SiD87WRlYSIWqAKy3PsipGiq99qDr/U5Cky7T+VKbAQyjGl4KtFo0ZWNJmzSykkjeaqj1xtsipHCAlcDIzE5KV1bomUh6z9/P22nxRfxXALCKQ7TANU0yAVqnoocvVrXNaFC77Q7t9G/zxbnf+fGU8gBEt9R/3AncpTvY7xd/bCe0EjTASj13/P9ZzZBb60LM+MEp4vxMpEwLkLCwREVBUYbac+gtznNOCoYb8u15zz9DwP9qZ49/xZwCw==","remote_message_content":"{\"3\":\"EUlLtTGQToo5MsUxsbyLDnC7jzrDX3vZjLxH48r2Fnqnyi1XWZyf9+PA84934KzqOtUXvmqmV8E5QlNtTXh1pYpOWVuO1yX+0by03BQOuoJaoHRWrRTIHZP2xOff8VufcNmb57M4PgXQaH38V+iFWQkQaBaKmagh74jVfg7kH+ZsqdTBYw7CnFSUKXdc6E8JYeEwIRuCMOHdDB9STyUVdVTm8WtEa2pB6Yagkcx4rsWJY/vbEkjYhSRGb8dO2DESB3KtYtO+J7Xs/Z/Djolk3iFcMb59XVKoIqBbxg+KZPK7Vrv06TtSr4OFSgiSnkyxm+r6TDxiNxVaisAXFWB9cg==\"}","status":0,"created_at":"2020-09-15T20:49:36.000Z","updated_at":"2020-09-15T20:49:36.555Z","status_m
```

_Message payloads are encrypted with **sphinx cypher**, but all metadata is transmitted in cleartext._

#### If you want to connect to your Sphinx-Relay from outside of your local network

**note:** it is recommended to use SSL encryption for any communications between **Sphinx** and **sphinx-relay** outside of a trusted network. [**Docker deployment guide**](docs/docker-deployment.md) sets up SSL encryption for you automatically, you only have to obtain your domain and certificates. If you still want to set up **sphinx-relay** manually, the instructions to set up the SSL are below.

Edit the `public_url` in config/app.json to equal your public IP or fully qualified domain name

Make sure that port 54001 forwarding is properly set up. The network routing should be sending requests from your domain at port 54001 to your router at port 54001 which is where nginx is listening for requests which it will forward within your local network to sphinx-relay which is running on port 3001. This will look something like this:

`my.domain.dev -> 123.456.7.8 [your local network's IP] -> 192.168.1.xxx:54001 [ip where your node is running on your local network] -> nginx (listening on port 54001) -> sphinx-relay (listening on port 3001)`

As noted in the previous section, you might want to protect communications between your Sphinx client and **sphinx-relay** with SSL.

In order to do that, obtain a domain and an SSL certificate for your **sphinx-relay** server and set up a reverse proxy with NGINX (or a more lightweight alternative).

##### With apach2 and certbot

Install Apache2 Web Server on your machine.

Edit `/etc/apache2/sites-enabled/000-default.conf` or create the file if it doesn't exist.

Use the following config: (Note that there is no SSL yet here, certbot does that for us)
```
<VirtualHost *:80>
    ServerName example.com

    DocumentRoot /var/www/html
    ServerAlias example.com

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined

    ProxyPreserveHost On
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
</VirtualHost>

```

Use an open port (forwarded by your router) for the VirtualHost. Certbot needs to check that this domain and server
is yours in order to give out a certificate.

Now go to [the Certbot website](https://certbot.eff.org/instructions?ws=apache) and select Apache for web server
and your OS/distro in the next dropdown.

Follow the instructions from certbot and eventually run it with `sudo certbot --apache`. You will be asked some
information in the process.

After this, open the config file again. A new VirtualHost was added by certbot. You can remove the VirtualHost which
was used during the process and you can change the port of the newly created one.

When done configuring, restart apache2
```sh
sudo systemctl restart apache2
```

In Sphinx you can connect to **https://example.com:port/**. (Replace `port` with your chosen port and example.com
with your own domain name)

##### With nginx and acme.sh

We recommend using Let's Encrypt service to obtain a free SSL certificate and [**acme.sh**](https://acme.sh) for setting it up and renewals. Note that acme.sh now has their default issuer set to zerossl which could produce errors. Lets Encrypt meanwhile may include an obsolete certificate in their chain which can also cause problems. If you see either of these, you can use these commands to fix (after installation of `acme.sh`):

```sh
$ acme.sh  --set-default-ca  --server letsencrypt
$ acme.sh  --set-default-chain  --preferred-chain  ISRG  --server letsencrypt
```

The rest of the `acme.sh` instructions should work as is.

To configure NGINX as an SSL reverse proxy:

```sh
$ sudo apt install nginx

sudo nano /etc/nginx/sites-available/YOUR-DOMAIN
```

Use the following NGINX config:

```
server {
  listen 54001 ssl; # listening on port 54001 to forward to sphinx-relay at 3001

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
    proxy_pass http://localhost:3001;
    proxy_read_timeout 90;
  }

} # Don't leave this out! It "closes" the server block we started this file with.
```

Save and exit:
`Ctrl + X`

`Y`

`Enter`

To make the file active, we will need to link the file in the sites-available folder to a location within the sites-enabled folder. Again, change YOUR-DOMAIN here with the actual name of the file you created earlier.

```sh
ln -s /etc/nginx/sites-avaialable/YOUR-DOMAIN /etc/nginx/sites-enabled/YOUR-DOMAIN.conf
```

To test your NGINX configuration:

```sh
$ nginx -t
```

To start your new NGINX SSL proxy:

```sh
$ sudo systemctl restart nginx
```

### Activate keysend

We need LND to run with keysend activated.

Edit `~/.lnd/lnd.conf` (create the file if it doesn't exist)

Add the following line if it is not there yet.
```
accept-keysend=true
```

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

Edit the `public_url` in config/app.json to equal your public IP or fully qualified domain name.

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
"tls_location": "/home/bitcoin/.lnd/tls.cert",
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

Edit the `public_url` in config/app.json to equal the local IP address of your node

#### If you want to connect to your Sphinx-Relay from outside of your local network

Edit the `public_url` in config/app.json to equal your public IP or fully qualified domain name

> Make sure that port 3001 forwarding is properly set up.

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

[Back to README](https://github.com/stakwork/sphinx-relay/blob/master/README.md)
