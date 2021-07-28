# Sphinx Chat Greenlight



## Getting Started

1. Flash our installer onto your raspberry pi using your preferred method. We like to use balena echer, which you can download [here](https://www.balena.io/etcher/).
2. Follow the instructions [here](https://www.raspberrypi.org/documentation/configuration/wireless/headless.md) to set up your raspberry pi's connection if you are connecting to a wireless network.
3. Place your sd card into the raspberry pi, and plug the pi into a power source.
4. Wait around 5 minutes.
5. Load the page `http://raspberrypi.local` on your computer, and follow the instructions there.

## Backing Up Your Funds and Data

All you need to do is backup the file `home/pi/sphinx.db` and the file `home/pi/sphinx-relay/creds/hsm_secret`

Unlike a lightning node, these files do not backup the state of your channels - they backup your sphinx chat data and the secret from which all your bitcoin keys are derived.

## Using the app outside the home network

Here's how you can connect your sphinx chat app to your raspberry pi at home.

1. Tell your router to forward all traffic on port 3001 to your raspberry pi.
2. Set up a dynamic DNS service and point it to your router.
3. SSH into your raspberry pi using the username `pi` and the password `raspberry` - take the opportunity to change it using the command `passwd`.
4. Edit the `public_url` field of the production section of the file `~/sphinx-relay/config/app.json` with the domain name provided by your DNS service as shown below:

```diff
     "hub_check_invite_url": "https://hub.sphinx.chat/check_invite",
     "media_host": "memes.sphinx.chat",
     "tribes_host": "tribes.sphinx.chat",
-    "public_url": "",
+    "public_url": "http://www.example.com:3001",
     "connection_string_path": "connection_string.txt",
     "ssl": {
       "enabled": false,
```

5. On your computer, connect to an external network, and load the page `http://www.[your domain name]:3001/connect`.
6. Uninstall your app from your phone ( don't worry, your messages and keys are all backed up on your raspberry pi, so you won't lose anything ).
7. Reinstall the app, and scan the qr code shown in step 5.
8. Done! Congratulations, you are now able to use your sphinx chat app wherever you go!

## File Integrity

The sha256 of the zip file you will download from us this the following:

`87079b8a0ff8ff5911ef68d66d46364c5dc71ec07b744d85e4bf9cdbc63375ee`

On macOS, you can check it by running this command in the directory where you have the file:

`shasum -a 256 sphinx_greenlight_0_1.img.zip`

