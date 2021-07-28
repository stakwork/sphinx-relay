# Sphinx Chat Greenlight



## Getting Started

1. Flash our installer onto your raspberry pi using your preferred method.
2. Follow the instructions [here](https://www.raspberrypi.org/documentation/configuration/wireless/headless.md) to set up your raspberry pi's connection if you are connecting to a wireless network.
3. Place your sd card into the raspberry pi, and plug the pi into a power source.
4. Wait around 5 minutes.
5. Load the page `http://raspberrypi.local` on your computer, and follow the instructions there.

## Backing Up Your Funds and Data

All you need to do is backup the file `home/pi/sphinx.db` and the file `home/pi/sphinx-relay/creds/hsm_secret`

Unlike a lightning node, these files do not backup the state of your channels - they backup your sphinx chat data and the secret from which all your bitcoin keys are derived.

## Caveats

Unfortunately at the moment we are still working on being able to connect to the raspberry pi with the sphinx chat app from an external network - so don't expect your node to be reachable from outside your home network yet! :smile:

## File Integrity

The sha256 of the zip file you will download from us this the following:

`87079b8a0ff8ff5911ef68d66d46364c5dc71ec07b744d85e4bf9cdbc63375ee`

On macOS, you can check it by running this command in the directory where you have the file:

`shasum -a 256 sphinx_greenlight_0_1.img.zip`

