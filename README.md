# Relay

**Relay** is a Node.js wrapper around [LND](https://github.com/lightningnetwork/lnd), handling connectivity and storage for [**Sphinx**](https://sphinx.chat). Communication between Relay nodes takes place entirely on the Lightning Network, so is decentralized, untraceable, and encrypted. Message content is also end-to-end encrypted using client public keys, on the **Sphinx** app itself. 

![Relay](https://github.com/stakwork/sphinx-relay/raw/master/public/relay.jpg)

Relay stores:
- Aliases
- Messages
- Recurring payment configurations
- Invites (so you can add your friends)
- Media Keys: keys for decrypting media files, asymetrically encrypted for each contact in a chat

# run your own sphinx node

You can run your own Sphinx node in order to have full ownership over your communication!

### download

`git clone https://github.com/stakwork/sphinx-relay`

`cd sphinx-relay`

`npm install`

### dependencies

sqlite3: `apt-get install sqlite3`

### configure

Edit the "production" section of config/app.json:
 - Change `macaroon_location` to the location of your LND admin macaroon
 - Change `tls_location` to the location of your LND cert

To connect to your app
 - `export NODE_IP=x.x.x.x` (you can use a domain name instead if you have that set up)
 - For extra security, `export USE_PASSWORD=true`

### run

`npm run prod`

When Relay starts up, it will print a QR in the terminal. You can scan this in your app (right now Android only) to connect!

# Roadmap

- linking recurring payments to files, to enable use cases such as subscribing to podcasts with BTC!