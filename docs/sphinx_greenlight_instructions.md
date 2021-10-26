# Sphinx Chat Greenlight



## Getting Started

1. Grab our installer zip file from [here](https://drive.google.com/file/d/18IADHiNg7Ach3h0O3y5WPfbL5KEgocKE/view?usp=sharing). See the file integrity section below if you'd like to cross check this file.
2. Flash our installer onto your raspberry pi using your preferred method. We like to use balena etcher, which you can download [here](https://www.balena.io/etcher/).
3. Follow the instructions [here](https://www.raspberrypi.org/documentation/computers/configuration.html#setting-up-a-headless-raspberry-pi) to set up your raspberry pi's connection if you are connecting to a wireless network.
4. Place your sd card into the raspberry pi, and plug the pi into a power source.
5. Wait around 5 minutes.
6. If you are on Linux/MacOS load the page `http://raspberrypi.local:3001/connect` and if you are on Windows, load the page `http://raspberrypi:3001/connect`. Follow the instructions there.

When you can, SSH into your raspberry pi using the username `pi` and the password `raspberry`, and change the password with the command `passwd`

## File Integrity

The sha256 of the zip file you will download from us is the following:

```
7c49c484b2a0e7f8ffe3b6076d2ba5f941b6a665096b984ad9899c7d1d59e491
```

On macOS, you can check it by running this command in the directory where you have the file:

`shasum -a 256 sphinx_greenlight_0_5.img.zip`

## Backing Up Your Funds and Data

All you need to do is backup the file `home/pi/sphinx.db` and the file `home/pi/sphinx-relay/creds/hsm_secret`

Unlike a lightning node, these files do not backup the state of your channels - they backup your sphinx chat data and the secret from which all your bitcoin keys are derived.

## Using the app outside the home network

Here's how you can connect your sphinx chat app to your raspberry pi at home.

1. Before anything, note that your app talks to your raspberry pi over http. All message payloads are encrypted, but the metadata is sent in plaintext to sphinx-relay. So if you'd like to set up https, you can find instructions [here](./raspiblitz_deployment.md).
2. Tell your router to forward all traffic on port 3001 to your raspberry pi.
3. Set up a dynamic DNS service and point it to your router. We like to use [dynDNS](https://account.dyn.com/).
4. Go to the advanced page in your sphinx chat app, and point the server setting to the domain name provided by your dynamic DNS service.
5. Done! Congratulations, you are now able to use your sphinx chat app wherever you go!

