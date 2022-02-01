# Sphinx Relay Greenlight Install Process

## C-Lightning

`cd ~`

`sudo apt update`

`sudo apt upgrade`

```
sudo apt-get install -y \
  autoconf automake build-essential git libtool libgmp-dev \
  libsqlite3-dev python3 python3-mako net-tools zlib1g-dev libsodium-dev \
  gettext
```

`curl -sL https://deb.nodesource.com/setup_14.x | sudo bash -`

`sudo apt-get install -y nodejs`

`git clone https://github.com/cdecker/lightning.git`

`cd lightning`

`git checkout libhsmd-node`

`cd contrib/libhsmd_node`

`sudo npm install -g node-gyp`

`npm install node-addon-api bindings`

`make all`

## Sphinx-Relay

`cd ~`

`sudo apt install sqlite3`

`git clone https://github.com/stakwork/sphinx-relay`

`cd sphinx-relay`

`npm install`

`sudo npm link ../lightning/contrib/libhsmd_node`

`cd config`

Use your favorite editor to make the following modifications on `config.json`

```diff
diff --git a/config/config.json b/config/config.json
index 79a01b68..fe5758af 100644
--- a/config/config.json
+++ b/config/config.json
@@ -13,6 +13,6 @@
   },
   "production": {
     "dialect": "sqlite",
-    "storage": "/relay/.lnd/sphinx.db"
+    "storage": "/home/pi/sphinx.db"
   }
```

Also make the following modifications to `app.json`

```diff
diff --git a/config/app.json b/config/app.json
index 8255a2b5..07879e40 100644
--- a/config/app.json
+++ b/config/app.json
@@ -28,9 +28,10 @@
     "proxy_admin_token": "d86hnf8irgbcv093jdns"
   },
   "production": {
+    "connect_ui": true,
+    "lightning_provider": "GREENLIGHT",
+    "logging": "TRIBES,MEME,NOTIFICATION,EXPRESS,NETWORK,DB,LSAT"
     "senza_url": "https://staging.senza.us/api/v2/",
     "macaroon_location": "/relay/.lnd/data/chain/bitcoin/mainnet/admin.macaroon",
-    "tls_location": "/relay/.lnd/tls.cert",
     "lnd_log_location": "/relay/.lnd/logs/bitcoin/mainnet/lnd.log",
     "node_ip": "localhost",
     "lnd_ip": "localhost",
```

Finally, while still standing in the `config` directory, run

`npm run prod`

### When the master updates either `package.json` or `package-lock.json`

1. Stash the local changes
2. `git pull` on master to grab the latest changes
3. `git stash pop`
4. Manually resolve the conflicts
5. `git add` the two files
6. `npm install` on the root sphinx-relay directory
