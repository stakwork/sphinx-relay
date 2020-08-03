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
